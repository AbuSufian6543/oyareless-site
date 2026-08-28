import "server-only";

import { createHmac } from "node:crypto";
import { reverse } from "node:dns/promises";

import { env } from "@/lib/env";

/**
 * Shared helpers for speed-test API routes (IP hashing, reverse DNS, leftover
 * transfer limits on the unused self-hosted download/upload endpoints).
 */
export const SPEEDTEST_LIMITS = {
  /** Bytes per IP per window, counted across download and upload together. */
  budgetBytes: 400 * 1024 * 1024,
  budgetWindowSeconds: 3600,
  /** Largest single download chunk the client may ask for. */
  maxDownloadMb: 25,
  /** Largest single upload body accepted. */
  maxUploadBytes: 12 * 1024 * 1024,
} as const;

export function budgetKey(ip: string): string {
  return `speedtest-bytes:${ip}`;
}

/**
 * One-way IP identifier for stored results.
 *
 * Results are shareable by link, so the raw address is never persisted. The
 * hash exists only to spot one address flooding the table; it is keyed with the
 * app secret so it cannot be reversed with a rainbow table of IPv4 space.
 */
export function hashIp(ip: string): string {
  return createHmac("sha256", env.authSecret)
    .update(`speedtest:${ip}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Best-effort network name from reverse DNS.
 *
 * Deliberately not an ASN or geo-IP lookup: those need a third-party service or
 * a licensed database. A PTR record usually reveals the carrier
 * (`...rogerscable.com`), which is all this claims to show. Returns null
 * rather than guessing when there is no useful record.
 */
export async function networkNameFor(ip: string): Promise<string | null> {
  if (!ip || ip === "unknown" || isPrivateAddress(ip)) return null;

  try {
    const names = await withTimeout(reverse(ip), 1500);
    const hostname = names?.[0];
    if (!hostname) return null;

    // Keep the registrable-looking tail: "cpe-1-2-3.montreal.rogers.com" is
    // noise to a visitor, "rogers.com" is the useful part.
    const labels = hostname.toLowerCase().split(".").filter(Boolean);
    if (labels.length <= 2) return hostname.toLowerCase();

    const tail = labels.slice(-2).join(".");
    // Two-part public suffixes (co.uk, on.ca) need one more label to be useful.
    const secondLevel = labels[labels.length - 2];
    if (secondLevel.length <= 3 && labels.length >= 3) {
      return labels.slice(-3).join(".");
    }
    return tail;
  } catch {
    return null;
  }
}

function isPrivateAddress(ip: string): boolean {
  if (ip === "::1" || ip.startsWith("127.")) return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  if (ip.startsWith("169.254.") || ip.toLowerCase().startsWith("fe80:")) {
    return true;
  }
  if (/^fc|^fd/i.test(ip)) return true;
  const match = /^172\.(\d+)\./.exec(ip);
  if (match) {
    const second = Number.parseInt(match[1], 10);
    return second >= 16 && second <= 31;
  }
  return false;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
