import { NextResponse } from "next/server";

import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import { networkNameFor } from "@/lib/speedtest";

export const dynamic = "force-dynamic";

/**
 * Connection details shown alongside the result: the visitor's public address,
 * their carrier where reverse DNS reveals it, and which server they tested
 * against. Nothing here is a third-party lookup.
 */
export async function GET(request: Request) {
  const ip = clientIp(request);

  const limit = rateLimit(`speedtest-info:${ip}`, 60, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many requests." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const [settings, networkName] = await Promise.all([
    getSettings(),
    networkNameFor(ip),
  ]);

  return NextResponse.json(
    {
      ip: ip === "unknown" ? null : ip,
      networkName,
      server: {
        host: new URL(request.url).host,
        location: `${settings.city}, ${settings.province}`,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
