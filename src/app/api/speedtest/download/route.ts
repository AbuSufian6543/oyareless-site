import { NextResponse } from "next/server";

import { checkBudget, spendBudget } from "@/lib/byte-budget";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { budgetKey, SPEEDTEST_LIMITS } from "@/lib/speedtest";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 64 * 1024;

/**
 * Streams incompressible random bytes so gzip on the reverse proxy cannot
 * inflate the apparent throughput.
 */
export async function GET(request: Request) {
  const ip = clientIp(request);

  const limit = rateLimit(`speedtest-down:${ip}`, 60, 600);
  if (!limit.allowed) {
    return tooMany(limit.retryAfterSeconds);
  }

  const key = budgetKey(ip);
  const budget = checkBudget(key, SPEEDTEST_LIMITS.budgetBytes);
  if (!budget.allowed) {
    return tooMany(budget.retryAfterSeconds);
  }

  const requested = Number.parseInt(
    new URL(request.url).searchParams.get("mb") ?? "8",
    10,
  );
  const megabytes = Math.min(
    Math.max(Number.isFinite(requested) ? requested : 8, 1),
    SPEEDTEST_LIMITS.maxDownloadMb,
  );

  // Never promise more than the remaining budget allows, so a client near its
  // limit gets a short response instead of a refusal mid-test.
  const totalBytes = Math.min(megabytes * 1024 * 1024, budget.remaining);
  spendBudget(key, totalBytes, SPEEDTEST_LIMITS.budgetWindowSeconds);

  // One random chunk is generated and reused; regenerating per chunk would
  // make the server CPU the bottleneck instead of the network.
  const chunk = new Uint8Array(CHUNK_SIZE);
  crypto.getRandomValues(chunk);

  let sent = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (sent >= totalBytes) {
        controller.close();
        return;
      }
      const size = Math.min(CHUNK_SIZE, totalBytes - sent);
      controller.enqueue(size === CHUNK_SIZE ? chunk : chunk.subarray(0, size));
      sent += size;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(totalBytes),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Encoding": "identity",
      "Timing-Allow-Origin": "*",
    },
  });
}

function tooMany(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      message:
        "The speed test has been run too many times from this connection. Please try again later.",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
        "Cache-Control": "no-store",
      },
    },
  );
}
