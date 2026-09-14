/**
 * Browser-side measurement engine for the speed test.
 *
 * Throughput is measured against Cloudflare's public edge
 * (speed.cloudflare.com) — the same network behind Cloudflare's own speed
 * test — not against this website. The UI still talks to our /api/speedtest
 * routes only to show the visitor's IP and to save a shareable snapshot.
 *
 * We do not change Cloudflare URLs, AIM logging, or loaded-latency. We only
 * schedule *when* and *how large* each transfer is so a run lasts long enough
 * to fill the pipe without becoming an open-ended 100 MB+ default sequence.
 */

import CloudflareSpeedTest from "@cloudflare/speedtest";

import {
  DOWNLOAD_SIZES,
  extraRequestCount,
  MAX_DIRECTION_MS,
  MIN_SATURATION_MS,
  nextLargerSize,
  pickSize,
  TARGET_DIRECTION_MS,
  totalDurationMs,
  UPLOAD_SIZES,
  type SpeedTestPoint,
} from "@/lib/speedtest-plan";

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

export type SpeedTestTransfer = {
  direction: "download" | "upload";
  bytes: number;
  round: number;
  rounds: number;
};

export type SpeedTestHandlers = {
  signal: AbortSignal;
  /** Phase changed. The gauge resets its arc on each transition. */
  onPhase: (phase: SpeedTestPhase) => void;
  /** Live throughput for the arc and sparkline, in Mbps. */
  onSample: (mbps: number) => void;
  /** Overall progress, 0 to 1. */
  onProgress: (fraction: number) => void;
  /** A finished measurement, so the UI can fill in each figure as it lands. */
  onPartial: (partial: Partial<SpeedTestOutcome>) => void;
  /** Current payload in a download/upload round, or null when not transferring. */
  onTransfer?: (transfer: SpeedTestTransfer | null) => void;
};

export class SpeedTestError extends Error {}

export { formatPayloadBytes } from "@/lib/speedtest-plan";

const LATENCY_PACKETS = 10;

const SHARED_ENGINE_OPTIONS = {
  autoStart: false as const,
  // Do not post the finished run to Cloudflare's AIM logging endpoint.
  logAimApiUrl: null,
  logMeasurementApiUrl: null,
  // Idle ping is what we show. Measuring ping while a transfer is running
  // lengthens download and upload for a figure we never display.
  measureDownloadLoadedLatency: false,
  measureUploadLoadedLatency: false,
  // Sizing is ours. Keep this high so the library does not skip the rest of
  // a planned round after the first long request.
  bandwidthFinishRequestDuration: 60_000,
};

const PHASE_ORDER: SpeedTestPhase[] = [
  "connecting",
  "ping",
  "download",
  "upload",
  "complete",
];

export async function runSpeedTest(
  handlers: SpeedTestHandlers,
): Promise<SpeedTestOutcome> {
  const { signal, onPhase, onSample, onProgress, onPartial, onTransfer } =
    handlers;

  onPhase("connecting");
  onProgress(0);
  onTransfer?.(null);

  let phase: SpeedTestPhase = "connecting";
  let sampleFrame = 0;
  let pendingSample: number | null = null;

  const setPhase = (next: SpeedTestPhase) => {
    if (phase === next) return;
    if (PHASE_ORDER.indexOf(next) < PHASE_ORDER.indexOf(phase)) return;
    phase = next;
    onPhase(next);
  };

  const emitSample = (mbps: number) => {
    pendingSample = mbps;
    if (sampleFrame) return;
    sampleFrame = requestAnimationFrame(() => {
      sampleFrame = 0;
      if (pendingSample === null) return;
      onSample(pendingSample);
      pendingSample = null;
    });
  };

  const stopSamples = () => {
    if (sampleFrame) cancelAnimationFrame(sampleFrame);
    sampleFrame = 0;
    pendingSample = null;
  };

  const session: EngineSession = {
    signal,
    setPhase,
    emitSample,
    onPartial,
    onTransfer: onTransfer ?? (() => undefined),
  };
  const stopProgress: Array<() => void> = [];

  try {
    throwIfAborted(signal);

    const pingProgress = trackTimeProgress(0, 0.1, 1_800, onProgress, signal);
    stopProgress.push(pingProgress.stop);
    const probe = await runEngine(
      [
        { type: "latency", numPackets: LATENCY_PACKETS },
        { type: "download", bytes: 1e5, count: 1, bypassMinDuration: true },
        { type: "download", bytes: 1e6, count: 2 },
      ],
      session,
    );
    pingProgress.done(0.1);

    const latencyMs = probe.getUnloadedLatency();
    const jitter = probe.getUnloadedJitter();
    if (latencyMs === undefined) {
      throw new SpeedTestError(
        "The test could not measure latency. Please check your connection and try again.",
      );
    }
    onPartial({
      latencyMs,
      jitterMs: typeof jitter === "number" ? jitter : 0,
    });

    setPhase("download");
    const downloadProgress = trackTimeProgress(
      0.1,
      0.54,
      TARGET_MS_HINT,
      onProgress,
      signal,
    );
    stopProgress.push(downloadProgress.stop);
    const downloadBps = await fillDirection({
      direction: "download",
      estimateBps: estimateBps(probe, "download"),
      already: pointsOf(probe, "download"),
      sizes: DOWNLOAD_SIZES,
      session,
    });
    downloadProgress.done(0.54);
    onPartial({ downloadMbps: bpsToMbps(downloadBps) });
    session.onTransfer(null);

    setPhase("upload");
    const uploadProbe = await runEngine(
      [
        { type: "upload", bytes: 1e5, count: 1, bypassMinDuration: true },
        { type: "upload", bytes: 1e6, count: 2 },
      ],
      session,
    );

    const uploadProgress = trackTimeProgress(
      0.54,
      0.98,
      TARGET_MS_HINT,
      onProgress,
      signal,
    );
    stopProgress.push(uploadProgress.stop);
    const uploadBps = await fillDirection({
      direction: "upload",
      estimateBps: estimateBps(uploadProbe, "upload"),
      already: pointsOf(uploadProbe, "upload"),
      sizes: UPLOAD_SIZES,
      session,
    });
    uploadProgress.done(0.98);
    onPartial({ uploadMbps: bpsToMbps(uploadBps) });
    session.onTransfer(null);

    const outcome: SpeedTestOutcome = {
      downloadMbps: bpsToMbps(downloadBps),
      uploadMbps: bpsToMbps(uploadBps),
      latencyMs,
      jitterMs: typeof jitter === "number" ? jitter : 0,
    };
    onPartial(outcome);
    setPhase("complete");
    onProgress(1);
    return outcome;
  } finally {
    stopProgress.forEach((stop) => stop());
    stopSamples();
    onTransfer?.(null);
  }
}

const TARGET_MS_HINT = 10_000;

type MeasurementStep =
  | { type: "latency"; numPackets: number }
  | {
      type: "download" | "upload";
      bytes: number;
      count: number;
      bypassMinDuration?: boolean;
    };

type EngineResults = InstanceType<typeof CloudflareSpeedTest>["results"];

type EngineSession = {
  signal: AbortSignal;
  setPhase: (phase: SpeedTestPhase) => void;
  emitSample: (mbps: number) => void;
  onPartial: (partial: Partial<SpeedTestOutcome>) => void;
  onTransfer: (transfer: SpeedTestTransfer | null) => void;
};

async function fillDirection(options: {
  direction: "download" | "upload";
  estimateBps: number | undefined;
  already: SpeedTestPoint[];
  sizes: readonly number[];
  session: EngineSession;
}): Promise<number> {
  const { direction, sizes, session } = options;
  let estimateBps = options.estimateBps;
  let elapsedMs = totalDurationMs(options.already);
  let bestBps = officialBpsFromPoints(options.already) ?? estimateBps;
  let size = pickSize(estimateBps, sizes);

  const record = (results: EngineResults) => {
    const official = bandwidthOf(results, direction);
    if (official) bestBps = official;
    const latest = latestPoint(results, direction);
    if (latest?.bps) {
      session.emitSample(bpsToMbps(latest.bps));
      if (!official) bestBps = latest.bps;
    }
    const mbps = official ? bpsToMbps(official) : latest?.bps ? bpsToMbps(latest.bps) : null;
    if (mbps !== null) {
      if (direction === "download") session.onPartial({ downloadMbps: mbps });
      else session.onPartial({ uploadMbps: mbps });
    }
    elapsedMs += totalDurationMs(pointsOf(results, direction));
    estimateBps = official ?? latest?.bps ?? estimateBps;
  };

  const probeFilledThePipe =
    options.already.filter((point) => point.duration >= MIN_SATURATION_MS)
      .length >= 2 && elapsedMs >= TARGET_DIRECTION_MS;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    throwIfAborted(session.signal);
    if (probeFilledThePipe && bestBps) break;
    if (elapsedMs >= MAX_DIRECTION_MS && bestBps) break;

    const results = await runEngine(
      [
        {
          type: direction,
          bytes: size,
          count: 1,
          bypassMinDuration: true,
        },
      ],
      session,
    );
    const last = latestPoint(results, direction);
    record(results);

    if (elapsedMs >= MAX_DIRECTION_MS && bestBps) break;

    if (!last) {
      throw new SpeedTestError(
        `The ${direction} test finished without a reading. Please try again.`,
      );
    }

    if (last.duration < MIN_SATURATION_MS) {
      const grown = nextLargerSize(size, sizes);
      if (grown !== size) {
        size = grown;
        continue;
      }
    }

    if (last.duration >= MIN_SATURATION_MS) {
      const extra = extraRequestCount(last.duration, elapsedMs);
      if (extra > 0) {
        const more = await runEngine(
          [
            {
              type: direction,
              bytes: size,
              count: extra,
              bypassMinDuration: true,
            },
          ],
          session,
        );
        record(more);
      }
      break;
    }

    // Max payload and still too short — take a few more of it, then stop.
    const extra = extraRequestCount(Math.max(last.duration, 400), elapsedMs);
    if (extra > 0) {
      const more = await runEngine(
        [
          {
            type: direction,
            bytes: size,
            count: extra,
            bypassMinDuration: true,
          },
        ],
        session,
      );
      record(more);
    }
    break;
  }

  if (!bestBps) {
    throw new SpeedTestError(
      `The test finished without a ${direction} figure. Please try again.`,
    );
  }
  return bestBps;
}

function runEngine(
  measurements: MeasurementStep[],
  session: EngineSession,
): Promise<EngineResults> {
  const { signal, setPhase, emitSample, onPartial, onTransfer } = session;

  return new Promise((resolve, reject) => {
    let settled = false;
    let currentBytes = 0;
    let currentCount = 0;
    let currentDirection: "download" | "upload" | null = null;

    const engine = new CloudflareSpeedTest({
      ...SHARED_ENGINE_OPTIONS,
      measurements,
    });

    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      action();
    };

    const onAbort = () => {
      engine.pause();
      finish(() => reject(new DOMException("Aborted", "AbortError")));
    };

    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort);

    engine.onError = (message) => {
      finish(() =>
        reject(
          new SpeedTestError(
            message ||
              "The test could not complete. Please check your connection and try again.",
          ),
        ),
      );
    };

    engine.onPhaseChange = ({ measurement }) => {
      if (settled) return;
      if (measurement.type === "download") {
        setPhase("download");
        currentDirection = "download";
        currentBytes = measurement.bytes;
        currentCount = measurement.count;
        onTransfer({
          direction: "download",
          bytes: currentBytes,
          round: 0,
          rounds: currentCount,
        });
      } else if (measurement.type === "upload") {
        setPhase("upload");
        currentDirection = "upload";
        currentBytes = measurement.bytes;
        currentCount = measurement.count;
        onTransfer({
          direction: "upload",
          bytes: currentBytes,
          round: 0,
          rounds: currentCount,
        });
      } else if (measurement.type === "latency") {
        setPhase("ping");
        currentDirection = null;
        onTransfer(null);
      }
    };

    engine.onResultsChange = ({ type }) => {
      if (settled) return;
      const results = engine.results;

      if (type === "latency") {
        const latencyMs = results.getUnloadedLatency();
        const jitter = results.getUnloadedJitter();
        if (latencyMs !== undefined) {
          onPartial({
            latencyMs,
            jitterMs: typeof jitter === "number" ? jitter : 0,
          });
        }
        const pings = results.getUnloadedLatencyPoints();
        const latest = pings[pings.length - 1];
        if (typeof latest === "number") emitSample(latest);
        return;
      }

      if (type === "download" || type === "upload") {
        const points = pointsOf(results, type);
        if (currentDirection === type) {
          onTransfer({
            direction: type,
            bytes: currentBytes,
            round: Math.min(points.length, currentCount || points.length),
            rounds: currentCount || points.length,
          });
        }
        const latest = points[points.length - 1];
        if (latest?.bps) emitSample(bpsToMbps(latest.bps));
        const official = bandwidthOf(results, type);
        if (official) {
          const mbps = bpsToMbps(official);
          if (type === "download") onPartial({ downloadMbps: mbps });
          else onPartial({ uploadMbps: mbps });
        }
      }
    };

    engine.onFinish = (results) => {
      finish(() => resolve(results));
    };

    engine.play();
  });
}

function trackTimeProgress(
  from: number,
  to: number,
  expectedMs: number,
  onProgress: (fraction: number) => void,
  signal: AbortSignal,
): { done: (at: number) => void; stop: () => void } {
  const start = performance.now();
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    const fraction = (performance.now() - start) / expectedMs;
    onProgress(from + (to - from) * Math.min(0.92, Math.max(0, fraction)));
  };
  tick();
  const id = window.setInterval(tick, 200);
  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(id);
  };
  signal.addEventListener("abort", stop, { once: true });
  return {
    stop,
    done: (at: number) => {
      stop();
      onProgress(at);
    },
  };
}

function pointsOf(
  results: EngineResults,
  direction: "download" | "upload",
): SpeedTestPoint[] {
  const raw =
    direction === "download"
      ? results.getDownloadBandwidthPoints()
      : results.getUploadBandwidthPoints();
  return (raw ?? [])
    .filter((point) => typeof point?.bps === "number" && point.bps > 0)
    .map((point) => ({
      bytes: point.bytes,
      duration: point.duration,
      bps: point.bps,
    }));
}

function latestPoint(
  results: EngineResults,
  direction: "download" | "upload",
): SpeedTestPoint | undefined {
  const points = pointsOf(results, direction);
  return points[points.length - 1];
}

function bandwidthOf(
  results: EngineResults,
  direction: "download" | "upload",
): number | undefined {
  const value =
    direction === "download"
      ? results.getDownloadBandwidth()
      : results.getUploadBandwidth();
  return value && value > 0 ? value : undefined;
}

function estimateBps(
  results: EngineResults,
  direction: "download" | "upload",
): number | undefined {
  const official = bandwidthOf(results, direction);
  if (official) return official;
  const points = pointsOf(results, direction);
  if (points.length === 0) return undefined;
  return Math.max(...points.map((point) => point.bps));
}

function officialBpsFromPoints(points: SpeedTestPoint[]): number | undefined {
  const usable = points.filter((point) => point.duration >= 10 && point.bps > 0);
  if (usable.length === 0) return undefined;
  const sorted = [...usable].sort((a, b) => a.bps - b.bps);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor(0.9 * (sorted.length - 1))),
  );
  return sorted[index]?.bps;
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function bpsToMbps(bps: number): number {
  return bps / 1e6;
}
