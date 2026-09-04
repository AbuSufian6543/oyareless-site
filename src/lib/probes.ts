import "server-only";

import { connect as netConnect, isIP } from "node:net";
import { Resolver } from "node:dns/promises";

import {
  extractHost,
  isPublicIPv4,
  isPublicIPv6,
  NetGuardError,
  parsePort,
  resolvePublicTarget,
  withTimeout,
} from "@/lib/net-guard";
import { prisma } from "@/lib/prisma";
import type { ProbeKind } from "@/generated/prisma/client";

/**
 * Runs a single health probe against an admin-configured endpoint.
 *
 * Uses the same public-address rules as the visitor tools: an endpoint that
 * points at RFC1918 or metadata is recorded as a failed check rather than
 * scanned.
 */
export async function probeEndpoint(endpoint: {
  id: string;
  kind: ProbeKind;
  target: string;
  port: number | null;
  expectStatus: number;
  timeoutMs: number;
}): Promise<{ ok: boolean; latencyMs: number | null; statusCode: number | null; error: string | null }> {
  const started = Date.now();
  try {
    if (endpoint.kind === "HTTP") {
      const result = await probeHttp(endpoint);
      return { ...result, latencyMs: Date.now() - started };
    }
    if (endpoint.kind === "TCP") {
      const host = extractHost(endpoint.target);
      if (!host) throw new NetGuardError("Invalid target.", "invalid");
      const resolved = await resolvePublicTarget(host);
      const port = parsePort(endpoint.port ?? 443);
      await withTimeout(
        connect(resolved.addresses[0], port),
        endpoint.timeoutMs,
        "Timed out.",
      );
      return { ok: true, latencyMs: Date.now() - started, statusCode: null, error: null };
    }
    const host = extractHost(endpoint.target);
    if (!host) throw new NetGuardError("Invalid target.", "invalid");
    const dns = new Resolver();
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
    const answers = await withTimeout(
      dns.resolve4(host).catch(() => dns.resolve6(host)),
      endpoint.timeoutMs,
      "DNS timed out.",
    );
    if (!answers.length) {
      return { ok: false, latencyMs: Date.now() - started, statusCode: null, error: "No records." };
    }
    return { ok: true, latencyMs: Date.now() - started, statusCode: null, error: null };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      statusCode: null,
      error: error instanceof Error ? error.message.slice(0, 200) : "Probe failed.",
    };
  }
}

async function probeHttp(endpoint: {
  target: string;
  expectStatus: number;
  timeoutMs: number;
}): Promise<{ ok: boolean; statusCode: number | null; error: string | null; latencyMs?: number }> {
  const url = endpoint.target.includes("://")
    ? new URL(endpoint.target)
    : new URL(`https://${endpoint.target}`);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new NetGuardError("Only http/https probes are allowed.", "invalid");
  }
  const resolved = await resolvePublicTarget(url.hostname);
  url.hostname = resolved.host;

  const response = await fetch(url.toString(), {
    method: "GET",
    redirect: "manual",
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 (compatible; StatusProbe/1.0)",
    },
    signal: AbortSignal.timeout(endpoint.timeoutMs),
  });

  const ok = httpStatusIsHealthy(response.status, endpoint.expectStatus);
  return {
    ok,
    statusCode: response.status,
    error: ok ? null : `Expected a healthy response, got ${response.status}.`,
  };
}

/**
 * Default HTTP monitors treat any answering origin as up: 2xx–4xx, including
 * login walls, bot challenges, and redirects. 5xx and network failures are
 * down. An explicit expected status (anything other than 200) still requires
 * an exact match, for dedicated health URLs.
 */
export function httpStatusIsHealthy(status: number, expectStatus: number): boolean {
  if (expectStatus !== 200) return status === expectStatus;
  return status >= 200 && status < 500;
}

function connect(address: string, port: number): Promise<void> {
  if (isIP(address) === 4 && !isPublicIPv4(address)) {
    throw new NetGuardError("Private addresses are not probed.", "blocked");
  }
  if (isIP(address) === 6 && !isPublicIPv6(address)) {
    throw new NetGuardError("Private addresses are not probed.", "blocked");
  }
  return new Promise((resolve, reject) => {
    const socket = netConnect({ host: address, port }, () => {
      socket.end();
      resolve();
    });
    socket.on("error", (error) => reject(error));
  });
}

/** Probes enabled endpoints whose last check is older than their interval. */
export async function refreshStaleProbes(
  options: { limit?: number; concurrency?: number } = {},
): Promise<void> {
  const limit = options.limit ?? 12;
  const concurrency = Math.max(1, options.concurrency ?? 4);

  const endpoints = await prisma.monitoredEndpoint
    .findMany({
      where: { enabled: true },
      select: {
        id: true,
        kind: true,
        target: true,
        port: true,
        expectStatus: true,
        timeoutMs: true,
        intervalSec: true,
        checks: {
          orderBy: { checkedAt: "desc" },
          take: 1,
          select: { checkedAt: true },
        },
      },
    })
    .catch(() => []);

  const now = Date.now();
  const stale = endpoints.filter((endpoint) => {
    const last = endpoint.checks[0]?.checkedAt;
    if (!last) return true;
    return now - last.getTime() > endpoint.intervalSec * 1000;
  });

  const batch = stale.slice(0, limit);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < batch.length) {
      const endpoint = batch[next];
      next += 1;
      if (!endpoint) return;
      const result = await probeEndpoint(endpoint);
      await prisma.statusCheck
        .create({
          data: {
            endpointId: endpoint.id,
            ok: result.ok,
            latencyMs: result.latencyMs,
            statusCode: result.statusCode,
            error: result.error,
          },
        })
        .catch(() => undefined);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, batch.length) }, () => worker()),
  );
}
