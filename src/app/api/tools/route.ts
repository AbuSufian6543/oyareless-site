import { NextResponse } from "next/server";
import { z } from "zod";

import { NetGuardError } from "@/lib/net-guard";
import {
  checkSecurityHeaders,
  dnsblLookup,
  domainSecurity,
  inspectTls,
  lookupDns,
  parsePortSafe,
  portCheck,
  runLogged,
  tcpConnect,
  whoisLookup,
  type DnsRecordType,
} from "@/lib/net-tools";
import { lookupOui } from "@/lib/oui";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  tool: z.enum([
    "dns",
    "tcp",
    "port",
    "whois",
    "tls",
    "headers",
    "domain-security",
    "dnsbl",
    "oui",
    "ip",
  ]),
  target: z.string().trim().max(253).optional().default(""),
  port: z.number().int().min(1).max(65535).optional(),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`tools:${ip}`, 30, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many lookups from this connection. Please wait a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const { tool, target } = parsed.data;

  try {
    switch (tool) {
      case "ip":
        return NextResponse.json({
          ip: ip === "unknown" ? null : ip,
          note: "This is the address our server sees, after your reverse proxy.",
        });
      case "oui": {
        const result = lookupOui(target);
        if (!result) {
          return NextResponse.json({ message: "Please enter a MAC address." }, { status: 400 });
        }
        return NextResponse.json({
          ...result,
          note:
            result.vendor == null
              ? "Not in the bundled registry. The IEEE public listing may still have it."
              : "Looked up from a bundled subset of the IEEE OUI registry.",
        });
      }
      case "dns":
        return NextResponse.json(
          await runLogged(request, "dns", target, () =>
            lookupDns(target, ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "PTR"] as DnsRecordType[]),
          ),
        );
      case "tcp":
        return NextResponse.json(
          await runLogged(request, "tcp", target, () =>
            tcpConnect(target, parsePortSafe(parsed.data.port, 443)),
          ),
        );
      case "port":
        return NextResponse.json(
          await runLogged(request, "port", target, () =>
            portCheck(target, parsePortSafe(parsed.data.port, 443)),
          ),
        );
      case "whois":
        return NextResponse.json(
          await runLogged(request, "whois", target, () => whoisLookup(target)),
        );
      case "tls":
        return NextResponse.json(
          await runLogged(request, "tls", target, () =>
            inspectTls(target, parsePortSafe(parsed.data.port, 443)),
          ),
        );
      case "headers":
        return NextResponse.json(
          await runLogged(request, "headers", target, () => checkSecurityHeaders(target)),
        );
      case "domain-security":
        return NextResponse.json(
          await runLogged(request, "domain-security", target, () => domainSecurity(target)),
        );
      case "dnsbl":
        return NextResponse.json(
          await runLogged(request, "dnsbl", target, () => dnsblLookup(target)),
        );
      default:
        return NextResponse.json({ message: "Unknown tool." }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof NetGuardError) {
      const status =
        error.code === "busy" ? 429 : error.code === "timeout" ? 504 : 400;
      return NextResponse.json({ message: error.message, code: error.code }, { status });
    }
    console.error("[tools]", error);
    return NextResponse.json(
      { message: "The lookup failed. Please try again." },
      { status: 500 },
    );
  }
}
