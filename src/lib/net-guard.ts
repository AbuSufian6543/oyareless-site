import "server-only";

import { isIP, isIPv4, isIPv6 } from "node:net";
import { lookup, Resolver } from "node:dns/promises";

/**
 * Guards every outbound network tool so a visitor cannot use this server as a
 * scanner against loopback, RFC1918, link-local or cloud-metadata addresses.
 *
 * Re-validates after DNS resolution to stop DNS rebinding: a hostname that
 * looks public must not resolve to a private address between the check and the
 * connect.
 */

export class NetGuardError extends Error {
  constructor(
    message: string,
    public code:
      | "blocked"
      | "invalid"
      | "timeout"
      | "busy"
      | "refused" = "blocked",
  ) {
    super(message);
    this.name = "NetGuardError";
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "ip6-localhost",
  "metadata.google.internal",
  "metadata.goog",
  "kubernetes.default",
  "kubernetes.default.svc",
]);

const METADATA_IPV4 = new Set(["169.254.169.254", "169.254.170.2", "100.100.100.200"]);

const CONNECT_TIMEOUT_MS = 5_000;
const MAX_CONCURRENT = 8;

let inFlight = 0;

export async function withConcurrency<T>(work: () => Promise<T>): Promise<T> {
  if (inFlight >= MAX_CONCURRENT) {
    throw new NetGuardError(
      "The tools are busy. Please try again in a moment.",
      "busy",
    );
  }
  inFlight += 1;
  try {
    return await work();
  } finally {
    inFlight -= 1;
  }
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms = CONNECT_TIMEOUT_MS,
  label = "The request timed out.",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new NetGuardError(label, "timeout")),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type ResolvedTarget = {
  host: string;
  addresses: string[];
};

/**
 * Parses a user-supplied host or URL, resolves it, and refuses anything that
 * is not a globally routable unicast address.
 */
export async function resolvePublicTarget(input: string): Promise<ResolvedTarget> {
  const host = extractHost(input);
  if (!host) {
    throw new NetGuardError("Please enter a hostname, domain or IP address.", "invalid");
  }

  assertHostnameAllowed(host);

  if (isIP(host)) {
    assertPublicAddress(host);
    return { host, addresses: [host] };
  }

  const addresses = await withTimeout(
    lookupAll(host),
    4_000,
    "DNS lookup timed out.",
  );

  if (addresses.length === 0) {
    throw new NetGuardError("That name could not be resolved.", "invalid");
  }

  for (const address of addresses) {
    assertPublicAddress(address);
  }

  return { host, addresses };
}

export function extractHost(input: string): string | null {
  const trimmed = input.trim().toLowerCase().replace(/\.$/, "");
  if (!trimmed || trimmed.length > 253) return null;

  if (isIP(trimmed)) return trimmed;

  try {
    if (trimmed.includes("://")) {
      const url = new URL(trimmed);
      if (url.username || url.password) {
        throw new NetGuardError("Credentials in URLs are not accepted.", "invalid");
      }
      return url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    }
  } catch (error) {
    if (error instanceof NetGuardError) throw error;
    return null;
  }

  // Bare host:port
  if (/^\[[0-9a-f:]+\]:\d+$/i.test(trimmed)) {
    return trimmed.slice(1, trimmed.lastIndexOf("]"));
  }
  if (/^[^/:]+:\d+$/.test(trimmed) && !trimmed.includes("://")) {
    return trimmed.slice(0, trimmed.lastIndexOf(":"));
  }

  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function assertHostnameAllowed(host: string): void {
  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new NetGuardError("That target is not allowed.", "blocked");
  }
  if (host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".localhost")) {
    throw new NetGuardError("That target is not allowed.", "blocked");
  }
}

export function assertPublicAddress(ip: string): void {
  if (isIPv4(ip)) {
    if (!isPublicIPv4(ip)) {
      throw new NetGuardError("Private, loopback and link-local addresses are not allowed.", "blocked");
    }
    return;
  }
  if (isIPv6(ip)) {
    if (!isPublicIPv6(ip)) {
      throw new NetGuardError("Private, loopback and link-local addresses are not allowed.", "blocked");
    }
    return;
  }
  throw new NetGuardError("That is not a valid IP address.", "invalid");
}

export function isPublicIPv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b] = parts;

  if (a === 0 || a === 127 || a === 10) return false;
  if (a === 169 && b === 254) return false;
  if (a === 192 && b === 168) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return false; // benchmarking
  if (a >= 224) return false; // multicast / reserved
  if (METADATA_IPV4.has(ip)) return false;
  return true;
}

export function isPublicIPv6(ip: string): boolean {
  const normalised = expandIPv6(ip);
  if (normalised === "0000:0000:0000:0000:0000:0000:0000:0001") return false;
  if (normalised === "0000:0000:0000:0000:0000:0000:0000:0000") return false;
  const first = normalised.slice(0, 4);
  const n = Number.parseInt(first, 16);
  if ((n & 0xfe00) === 0xfc00) return false; // unique local fc00::/7
  if ((n & 0xffc0) === 0xfe80) return false; // link-local fe80::/10
  if ((n & 0xff00) === 0xff00) return false; // multicast
  if (n === 0x2001 && normalised.startsWith("2001:0000:")) return false; // Teredo often abused
  // IPv4-mapped
  if (normalised.startsWith("0000:0000:0000:0000:0000:ffff:")) {
    const mapped = ipv4FromMapped(normalised);
    return mapped ? isPublicIPv4(mapped) : false;
  }
  return true;
}

function expandIPv6(ip: string): string {
  const [head, tail] = ip.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  const missing = 8 - (headParts.filter(Boolean).length + tailParts.filter(Boolean).length);
  const middle = Array.from({ length: Math.max(missing, 0) }, () => "0");
  const parts = [...headParts.filter(Boolean), ...middle, ...tailParts.filter(Boolean)];
  return parts.map((part) => part.padStart(4, "0")).join(":").toLowerCase();
}

function ipv4FromMapped(expanded: string): string | null {
  const last = expanded.split(":").slice(-2);
  if (last.length !== 2) return null;
  const hi = Number.parseInt(last[0], 16);
  const lo = Number.parseInt(last[1], 16);
  return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
}

async function lookupAll(host: string): Promise<string[]> {
  const resolver = new Resolver();
  resolver.setServers(["1.1.1.1", "8.8.8.8"]);

  const [v4, v6] = await Promise.all([
    resolver.resolve4(host).catch(() => [] as string[]),
    resolver.resolve6(host).catch(() => [] as string[]),
  ]);

  const combined = [...v4, ...v6];
  if (combined.length > 0) return combined;

  const fallback = await lookup(host, { all: true }).catch(() => []);
  return fallback.map((entry) => entry.address);
}

export function parsePort(value: unknown, fallback?: number): number {
  const port =
    typeof value === "number"
      ? value
      : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    if (fallback) return fallback;
    throw new NetGuardError("Port must be between 1 and 65535.", "invalid");
  }
  return port;
}
