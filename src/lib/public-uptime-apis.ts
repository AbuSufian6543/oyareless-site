import "server-only";

import { isCompanyStatusHost } from "@/lib/company-status-hosts";
import { httpStatusIsHealthy } from "@/lib/http-health";

export type PublicUptimeResult = {
  ok: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  error: string | null;
};

const UA = "Mozilla/5.0 (compatible; StatusBoard/1.0; public homepage checks)";
const JSON_HEADERS = {
  Accept: "application/json",
  "User-Agent": UA,
} as const;

/**
 * Ask well-known free public APIs whether a homepage is answering.
 *
 * Runs only on the server. Company-owned hosts are never sent to a third
 * party — callers should fall back to a local probe for those.
 *
 * Returns `null` when every API is unavailable or rate-limited so the caller
 * can check from this server instead of inventing a status.
 */
export async function checkViaPublicUptimeApis(
  target: string,
  options: { timeoutMs: number; expectStatus: number },
): Promise<PublicUptimeResult | null> {
  if (isCompanyStatusHost(target)) return null;

  const url = normalizeHttpUrl(target);
  if (!url) return null;

  const budget = Math.max(2_000, Math.min(options.timeoutMs, 8_000));

  const fromCheckHost = await checkHostHttp(url, budget, options.expectStatus);
  if (fromCheckHost) return fromCheckHost;

  const fromIsItUp = await isItUp(url, budget, options.expectStatus);
  if (fromIsItUp) return fromIsItUp;

  return null;
}

function normalizeHttpUrl(target: string): URL | null {
  try {
    const url = target.includes("://") ? new URL(target) : new URL(`https://${target}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}

async function fetchJson(
  url: string,
  timeoutMs: number,
): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: JSON_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    const type = (response.headers.get("content-type") ?? "").toLowerCase();
    if (!type.includes("json")) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Check-Host: start an HTTP check on one public node, then poll the result.
 * https://check-host.net/about/api
 */
async function checkHostHttp(
  url: URL,
  timeoutMs: number,
  expectStatus: number,
): Promise<PublicUptimeResult | null> {
  const started = Date.now();
  const startUrl =
    "https://check-host.net/check-http?" +
    new URLSearchParams({ host: url.toString(), max_nodes: "1" }).toString();
  const startedCheck = await fetchJson(startUrl, Math.min(4_000, timeoutMs));
  if (!startedCheck || typeof startedCheck !== "object") return null;

  const payload = startedCheck as Record<string, unknown>;
  if (payload.ok === 0 || payload.error) return null;
  const requestId = String(payload.request_id ?? "").trim();
  if (!requestId || !/^[a-zA-Z0-9_-]+$/.test(requestId)) return null;

  const resultUrl = `https://check-host.net/check-result/${requestId}`;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await sleep(400);
    const remaining = deadline - Date.now();
    if (remaining < 200) break;
    const raw = await fetchJson(resultUrl, Math.min(3_000, remaining));
    const parsed = parseCheckHostHttp(raw, expectStatus);
    if (parsed === "pending") continue;
    if (!parsed) return null;
    return {
      ...parsed,
      latencyMs: parsed.latencyMs ?? Date.now() - started,
    };
  }

  return null;
}

function parseCheckHostHttp(
  raw: unknown,
  expectStatus: number,
): PublicUptimeResult | "pending" | null {
  if (!raw || typeof raw !== "object") return "pending";
  const nodes = Object.values(raw as Record<string, unknown>);
  if (nodes.length === 0) return "pending";
  if (nodes.every((node) => node == null)) return "pending";

  let best: PublicUptimeResult | null = null;

  for (const node of nodes) {
    if (node == null) continue;
    const row = Array.isArray(node) ? node[0] : node;
    if (!Array.isArray(row) || row.length < 2) continue;

    const successFlag = Number(row[0]);
    const seconds = Number(row[1]);
    const statusRaw = row[3];
    const statusCode =
      typeof statusRaw === "number"
        ? statusRaw
        : Number.parseInt(String(statusRaw ?? ""), 10);
    const code = Number.isFinite(statusCode) ? statusCode : null;
    const latencyMs = Number.isFinite(seconds) ? Math.round(seconds * 1000) : null;
    const ok =
      successFlag === 1 && code !== null
        ? httpStatusIsHealthy(code, expectStatus)
        : false;

    const candidate: PublicUptimeResult = {
      ok,
      statusCode: code,
      latencyMs,
      error: ok ? null : "Public API reported this homepage is not answering.",
    };

    if (candidate.ok) return candidate;
    best = candidate;
  }

  return best;
}

/**
 * Is It Up?: domain-level JSON check. No API key.
 * https://isitup.org/
 */
async function isItUp(
  url: URL,
  timeoutMs: number,
  expectStatus: number,
): Promise<PublicUptimeResult | null> {
  const host = url.hostname.replace(/^www\./, "");
  if (!/^[a-z0-9.-]+$/i.test(host)) return null;

  const started = Date.now();
  const raw = await fetchJson(`https://isitup.org/${host}.json`, timeoutMs);
  if (!raw || typeof raw !== "object") return null;

  const payload = raw as Record<string, unknown>;
  const flag = Number(payload.status_code);
  const responseCode = Number(payload.response_code);
  const seconds = Number(payload.response_time);
  const statusCode = Number.isFinite(responseCode) ? responseCode : null;
  const latencyMs = Number.isFinite(seconds)
    ? Math.round(seconds * 1000)
    : Date.now() - started;

  if (flag === 3) return null;
  if (flag === 2) {
    return {
      ok: false,
      statusCode,
      latencyMs,
      error: "Public API reported this homepage is not answering.",
    };
  }
  if (flag !== 1) return null;

  const ok = statusCode === null ? true : httpStatusIsHealthy(statusCode, expectStatus);
  return {
    ok,
    statusCode,
    latencyMs,
    error: ok ? null : "Public API reported this homepage is not answering.",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
