import "server-only";

import { connect as tlsConnect } from "node:tls";
import { connect as netConnect } from "node:net";
import { isIP, isIPv4 } from "node:net";
import { Resolver, reverse } from "node:dns/promises";
import { createHash } from "node:crypto";

import { env } from "@/lib/env";
import {
  assertPublicAddress,
  extractHost,
  NetGuardError,
  parsePort,
  resolvePublicTarget,
  withConcurrency,
  withTimeout,
} from "@/lib/net-guard";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/rate-limit";

const resolver = () => {
  const instance = new Resolver();
  instance.setServers(["1.1.1.1", "8.8.8.8"]);
  return instance;
};

export function hashClientIp(ip: string): string {
  return createHash("sha256")
    .update(`${env.authSecret}:tool:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

async function logUsage(input: {
  tool: string;
  target: string;
  ip: string;
  ok: boolean;
  durationMs: number;
  error?: string;
}): Promise<void> {
  await prisma.toolUsageLog
    .create({
      data: {
        tool: input.tool,
        target: input.target.slice(0, 300),
        ipHash: hashClientIp(input.ip),
        ok: input.ok,
        durationMs: input.durationMs,
        error: input.error?.slice(0, 300),
      },
    })
    .catch(() => undefined);
}

export async function runLogged<T>(
  request: Request,
  tool: string,
  target: string,
  work: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  const ip = clientIp(request);
  try {
    const result = await withConcurrency(work);
    await logUsage({
      tool,
      target,
      ip,
      ok: true,
      durationMs: Date.now() - started,
    });
    return result;
  } catch (error) {
    await logUsage({
      tool,
      target,
      ip,
      ok: false,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : "failed",
    });
    throw error;
  }
}

const RECORD_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "PTR"] as const;
export type DnsRecordType = (typeof RECORD_TYPES)[number];

export async function lookupDns(
  name: string,
  types: DnsRecordType[] = [...RECORD_TYPES],
): Promise<{
  name: string;
  records: Array<{ type: string; value: string }>;
}> {
  const host = extractHost(name);
  if (!host) throw new NetGuardError("Please enter a domain or hostname.", "invalid");
  if (isIP(host)) assertPublicAddress(host);

  const dns = resolver();
  const records: Array<{ type: string; value: string }> = [];
  const wanted = types.filter((type) => RECORD_TYPES.includes(type));

  await Promise.all(
    wanted.map(async (type) => {
      try {
        switch (type) {
          case "A":
            for (const value of await dns.resolve4(host)) records.push({ type, value });
            break;
          case "AAAA":
            for (const value of await dns.resolve6(host)) records.push({ type, value });
            break;
          case "MX":
            for (const row of await dns.resolveMx(host)) {
              records.push({ type, value: `${row.priority} ${row.exchange}` });
            }
            break;
          case "TXT":
            for (const chunks of await dns.resolveTxt(host)) {
              records.push({ type, value: chunks.join("") });
            }
            break;
          case "NS":
            for (const value of await dns.resolveNs(host)) records.push({ type, value });
            break;
          case "CNAME":
            for (const value of await dns.resolveCname(host)) records.push({ type, value });
            break;
          case "PTR": {
            if (!isIP(host)) break;
            assertPublicAddress(host);
            for (const value of await reverse(host)) records.push({ type, value });
            break;
          }
        }
      } catch (error) {
        if (error instanceof NetGuardError) throw error;
        // Missing record types are omitted rather than reported as errors.
      }
    }),
  );

  return { name: host, records: records.sort((a, b) => a.type.localeCompare(b.type)) };
}

export async function tcpConnect(
  input: string,
  port: number,
): Promise<{ host: string; address: string; port: number; latencyMs: number }> {
  const target = await resolvePublicTarget(input);
  const address = target.addresses[0];
  const latencyMs = await connectOnce(address, port);
  return { host: target.host, address, port, latencyMs };
}

export async function portCheck(
  input: string,
  port: number,
): Promise<{
  host: string;
  address: string;
  port: number;
  open: boolean;
  latencyMs: number | null;
}> {
  const target = await resolvePublicTarget(input);
  const address = target.addresses[0];
  try {
    const latencyMs = await connectOnce(address, port);
    return { host: target.host, address, port, open: true, latencyMs };
  } catch (error) {
    if (error instanceof NetGuardError && error.code === "timeout") {
      return { host: target.host, address, port, open: false, latencyMs: null };
    }
    throw error;
  }
}

function connectOnce(address: string, port: number): Promise<number> {
  return withTimeout(
    new Promise<number>((resolve, reject) => {
      const started = Date.now();
      const socket = netConnect({ host: address, port, family: 0 }, () => {
        const latency = Date.now() - started;
        socket.end();
        resolve(latency);
      });
      socket.on("error", (error) => {
        reject(new NetGuardError(error.message || "Connection failed.", "refused"));
      });
    }),
    4_000,
    "The connection timed out.",
  );
}

export async function whoisLookup(
  query: string,
): Promise<{ query: string; server: string; text: string }> {
  const cleaned = query.trim().toLowerCase().replace(/\s+/g, "");
  if (!cleaned || cleaned.length > 253) {
    throw new NetGuardError("Please enter a domain or IP address.", "invalid");
  }
  if (/[\n\r@]/.test(cleaned)) {
    throw new NetGuardError("That query is not allowed.", "invalid");
  }

  const first = await whoisQuery("whois.iana.org", cleaned);
  const referral =
    first.match(/^refer:\s+(\S+)/im)?.[1] ?? first.match(/^whois:\s+(\S+)/im)?.[1];

  if (referral && referral !== "whois.iana.org" && isWhoisServer(referral)) {
    const text = await whoisQuery(referral, cleaned);
    return { query: cleaned, server: referral, text: text.slice(0, 16_000) };
  }

  return { query: cleaned, server: "whois.iana.org", text: first.slice(0, 16_000) };
}

function isWhoisServer(host: string): boolean {
  return /^whois\.[a-z0-9.-]+$/i.test(host) && host.length < 80;
}

function certName(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function whoisQuery(server: string, query: string): Promise<string> {
  return withTimeout(
    new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const socket = netConnect({ host: server, port: 43 }, () => {
        socket.write(`${query}\r\n`);
      });
      socket.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      socket.on("end", () =>
        resolve(Buffer.concat(chunks).toString("utf8").slice(0, 20_000)),
      );
      socket.on("error", (error) =>
        reject(new NetGuardError(error.message || "WHOIS lookup failed.", "refused")),
      );
    }),
    8_000,
    "The WHOIS lookup timed out.",
  );
}

export async function inspectTls(
  input: string,
  port = 443,
): Promise<{
  host: string;
  address: string;
  protocol: string | null;
  authorised: boolean;
  fingerprintSha256: string | null;
  subject: string | null;
  issuer: string | null;
  validFrom: string | null;
  validTo: string | null;
  altNames: string[];
  daysRemaining: number | null;
}> {
  const target = await resolvePublicTarget(input);
  const address = target.addresses[0];

  const details = await withTimeout(
    new Promise<{
      protocol: string | null;
      authorised: boolean;
      fingerprintSha256: string | null;
      subject: string | null;
      issuer: string | null;
      validFrom: string | null;
      validTo: string | null;
      altNames: string[];
    }>((resolve, reject) => {
      const socket = tlsConnect(
        {
          host: address,
          servername: target.host,
          port,
          rejectUnauthorized: false,
          timeout: 4_000,
        },
        () => {
          const cert = socket.getPeerCertificate();
          const authorised = socket.authorized;
          const protocol = socket.getProtocol();
          const raw = cert.raw as Buffer | undefined;
          socket.end();
          resolve({
            protocol,
            authorised,
            fingerprintSha256: raw
              ? createHash("sha256").update(raw).digest("hex")
              : (cert.fingerprint256 ?? null),
            subject: certName(cert.subject?.CN),
            issuer: certName(cert.issuer?.CN),
            validFrom: cert.valid_from ? new Date(cert.valid_from).toISOString() : null,
            validTo: cert.valid_to ? new Date(cert.valid_to).toISOString() : null,
            altNames: String(cert.subjectaltname ?? "")
              .split(",")
              .map((part) => part.replace(/^DNS:/i, "").trim())
              .filter(Boolean),
          });
        },
      );
      socket.on("error", (error) =>
        reject(new NetGuardError(error.message || "TLS handshake failed.", "refused")),
      );
    }),
    6_000,
    "The TLS handshake timed out.",
  );

  const daysRemaining = details.validTo
    ? Math.floor((Date.parse(details.validTo) - Date.now()) / 86_400_000)
    : null;

  return { host: target.host, address, ...details, daysRemaining };
}

const HEADER_NAMES = [
  "strict-transport-security",
  "content-security-policy",
  "content-security-policy-report-only",
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
] as const;

export async function checkSecurityHeaders(input: string): Promise<{
  url: string;
  status: number;
  redirectsTo: string | null;
  headers: Array<{ name: string; present: boolean; value: string | null }>;
}> {
  const target = await resolvePublicTarget(input);
  const candidate = input.includes("://") ? input.trim() : `https://${target.host}`;
  const parsed = new URL(candidate);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new NetGuardError("Only http and https URLs are accepted.", "invalid");
  }
  parsed.hostname = target.host;

  const response = await withTimeout(
    fetch(parsed.toString(), {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "WirelessCom-HeaderCheck/1.0" },
      signal: AbortSignal.timeout(6_000),
    }),
    7_000,
    "The request timed out.",
  );

  return {
    url: parsed.toString(),
    status: response.status,
    redirectsTo: response.headers.get("location"),
    headers: HEADER_NAMES.map((name) => ({
      name,
      present: response.headers.has(name),
      value: response.headers.get(name),
    })),
  };
}

export async function domainSecurity(name: string): Promise<{
  name: string;
  spf: string | null;
  dkimSelectors: Array<{ selector: string; present: boolean; value: string | null }>;
  dmarc: string | null;
  dnssec: boolean | null;
  mx: string[];
}> {
  const host = extractHost(name);
  if (!host) throw new NetGuardError("Please enter a domain.", "invalid");
  const dns = resolver();

  const txt = await dns.resolveTxt(host).catch(() => [] as string[][]);
  const joined = txt.map((chunks) => chunks.join(""));
  const spf = joined.find((row) => row.toLowerCase().startsWith("v=spf1")) ?? null;

  const dmarcRecords = await dns.resolveTxt(`_dmarc.${host}`).catch(() => [] as string[][]);
  const dmarc =
    dmarcRecords
      .map((chunks) => chunks.join(""))
      .find((row) => row.toLowerCase().startsWith("v=dmarc1")) ?? null;

  const selectors = ["default", "google", "selector1", "selector2", "s1", "s2", "k1"];
  const dkimSelectors = await Promise.all(
    selectors.map(async (selector) => {
      const records = await dns
        .resolveTxt(`${selector}._domainkey.${host}`)
        .catch(() => [] as string[][]);
      const value = records.map((chunks) => chunks.join("")).find((row) =>
        /v=dkim1/i.test(row),
      );
      return { selector, present: Boolean(value), value: value ?? null };
    }),
  );

  const mx = (await dns.resolveMx(host).catch(() => [])).map(
    (row) => `${row.priority} ${row.exchange}`,
  );

  return { name: host, spf, dkimSelectors, dmarc, dnssec: null, mx };
}

/** DNSBL lookup. Labelled as such — this is not a commercial threat feed. */
export async function dnsblLookup(ip: string): Promise<{
  ip: string;
  listed: Array<{ zone: string; listed: boolean; answer: string | null }>;
}> {
  if (!isIPv4(ip)) {
    throw new NetGuardError("DNSBL checks currently support IPv4 addresses only.", "invalid");
  }
  assertPublicAddress(ip);

  const reversed = ip.split(".").reverse().join(".");
  const zones = ["zen.spamhaus.org", "bl.spamcop.net", "b.barracudacentral.org"];
  const dns = resolver();

  const listed = await Promise.all(
    zones.map(async (zone) => {
      const answer = await dns.resolve4(`${reversed}.${zone}`).catch(() => [] as string[]);
      return { zone, listed: answer.length > 0, answer: answer[0] ?? null };
    }),
  );

  return { ip, listed };
}

export function parsePortSafe(value: unknown, fallback = 443): number {
  return parsePort(value, fallback);
}
