import "server-only";

import { headers } from "next/headers";

/**
 * Best-effort client IP for server actions. Prefer Cloudflare's connecting
 * address when the site sits behind their proxy.
 */
export async function requestClientIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("cf-connecting-ip")?.trim() ||
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
