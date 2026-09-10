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

/** Country code for Canadian vantage points when the live node list cannot be loaded. */
const FALLBACK_CANADA_REGION = ["CA"];
const LEGACY_CANADA_NODES = ["ca1.node.check-host.net"];

let canadaRegionCache: { names: string[]; at: number } | null = null;
let canadaLegacyCache: { names: string[]; at: number } | null = null;
let busyUntil = 0;

/**
 * Ask independent HTTP checkers whether a homepage is answering.
 *
 * Prefers a Canadian vantage point, then a second Canadian path, then a
 * last-resort checker so a first check is not stuck forever. Company-owned
 * hosts are never sent out. Returns null when no checker answered so callers
 * can retry later instead of inventing a status.
 *
 * Provider names stay in this server module. They are not shown on the site.
 */
export async function checkViaPublicUptimeApis(
  target: string,
  options: { timeoutMs: number; expectStatus: number },
): Promise<PublicUptimeResult | null> {
  if (isCompanyStatusHost(target)) return null;

  const url = normalizeHttpUrl(target);
  if (!url) return null;

  const budget = Math.max(2_000, Math.min(options.timeoutMs, 7_000));

  const fromCanada = await checkFromCanada(url, budget, options.expectStatus);
  if (fromCanada) return fromCanada;

  const fromLegacyCanada = await checkHostLegacyCanada(url, budget, options.expectStatus);
  if (fromLegacyCanada) return fromLegacyCanada;

  return isItUp(url, Math.min(2_500, budget), options.expectStatus);
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

function checkersBusy(): boolean {
  return Date.now() < busyUntil;
}

function markBusy(ms = 20_000): void {
  busyUntil = Math.max(busyUntil, Date.now() + ms);
}

async function fetchJson(
  url: string,
  timeoutMs: number,
  init: RequestInit = {},
): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      ...init,
      headers: { ...JSON_HEADERS, ...(init.headers as Record<string, string> | undefined) },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status === 429) {
      markBusy();
      return null;
    }
    if (!response.ok) return null;
    const type = (response.headers.get("content-type") ?? "").toLowerCase();
    if (!type.includes("json")) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function canadaRegions(): Promise<string[]> {
  if (canadaRegionCache && Date.now() - canadaRegionCache.at < 6 * 60 * 60 * 1000) {
    return canadaRegionCache.names;
  }

  const raw = await fetchJson("https://api.check-host.cc/locations", 2_500);
  const names: string[] = [];
  if (raw && typeof raw === "object" && "locationlist" in raw) {
    const list = (raw as { locationlist?: unknown }).locationlist;
    if (Array.isArray(list)) {
      for (const entry of list) {
        if (!entry || typeof entry !== "object") continue;
        const row = entry as { countryCode?: unknown; locationname?: unknown };
        if (String(row.countryCode ?? "").toUpperCase() !== "CA") continue;
        const name = String(row.locationname ?? "").trim();
        if (name) names.push(name);
      }
    }
  }

  const list = names.length > 0 ? names.slice(0, 2) : FALLBACK_CANADA_REGION;
  canadaRegionCache = { names: list, at: Date.now() };
  return list;
}

/**
 * HTTP check from Canadian nodes (Montreal and any other live CA vantage).
 * https://api.check-host.cc
 */
async function checkFromCanada(
  url: URL,
  timeoutMs: number,
  expectStatus: number,
): Promise<PublicUptimeResult | null> {
  if (checkersBusy()) return null;

  const started = Date.now();
  const region = await canadaRegions();
  const created = await fetchJson("https://api.check-host.cc/http", Math.min(3_000, timeoutMs), {
    method: "POST",
    headers: {
      ...JSON_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ target: url.toString(), region }),
  });
  if (!created || typeof created !== "object") return null;

  const payload = created as Record<string, unknown>;
  if (payload.success === false) return null;
  const uuid = String(payload.uuid ?? "").trim();
  if (!uuid || !/^[0-9a-f-]{36}$/i.test(uuid)) return null;

  const resultUrl = `https://api.check-host.cc/report/${uuid}`;
  const deadline = Date.now() + timeoutMs;

  await sleep(500);
  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    if (remaining < 200) break;
    const raw = await fetchJson(resultUrl, Math.min(2_500, remaining));
    const parsed = parseCanadaHttp(raw, expectStatus);
    if (parsed === "pending") {
      await sleep(400);
      continue;
    }
    if (!parsed) return null;
    return {
      ...parsed,
      latencyMs: parsed.latencyMs ?? Date.now() - started,
    };
  }

  return null;
}

function parseCanadaHttp(
  raw: unknown,
  expectStatus: number,
): PublicUptimeResult | "pending" | null {
  if (!raw || typeof raw !== "object") return "pending";
  const payload = raw as Record<string, unknown>;
  if (payload.success === false) return null;
  const data = payload.data;
  if (!data || typeof data !== "object") return "pending";

  const nodes = Object.values(data as Record<string, unknown>);
  if (nodes.length === 0) return "pending";

  let best: PublicUptimeResult | null = null;

  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    const checks = (node as { checks?: unknown }).checks;
    if (!Array.isArray(checks) || checks.length === 0) continue;
    const row = checks[0];
    if (!row || typeof row !== "object") continue;

    const httpStatus = Number((row as { http_status?: unknown }).http_status);
    const connectionTime = Number((row as { connectiontime?: unknown }).connectiontime);
    const flag = Number((row as { status?: unknown }).status);
    const code = Number.isFinite(httpStatus) ? httpStatus : null;
    const latencyMs = Number.isFinite(connectionTime) ? Math.round(connectionTime) : null;
    const ok = flag === 1 && code !== null ? httpStatusIsHealthy(code, expectStatus) : false;

    const candidate: PublicUptimeResult = {
      ok,
      statusCode: code,
      latencyMs,
      error: ok ? null : "This homepage is not answering.",
    };

    if (candidate.ok) return candidate;
    best = candidate;
  }

  return best ?? "pending";
}

async function legacyCanadaNodes(): Promise<string[]> {
  if (canadaLegacyCache && Date.now() - canadaLegacyCache.at < 6 * 60 * 60 * 1000) {
    return canadaLegacyCache.names;
  }

  const raw = await fetchJson("https://check-host.net/nodes/hosts", 2_500);
  const names: string[] = [];
  if (raw && typeof raw === "object" && "nodes" in raw) {
    const nodes = (raw as { nodes?: Record<string, { location?: unknown }> }).nodes ?? {};
    for (const [name, info] of Object.entries(nodes)) {
      const location = info?.location;
      const country = Array.isArray(location) ? String(location[0] ?? "").toLowerCase() : "";
      if (country === "ca") names.push(name);
    }
  }

  const list = names.length > 0 ? names : LEGACY_CANADA_NODES;
  canadaLegacyCache = { names: list, at: Date.now() };
  return list;
}

/**
 * Older Canadian-node HTTP check, used only when the Montreal path is busy.
 * https://check-host.net/about/api
 */
async function checkHostLegacyCanada(
  url: URL,
  timeoutMs: number,
  expectStatus: number,
): Promise<PublicUptimeResult | null> {
  if (checkersBusy()) return null;

  const started = Date.now();
  const nodes = await legacyCanadaNodes();
  const params = new URLSearchParams({ host: url.toString() });
  for (const node of nodes.slice(0, 2)) params.append("node", node);

  const startedCheck = await fetchJson(
    `https://check-host.net/check-http?${params.toString()}`,
    Math.min(3_000, timeoutMs),
  );
  if (!startedCheck || typeof startedCheck !== "object") return null;

  const payload = startedCheck as Record<string, unknown>;
  if (payload.ok === 0 || payload.error) return null;
  const requestId = String(payload.request_id ?? "").trim();
  if (!requestId || !/^[a-zA-Z0-9_-]+$/.test(requestId)) return null;

  const resultUrl = `https://check-host.net/check-result/${requestId}`;
  const deadline = Date.now() + timeoutMs;

  await sleep(600);
  while (Date.now() < deadline) {
    const remaining = deadline - Date.now();
    if (remaining < 200) break;
    const raw = await fetchJson(resultUrl, Math.min(2_500, remaining));
    const parsed = parseLegacyHttp(raw, expectStatus);
    if (parsed === "pending") {
      await sleep(450);
      continue;
    }
    if (!parsed) return null;
    return {
      ...parsed,
      latencyMs: parsed.latencyMs ?? Date.now() - started,
    };
  }

  return null;
}

function parseLegacyHttp(
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
      error: ok ? null : "This homepage is not answering.",
    };

    if (candidate.ok) return candidate;
    best = candidate;
  }

  return best;
}

/**
 * Domain-level JSON check used only when Canadian vantage points do not answer.
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
      error: "This homepage is not answering.",
    };
  }
  if (flag !== 1) return null;

  const ok = statusCode === null ? true : httpStatusIsHealthy(statusCode, expectStatus);
  return {
    ok,
    statusCode,
    latencyMs,
    error: ok ? null : "This homepage is not answering.",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
