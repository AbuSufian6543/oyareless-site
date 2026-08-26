"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Gauge, LoaderCircle, Timer } from "lucide-react";

import { cn } from "@/lib/utils";

type Phase = "idle" | "ping" | "download" | "upload" | "done";

type Results = {
  ping: number | null;
  jitter: number | null;
  download: number | null;
  upload: number | null;
};

const EMPTY: Results = { ping: null, jitter: null, download: null, upload: null };

/**
 * Self-hosted throughput test. It measures against this server rather than a
 * third-party, so results reflect the path to WirelessCom infrastructure.
 */
export function SpeedTest({ note, dark = false }: { note?: string; dark?: boolean }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<Results>(EMPTY);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    setResults(EMPTY);
    setError("");
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // --- Latency -------------------------------------------------------
      setPhase("ping");
      const samples: number[] = [];
      for (let index = 0; index < 6; index += 1) {
        const started = performance.now();
        await fetch(`/api/speedtest/ping?n=${index}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        samples.push(performance.now() - started);
        setProgress(((index + 1) / 6) * 20);
      }
      // Drop the first sample: it includes connection setup.
      const timed = samples.slice(1);
      const ping = Math.min(...timed);
      const mean = timed.reduce((sum, value) => sum + value, 0) / timed.length;
      const jitter =
        timed.reduce((sum, value) => sum + Math.abs(value - mean), 0) /
        timed.length;
      setResults((current) => ({
        ...current,
        ping: Math.round(ping),
        jitter: Math.round(jitter),
      }));

      // --- Download ------------------------------------------------------
      setPhase("download");
      let downloadedBytes = 0;
      let downloadMs = 0;
      // Ramp up chunk size so slow links are not stuck on a huge payload.
      for (const megabytes of [2, 6, 12]) {
        const started = performance.now();
        const response = await fetch(
          `/api/speedtest/download?mb=${megabytes}&t=${Date.now()}`,
          { cache: "no-store", signal: controller.signal },
        );
        const buffer = await response.arrayBuffer();
        const elapsed = performance.now() - started;
        downloadedBytes += buffer.byteLength;
        downloadMs += elapsed;
        setProgress(20 + (downloadedBytes / (20 * 1024 * 1024)) * 45);
        // Stop early once we have enough signal on a fast connection.
        if (downloadMs > 8000) break;
      }
      const downloadMbps = (downloadedBytes * 8) / (downloadMs / 1000) / 1e6;
      setResults((current) => ({
        ...current,
        download: Number(downloadMbps.toFixed(1)),
      }));

      // --- Upload --------------------------------------------------------
      setPhase("upload");
      const payload = new Uint8Array(3 * 1024 * 1024);
      crypto.getRandomValues(payload.subarray(0, 65536));
      let uploadedBytes = 0;
      let uploadMs = 0;
      for (let round = 0; round < 3; round += 1) {
        const started = performance.now();
        await fetch("/api/speedtest/upload", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/octet-stream" },
          cache: "no-store",
          signal: controller.signal,
        });
        uploadMs += performance.now() - started;
        uploadedBytes += payload.byteLength;
        setProgress(65 + ((round + 1) / 3) * 35);
        if (uploadMs > 8000) break;
      }
      const uploadMbps = (uploadedBytes * 8) / (uploadMs / 1000) / 1e6;
      setResults((current) => ({
        ...current,
        upload: Number(uploadMbps.toFixed(1)),
      }));

      setProgress(100);
      setPhase("done");
    } catch (caught) {
      if ((caught as Error)?.name === "AbortError") {
        setPhase("idle");
        return;
      }
      setError("The test could not complete. Please try again.");
      setPhase("idle");
    }
  }, []);

  const busy = phase === "ping" || phase === "download" || phase === "upload";

  return (
    <div
      className={cn(
        "rounded-xl border p-6 lg:p-8",
        dark ? "border-navy-700 bg-navy-800/60" : "border-slate-200 bg-white shadow-card",
      )}
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          Icon={ArrowDown}
          label="Download"
          unit="Mbps"
          value={results.download}
          active={phase === "download"}
          dark={dark}
          emphasis
        />
        <Metric
          Icon={ArrowUp}
          label="Upload"
          unit="Mbps"
          value={results.upload}
          active={phase === "upload"}
          dark={dark}
          emphasis
        />
        <Metric
          Icon={Timer}
          label="Latency"
          unit="ms"
          value={results.ping}
          active={phase === "ping"}
          dark={dark}
        />
        <Metric
          Icon={Gauge}
          label="Jitter"
          unit="ms"
          value={results.jitter}
          active={phase === "ping"}
          dark={dark}
        />
      </div>

      {busy && (
        <div
          className={cn(
            "mt-6 h-1.5 overflow-hidden rounded-full",
            dark ? "bg-navy-700" : "bg-slate-200",
          )}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-accent-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={busy ? () => abortRef.current?.abort() : run}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold shadow-sm transition-all",
            busy
              ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
              : "bg-brand-600 text-white hover:bg-brand-700 hover:shadow-md",
          )}
        >
          {busy ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              Cancel
            </>
          ) : (
            <>
              <Gauge className="size-4" aria-hidden="true" />
              {phase === "done" ? "Test again" : "Start speed test"}
            </>
          )}
        </button>

        <p className={cn("text-xs leading-relaxed", dark ? "text-navy-400" : "text-slate-500")}>
          {note ||
            "Close file-sharing software and pause downloads before testing. Results are approximate."}
        </p>
      </div>
    </div>
  );
}

function Metric({
  Icon,
  label,
  unit,
  value,
  active,
  dark,
  emphasis = false,
}: {
  Icon: typeof ArrowDown;
  label: string;
  unit: string;
  value: number | null;
  active: boolean;
  dark: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        active
          ? dark
            ? "border-accent-500/50 bg-accent-500/10"
            : "border-brand-300 bg-brand-50"
          : dark
            ? "border-navy-700 bg-navy-900/40"
            : "border-slate-200 bg-slate-50",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider",
          dark ? "text-navy-400" : "text-slate-500",
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 flex items-baseline gap-1">
        <span
          className={cn(
            emphasis ? "text-3xl" : "text-2xl",
            "font-extrabold tabular-nums",
            value === null
              ? dark
                ? "text-navy-600"
                : "text-slate-300"
              : dark
                ? "text-accent-400"
                : "text-brand-600",
          )}
        >
          {value === null ? (active ? "…" : "—") : value}
        </span>
        <span className={cn("text-sm", dark ? "text-navy-400" : "text-slate-500")}>
          {unit}
        </span>
      </p>
    </div>
  );
}
