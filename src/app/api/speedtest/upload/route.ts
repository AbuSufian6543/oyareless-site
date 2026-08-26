import { NextResponse } from "next/server";

import { clientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024;

/** Drains the request body and reports how many bytes were received. */
export async function POST(request: Request) {
  // Prevents the endpoint being used as free bandwidth by a script.
  const limit = rateLimit(`speedtest-up:${clientIp(request)}`, 40, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many requests." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  if (!request.body) {
    return NextResponse.json({ received: 0 });
  }

  const reader = request.body.getReader();
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value?.byteLength ?? 0;
      if (received > MAX_BYTES) {
        await reader.cancel();
        break;
      }
    }
  } catch {
    // Client aborted mid-upload; report what arrived.
  }

  return NextResponse.json(
    { received },
    { headers: { "Cache-Control": "no-store" } },
  );
}
