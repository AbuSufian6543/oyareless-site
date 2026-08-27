import { NextResponse } from "next/server";

import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Minimal response so the measurement reflects round-trip latency only. */
export async function GET(request: Request) {
  // Latency sampling is chatty by nature, so this ceiling is high; it exists
  // only to stop the endpoint being hammered in a loop.
  const limit = rateLimit(`speedtest-ping:${clientIp(request)}`, 400, 600);
  if (!limit.allowed) {
    return new NextResponse(null, {
      status: 429,
      headers: {
        "Retry-After": String(limit.retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Timing-Allow-Origin": "*",
    },
  });
}
