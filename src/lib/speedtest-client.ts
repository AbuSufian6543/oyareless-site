/**
 * Browser-side measurement engine for the speed test.
 *
 * Kept apart from the UI so the maths is readable on its own, and so the
 * component only has to deal with rendering. Everything here runs against this
 * site's own endpoints — there is no third-party test server involved.
 */

export type SpeedTestPhase =
  | "idle"
  | "connecting"
  | "ping"
  | "download"
  | "upload"
  | "complete";

export type SpeedTestOutcome = {
  latencyMs: number;
  jitterMs: number;
  downloadMbps: number;
  uploadMbps: number;
};

export type SpeedTestHandlers = {
  signal: AbortSignal;
  /** Phase changed. The gauge resets its needle on each transition. */
  onPhase: (phase: SpeedTestPhase) => void;
  /** Live throughput for the needle and sparkline, in Mbps. */
  onSample: (mbps: number) => void;
  /** Overall progress, 0 to 1. */
  onProgress: (fraction: number) => void;
  /** A finished measurement, so the UI can fill in each figure as it lands. */
  onPartial: (partial: Partial<SpeedTestOutcome>) => void;
};

/** Latency samples. The first is discarded: it pays for connection setup. */
const PING_SAMPLES = 7;

/** Chunk sizes in MB. Ramping keeps slow links off a huge single request. */
const DOWNLOAD_STEPS = [4, 8, 16, 25];

/** Must stay within the server's per-request upload ceiling. */
const UPLOAD_CHUNK_BYTES = 6 * 1024 * 1024;
const UPLOAD_ROUNDS = 2;

/** Stop a transfer phase once it has had long enough to be representative. */
const PHASE_BUDGET_MS = 10_000;

/** Ignored at the start of a transfer, while TCP is still ramping up. */
const SLOW_START_MS = 500;

/** Window for the live figure, long enough to be steady but still responsive. */
const INSTANT_WINDOW_MS = 700;

export class SpeedTestError extends Error {}

export async function runSpeedTest(
  handlers: SpeedTestHandlers,
): Promise<SpeedTestOutcome> {
  const { signal, onPhase, onProgress } = handlers;

  onPhase("connecting");
  onProgress(0);
  // A throwaway request opens the TCP and TLS connection, so the first latency
  // sample measures the network rather than the handshake.
  await fetch(`/api/speedtest/ping?warmup=1`, {
    cache: "no-store",
    signal,
  }).catch(() => undefined);
  throwIfAborted(signal);

  const { latencyMs, jitterMs } = await measureLatency(handlers);
  handlers.onPartial({ latencyMs, jitterMs });

  const downloadMbps = await measureDownload(handlers);
  handlers.onPartial({ downloadMbps });

  const uploadMbps = await measureUpload(handlers);
  handlers.onPartial({ uploadMbps });

  onPhase("complete");
  onProgress(1);

  return { latencyMs, jitterMs, downloadMbps, uploadMbps };
}

async function measureLatency({
  signal,
  onPhase,
  onSample,
  onProgress,
}: SpeedTestHandlers): Promise<{ latencyMs: number; jitterMs: number }> {
  onPhase("ping");
  const samples: number[] = [];

  for (let index = 0; index < PING_SAMPLES; index += 1) {
    throwIfAborted(signal);
    const started = performance.now();
    const response = await fetch(`/api/speedtest/ping?n=${index}`, {
      cache: "no-store",
      signal,
    });
    if (response.status === 429) throw rateLimited();
    const roundTrip = performance.now() - started;
    samples.push(roundTrip);
    onSample(roundTrip);
    onProgress(((index + 1) / PING_SAMPLES) * 0.15);
  }

  const timed = samples.slice(1);
  const latencyMs = Math.min(...timed);
  const mean = timed.reduce((sum, value) => sum + value, 0) / timed.length;
  // Mean absolute deviation rather than standard deviation: it is the figure
  // people recognise as jitter and it is not skewed by a single outlier.
  const jitterMs =
    timed.reduce((sum, value) => sum + Math.abs(value - mean), 0) /
    timed.length;

  return { latencyMs, jitterMs };
}

async function measureDownload({
  signal,
  onPhase,
  onSample,
  onProgress,
}: SpeedTestHandlers): Promise<number> {
  onPhase("download");
  const tracker = new ThroughputTracker();

  for (const megabytes of DOWNLOAD_STEPS) {
    throwIfAborted(signal);
    if (tracker.elapsedMs() > PHASE_BUDGET_MS) break;

    const response = await fetch(
      `/api/speedtest/download?mb=${megabytes}&t=${Date.now()}`,
      { cache: "no-store", signal },
    );
    if (response.status === 429) throw rateLimited();
    if (!response.ok || !response.body) {
      throw new SpeedTestError("The download test could not start.");
    }

    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      tracker.add(value?.byteLength ?? 0);
      const instant = tracker.instantMbps();
      if (instant !== null) onSample(instant);
      onProgress(
        0.15 + Math.min(tracker.elapsedMs() / PHASE_BUDGET_MS, 1) * 0.5,
      );
      if (tracker.elapsedMs() > PHASE_BUDGET_MS) {
        await reader.cancel().catch(() => undefined);
        break;
      }
    }
  }

  const mbps = tracker.averageMbps();
  if (mbps === null) {
    throw new SpeedTestError("No data was received during the download test.");
  }
  return mbps;
}

async function measureUpload({
  signal,
  onPhase,
  onSample,
  onProgress,
}: SpeedTestHandlers): Promise<number> {
  onPhase("upload");
  const payload = randomPayload(UPLOAD_CHUNK_BYTES);
  const tracker = new ThroughputTracker();

  for (let round = 0; round < UPLOAD_ROUNDS; round += 1) {
    throwIfAborted(signal);
    if (tracker.elapsedMs() > PHASE_BUDGET_MS) break;

    await postWithProgress(payload, signal, (deltaBytes) => {
      tracker.add(deltaBytes);
      const instant = tracker.instantMbps();
      if (instant !== null) onSample(instant);
      onProgress(
        0.65 + Math.min(tracker.elapsedMs() / PHASE_BUDGET_MS, 1) * 0.35,
      );
    });
  }

  const mbps = tracker.averageMbps();
  if (mbps === null) {
    throw new SpeedTestError("No data was sent during the upload test.");
  }
  return mbps;
}

/**
 * Accumulates transferred bytes and derives both a live figure and a final
 * average. The average deliberately excludes the opening moments, where TCP
 * congestion control has not yet reached the line rate and would understate a
 * fast connection.
 */
class ThroughputTracker {
  private readonly marks: Array<{ at: number; total: number }> = [];
  private total = 0;
  private startedAt: number | null = null;

  add(bytes: number): void {
    if (bytes <= 0) return;
    const now = performance.now();
    this.startedAt ??= now;
    this.total += bytes;
    this.marks.push({ at: now, total: this.total });
    // Only the recent tail matters for the live figure.
    while (this.marks.length > 2 && now - this.marks[0].at > 2000) {
      this.marks.shift();
    }
  }

  elapsedMs(): number {
    if (this.startedAt === null) return 0;
    return performance.now() - this.startedAt;
  }

  instantMbps(): number | null {
    if (this.marks.length < 2) return null;
    const latest = this.marks[this.marks.length - 1];
    const cutoff = latest.at - INSTANT_WINDOW_MS;
    const earliest =
      this.marks.find((mark) => mark.at >= cutoff) ?? this.marks[0];
    const seconds = (latest.at - earliest.at) / 1000;
    if (seconds <= 0.05) return null;
    return ((latest.total - earliest.total) * 8) / seconds / 1e6;
  }

  averageMbps(): number | null {
    if (this.startedAt === null || this.total === 0) return null;
    const elapsed = this.elapsedMs();

    // Too short to bother trimming; the whole transfer is the sample.
    if (elapsed <= SLOW_START_MS * 2) {
      return (this.total * 8) / (elapsed / 1000) / 1e6;
    }

    const cutoff = this.startedAt + SLOW_START_MS;
    const first = this.marks.find((mark) => mark.at >= cutoff);
    const last = this.marks[this.marks.length - 1];
    if (!first || last.at - first.at < 250) {
      return (this.total * 8) / (elapsed / 1000) / 1e6;
    }

    const seconds = (last.at - first.at) / 1000;
    return ((last.total - first.total) * 8) / seconds / 1e6;
  }
}

/**
 * Uploads through XMLHttpRequest rather than fetch: only XHR reports upload
 * progress, and without it the needle would sit still for the whole phase.
 */
function postWithProgress(
  payload: ArrayBuffer,
  signal: AbortSignal,
  onDelta: (deltaBytes: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    let lastLoaded = 0;

    const abort = () => request.abort();
    signal.addEventListener("abort", abort, { once: true });

    const settle = (finish: () => void) => {
      signal.removeEventListener("abort", abort);
      finish();
    };

    request.upload.addEventListener("progress", (event) => {
      const delta = event.loaded - lastLoaded;
      lastLoaded = event.loaded;
      onDelta(delta);
    });

    request.addEventListener("load", () => {
      if (request.status === 429) {
        settle(() => reject(rateLimited()));
        return;
      }
      if (request.status < 200 || request.status >= 300) {
        settle(() =>
          reject(new SpeedTestError("The upload test could not complete.")),
        );
        return;
      }
      settle(resolve);
    });

    request.addEventListener("error", () =>
      settle(() => reject(new SpeedTestError("The upload test failed."))),
    );
    request.addEventListener("abort", () =>
      settle(() => reject(new DOMException("Aborted", "AbortError"))),
    );

    request.open("POST", "/api/speedtest/upload");
    request.setRequestHeader("Content-Type", "application/octet-stream");
    request.send(payload);
  });
}

/**
 * Random bytes so nothing along the path can compress the body and report a
 * throughput the link cannot actually deliver. getRandomValues caps at 64 KB
 * per call, hence the loop.
 */
function randomPayload(bytes: number): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes);
  const view = new Uint8Array(buffer);
  const step = 65536;
  for (let offset = 0; offset < bytes; offset += step) {
    crypto.getRandomValues(view.subarray(offset, Math.min(offset + step, bytes)));
  }
  return buffer;
}

function rateLimited(): SpeedTestError {
  return new SpeedTestError(
    "This connection has run the test several times recently. Please wait a few minutes and try again.",
  );
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
}
