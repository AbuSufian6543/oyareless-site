import { NextResponse } from "next/server";

import { checkBudget, spendBudget } from "@/lib/byte-budget";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { budgetKey, SPEEDTEST_LIMITS } from "@/lib/speedtest";

export const dynamic = "force-dynamic";

/** Drains the request body and reports how many bytes were received. */
export async function POST(request: Request) {
  const ip = clientIp(request);

  // Prevents the endpoint being used as free bandwidth by a script.
  const limit = rateLimit(`speedtest-up:${ip}`, 60, 600);
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

  const key = budgetKey(ip);
  const budget = checkBudget(key, SPEEDTEST_LIMITS.budgetBytes);
  if (!budget.allowed) {
    return NextResponse.json(
      {
        message:
          "The speed test has been run too many times from this connection. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(budget.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (!request.body) {
    return NextResponse.json({ received: 0 });
  }

  const ceiling = Math.min(SPEEDTEST_LIMITS.maxUploadBytes, budget.remaining);
  const reader = request.body.getReader();
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value?.byteLength ?? 0;
      if (received > ceiling) {
        await reader.cancel();
        break;
      }
    }
  } catch {
    // Client aborted mid-upload; report what arrived.
  }

  spendBudget(key, received, SPEEDTEST_LIMITS.budgetWindowSeconds);

  return NextResponse.json(
    { received },
    { headers: { "Cache-Control": "no-store" } },
  );
}
