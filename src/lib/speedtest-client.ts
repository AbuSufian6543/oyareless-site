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
  /** Phase changed. The gauge resets its arc on each transition. */
  onPhase: (phase: SpeedTestPhase) => void;
  /** Live throughput for the arc and sparkline, in Mbps. */
  onSample: (mbps: number) => void;
  /** Overall progress, 0 to 1. */
  onProgress: (fraction: number) => void;
  /** A finished measurement, so the UI can fill in each figure as it lands. */
  onPartial: (partial: Partial<SpeedTestOutcome>) => void;
};

/**
 * Ping, then download, then upload. Cloudflare's library default interleaves
 * the three and ramps through 100 MB+ files plus a 20-packet ping — that is
 * what made a run feel like it would not end.
 *
 * This sequence is built for a customer tool, not a lab: enough samples for a
 * stable figure, short enough that the dial is done in a few seconds.
 * Packet-loss is omitted (it waits on a TURN path and we do not display it).
 */
const MEASUREMENTS = [
  { type: "latency" as const, numPackets: 8 },
  { type: "download" as const, bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "download" as const, bytes: 1e6, count: 3 },
  { type: "download" as const, bytes: 1e7, count: 2 },
  { type: "download" as const, bytes: 2.5e7, count: 2 },
  { type: "upload" as const, bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "upload" as const, bytes: 1e6, count: 2 },
  { type: "upload" as const, bytes: 1e7, count: 2 },
  { type: "upload" as const, bytes: 2.5e7, count: 2 },
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
    // Idle ping is what we show. Measuring ping while a transfer is running
    // lengthens download and upload for a figure we never display.
    measureDownloadLoadedLatency: false,
    measureUploadLoadedLatency: false,
    // Stop ramping to a larger file once a request in this direction has
    // already taken this long. Default is 1000 ms; 800 ms is enough to size
    // the connection without a 100 MB follow-up.
    bandwidthFinishRequestDuration: 800,
  });

  return new Promise((resolve, reject) => {
    let settled = false;
    let phase: SpeedTestPhase = "connecting";
    let seenThroughput = false;
    let sampleFrame = 0;
    let pendingSample: number | null = null;

    const PHASE_ORDER: SpeedTestPhase[] = [
      "connecting",
      "ping",
      "download",
      "upload",
      "complete",
    ];

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

    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      if (sampleFrame) cancelAnimationFrame(sampleFrame);
      pendingSample = null;
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
      if (measurement.type === "download") {
        seenThroughput = true;
        setPhase("download");
      } else if (measurement.type === "upload") {
        seenThroughput = true;
        setPhase("upload");
      } else if (measurement.type === "latency" && !seenThroughput) {
        setPhase("ping");
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
        if (phase !== "ping") return;
        const pings = results.getUnloadedLatencyPoints();
        const latest = pings[pings.length - 1];
        if (typeof latest === "number") emitSample(latest);
        return;
      }

      if (type === "download") {
        const download = results.getDownloadBandwidth();
        if (download) {
          const mbps = bpsToMbps(download);
          emitSample(mbps);
          onPartial({ downloadMbps: mbps });
        }
        return;
      }

      if (type === "upload") {
        const upload = results.getUploadBandwidth();
        if (upload) {
          const mbps = bpsToMbps(upload);
          emitSample(mbps);
          onPartial({ uploadMbps: mbps });
        }
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
      setPhase("complete");
      onProgress(1);
      finish(() => resolve(outcome));
    };

    engine.play();
  });
}

function bpsToMbps(bps: number): number {
  return bps / 1e6;
}
