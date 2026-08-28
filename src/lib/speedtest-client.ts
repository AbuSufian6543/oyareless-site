/**
 * Browser-side measurement engine for the speed test.
 *
 * Throughput is measured against Cloudflare's public edge
 * (speed.cloudflare.com) — the same network behind Cloudflare's own speed
 * test — not against this website. The UI still talks to our /api/speedtest
 * routes only to show the visitor's IP and to save a shareable snapshot.
 */

import CloudflareSpeedTest from "@cloudflare/speedtest";

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

/**
 * Cloudflare's default sequence minus the WebRTC packet-loss step. TURN is
 * often blocked on business networks, and we already tell visitors packet
 * loss cannot be measured reliably from a browser.
 */
const MEASUREMENTS = [
  { type: "latency" as const, numPackets: 2 },
  { type: "download" as const, bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "latency" as const, numPackets: 20 },
  { type: "download" as const, bytes: 1e5, count: 9 },
  { type: "latency" as const, numPackets: 2 },
  { type: "download" as const, bytes: 1e6, count: 8 },
  { type: "latency" as const, numPackets: 2 },
  { type: "upload" as const, bytes: 1e5, count: 8 },
  { type: "latency" as const, numPackets: 2 },
  { type: "download" as const, bytes: 1e7, count: 6 },
  { type: "latency" as const, numPackets: 2 },
  { type: "upload" as const, bytes: 1e7, count: 4 },
  { type: "latency" as const, numPackets: 2 },
  { type: "download" as const, bytes: 25e6, count: 4 },
  { type: "latency" as const, numPackets: 2 },
  { type: "upload" as const, bytes: 25e6, count: 4 },
  { type: "latency" as const, numPackets: 2 },
  { type: "download" as const, bytes: 1e8, count: 3 },
  { type: "latency" as const, numPackets: 2 },
  { type: "upload" as const, bytes: 5e7, count: 3 },
];

export class SpeedTestError extends Error {}

export async function runSpeedTest(
  handlers: SpeedTestHandlers,
): Promise<SpeedTestOutcome> {
  const { signal, onPhase, onSample, onProgress, onPartial } = handlers;

  onPhase("connecting");
  onProgress(0);

  const engine = new CloudflareSpeedTest({
    autoStart: false,
    // Do not post the finished run to Cloudflare's AIM logging endpoint.
    logAimApiUrl: null,
    logMeasurementApiUrl: null,
    measurements: MEASUREMENTS,
  });

  return new Promise((resolve, reject) => {
    let settled = false;

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

    engine.onPhaseChange = ({ measurement, measurementId }) => {
      if (settled) return;
      if (measurement.type === "download") onPhase("download");
      else if (measurement.type === "upload") onPhase("upload");
      else if (measurement.type === "latency") {
        // Opening latency rounds, before any real transfer has started.
        if (measurementId <= 2) onPhase("ping");
      }
      onProgress(Math.min((measurementId + 1) / MEASUREMENTS.length, 0.98));
    };

    engine.onResultsChange = ({ type }) => {
      if (settled) return;
      const results = engine.results;
      const latencyMs = results.getUnloadedLatency();
      const jitter = results.getUnloadedJitter();
      if (latencyMs !== undefined) {
        onPartial({
          latencyMs,
          jitterMs: typeof jitter === "number" ? jitter : 0,
        });
      }

      if (type === "latency") {
        const pings = results.getUnloadedLatencyPoints();
        const latest = pings[pings.length - 1];
        if (typeof latest === "number") onSample(latest);
        return;
      }

      if (type === "download") {
        const points = results.getDownloadBandwidthPoints();
        const latest = points[points.length - 1];
        if (latest) onSample(bpsToMbps(latest.bps));
        const download = results.getDownloadBandwidth();
        if (download) onPartial({ downloadMbps: bpsToMbps(download) });
        return;
      }

      if (type === "upload") {
        const points = results.getUploadBandwidthPoints();
        const latest = points[points.length - 1];
        if (latest) onSample(bpsToMbps(latest.bps));
        const upload = results.getUploadBandwidth();
        if (upload) onPartial({ uploadMbps: bpsToMbps(upload) });
      }
    };

    engine.onFinish = (results) => {
      if (settled) return;
      const summary = results.getSummary();
      const downloadMbps = summary.download ? bpsToMbps(summary.download) : null;
      const uploadMbps = summary.upload ? bpsToMbps(summary.upload) : null;
      const latencyMs = summary.latency;
      const jitterMs = summary.jitter ?? 0;

      if (
        downloadMbps === null ||
        uploadMbps === null ||
        latencyMs === undefined
      ) {
        finish(() =>
          reject(
            new SpeedTestError(
              "The test finished without a complete set of figures. Please try again.",
            ),
          ),
        );
        return;
      }

      const outcome: SpeedTestOutcome = {
        downloadMbps,
        uploadMbps,
        latencyMs,
        jitterMs,
      };
      onPartial(outcome);
      onPhase("complete");
      onProgress(1);
      finish(() => resolve(outcome));
    };

    engine.play();
  });
}

function bpsToMbps(bps: number): number {
  return bps / 1e6;
}
