import { NextResponse } from "next/server";

import { clientIp, rateLimit } from "@/lib/rate-limit";
import { SPEEDTEST_PROVIDER } from "@/lib/speedtest-provider";
import { networkNameFor } from "@/lib/speedtest";

export const dynamic = "force-dynamic";

/**
 * Connection details shown alongside the result: the visitor's public address
 * and their carrier where reverse DNS reveals it. The test itself runs
 * against Cloudflare's edge, not this host.
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

  const networkName = await networkNameFor(ip);

  return NextResponse.json(
    {
      ip: ip === "unknown" ? null : ip,
      networkName,
      server: SPEEDTEST_PROVIDER,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
