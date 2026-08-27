import "server-only";

type Window = { bytes: number; resetAt: number };

/**
 * Per-IP transfer budget for the speed-test endpoints.
 *
 * Request-count limits alone do not protect a throughput test: a single
 * download request is allowed to move tens of megabytes, so a script that
 * stays under the request limit can still pull gigabytes. This tracks bytes
 * rather than requests.
 *
 * In-memory, so the budget is per container and resets on deploy — the same
 * trade-off as the request limiter, and it should move to Redis alongside it
 * if the app is ever scaled horizontally.
 */
const windows = new Map<string, Window>();
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

export type BudgetResult = {
  allowed: boolean;
  /** Bytes still available in the current window; never negative. */
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Checks the remaining budget without spending any of it. Use this before
 * streaming, then call `spendBudget` with what was actually transferred.
 */
export function checkBudget(key: string, limitBytes: number): BudgetResult {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);
  if (!existing || existing.resetAt <= now) {
    return { allowed: true, remaining: limitBytes, retryAfterSeconds: 0 };
  }

  const remaining = Math.max(0, limitBytes - existing.bytes);
  if (remaining <= 0) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, remaining, retryAfterSeconds: 0 };
}

/** Records bytes transferred, opening a new window if the last one expired. */
export function spendBudget(
  key: string,
  bytes: number,
  windowSeconds: number,
): void {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { bytes, resetAt: now + windowSeconds * 1000 });
    return;
  }

  existing.bytes += bytes;
}
