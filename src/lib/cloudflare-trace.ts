import { publicClientIp } from "@/lib/ip-address";
import { SPEEDTEST_PROVIDER } from "@/lib/speedtest-provider";

export type CloudflareEdgeTrace = {
  ip: string | null;
  colo: string | null;
  loc: string | null;
};

/**
 * Parse Cloudflare's `cdn-cgi/trace` body. Used so the speed test can show the
 * address Cloudflare sees — which is the path being measured — even when this
 * page is served from localhost.
 */
export function parseCloudflareTrace(body: string): CloudflareEdgeTrace {
  const fields: Record<string, string> = {};
  for (const line of body.split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index <= 0) continue;
    fields[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  }
  return {
    ip: publicClientIp(fields.ip ?? ""),
    colo: fields.colo?.trim() ? fields.colo.trim().toUpperCase() : null,
    loc: fields.loc?.trim() ? fields.loc.trim().toUpperCase() : null,
  };
}

/** Nearby / common Cloudflare sites, including the ones Northern Ontario hits. */
const COLO_CITIES: Record<string, string> = {
  YYZ: "Toronto",
  YTZ: "Toronto",
  YUL: "Montreal",
  YVR: "Vancouver",
  YWG: "Winnipeg",
  YOW: "Ottawa",
  YHZ: "Halifax",
  ORD: "Chicago",
  DTW: "Detroit",
  MSP: "Minneapolis",
  CLE: "Cleveland",
  BUF: "Buffalo",
  IAD: "Ashburn",
  EWR: "Newark",
  LAX: "Los Angeles",
  SEA: "Seattle",
};

export function formatCloudflareColo(colo: string | null | undefined): string {
  if (!colo) return SPEEDTEST_PROVIDER.location;
  const city = COLO_CITIES[colo];
  return city
    ? `Cloudflare ${city} (${colo})`
    : `Cloudflare edge (${colo})`;
}

export async function readCloudflareEdgeTrace(
  signal?: AbortSignal,
): Promise<CloudflareEdgeTrace | null> {
  const response = await fetch(
    `https://${SPEEDTEST_PROVIDER.host}/cdn-cgi/trace`,
    { cache: "no-store", signal },
  );
  if (!response.ok) return null;
  return parseCloudflareTrace(await response.text());
}
