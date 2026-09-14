/**
 * Payload sizing for the public speed test.
 *
 * Cloudflare's engine ramps file sizes and then *stops* a direction once the
 * fastest request in a round has already lasted `bandwidthFinishRequestDuration`
 * (1 s by default). Combined with a 25 MB cap that meant a ~50–150 Mbps path
 * never left the 10 MB round, and a gigabit path finished 25 MB in a fraction
 * of a second — so download/upload looked like a two-second stub.
 *
 * This planner does the opposite: probe with tiny files, pick a payload that
 * should last long enough for TCP to open, then hold that size until the
 * direction has ~8 s of transfer (capped so a slow line cannot sit on a huge
 * file). Endpoints stay Cloudflare's; only the schedule changes.
 */

/** Same download ladder Cloudflare uses, including 100 MB and 250 MB. */
export const DOWNLOAD_SIZES = [
  1_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000,
] as const;

/**
 * Upload is POST body generated in the browser. Cloudflare's own test tops
 * out at 50 MB; larger bodies are a memory hit on phones.
 */
export const UPLOAD_SIZES = [
  1_000_000, 10_000_000, 25_000_000, 50_000_000,
] as const;

/** How long we want each direction to actually transfer, after the probe. */
export const TARGET_DIRECTION_MS = 8_000;

/**
 * A single request shorter than this rarely fills the congestion window on
 * a fast path — treat it as "too small, grow the payload".
 */
export const MIN_SATURATION_MS = 1_200;

/**
 * One HTTP request should not become a slog on a slow line. If a file takes
 * longer than this we keep the sample and stop growing.
 */
export const MAX_REQUEST_MS = 10_000;

/** Hard cap so a mis-estimate cannot run a direction for half a minute. */
export const MAX_DIRECTION_MS = 16_000;

/** Extra same-size requests after the first saturated file. */
export const MAX_EXTRA_REQUESTS = 3;

export type SpeedTestPoint = {
  bytes: number;
  duration: number;
  bps: number;
};

/**
 * Smallest payload whose expected duration is at least {@link MIN_SATURATION_MS},
 * without exceeding {@link MAX_REQUEST_MS}. Unknown/too-fast probes are treated
 * as a gigabit path so we start at the large end and can still stop after one
 * long request if the guess was high.
 */
export function pickSize(
  bitsPerSecond: number | undefined,
  sizes: readonly number[],
): number {
  const rate = bitsPerSecond && bitsPerSecond > 0 ? bitsPerSecond : 1_000_000_000;
  let candidate = sizes[0];

  for (const size of sizes) {
    const ms = durationMs(size, rate);
    if (ms > MAX_REQUEST_MS) break;
    candidate = size;
    if (ms >= MIN_SATURATION_MS) break;
  }

  return candidate;
}

export function nextLargerSize(
  current: number,
  sizes: readonly number[],
): number {
  const larger = sizes.find((size) => size > current);
  return larger ?? current;
}

/**
 * How many extra requests of the *same* size to run after one already lasted
 * `lastRequestMs`, given `elapsedMs` already spent in this direction (probe
 * included). One long file is enough; several short-but-saturated files add
 * up to the target window.
 */
export function extraRequestCount(
  lastRequestMs: number,
  elapsedMs: number,
): number {
  if (lastRequestMs >= 6_000) return 0;
  if (elapsedMs >= TARGET_DIRECTION_MS) return 0;
  if (elapsedMs >= MAX_DIRECTION_MS) return 0;

  const remaining = TARGET_DIRECTION_MS - elapsedMs;
  const extra = Math.round(remaining / Math.max(lastRequestMs, 1));
  return Math.min(MAX_EXTRA_REQUESTS, Math.max(0, extra));
}

export function totalDurationMs(points: SpeedTestPoint[]): number {
  return points.reduce((sum, point) => sum + point.duration, 0);
}

export function formatPayloadBytes(bytes: number): string {
  if (bytes >= 1_000_000) {
    const mb = bytes / 1_000_000;
    return Number.isInteger(mb) ? `${mb} MB` : `${mb.toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1_000)} KB`;
}

function durationMs(bytes: number, bitsPerSecond: number): number {
  return ((bytes * 8) / bitsPerSecond) * 1000;
}
