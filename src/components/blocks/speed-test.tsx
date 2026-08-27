"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleHelp,
  Copy,
  Info,
  RotateCcw,
  Server,
  Timer,
  Waves,
  Wifi,
} from "lucide-react";

import { SpeedGauge } from "@/components/tools/speed-gauge";
import {
  runSpeedTest,
  SpeedTestError,
  type SpeedTestOutcome,
  type SpeedTestPhase,
} from "@/lib/speedtest-client";
import { cn } from "@/lib/utils";

type Info = {
  ip: string | null;
  networkName: string | null;
  server: { host: string; location: string } | null;
};

type Partial4 = Partial<SpeedTestOutcome>;

const PHASE_COPY: Record<SpeedTestPhase, string> = {
  idle: "Ready when you are",
  connecting: "Connecting to the test server…",
  ping: "Measuring latency and jitter…",
  download: "Measuring download speed…",
  upload: "Measuring upload speed…",
  complete: "Test complete",
};

/**
 * Self-hosted throughput test. It measures against this server rather than a
 * third-party, so results reflect the path to WirelessCom infrastructure.
 */
export function SpeedTest({
  note,
  dark = true,
}: {
  note?: string;
  dark?: boolean;
}) {
  const [phase, setPhase] = useState<SpeedTestPhase>("idle");
  const [live, setLive] = useState<number | null>(null);
  const [samples, setSamples] = useState<number[]>([]);
  const [results, setResults] = useState<Partial4>({});
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<Info | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const run = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResults({});
    setSamples([]);
    setLive(null);
    setProgress(0);
    setError("");
    setShareUrl("");
    setCopied(false);

    // Connection details are informational, so a failure here must not stop
    // the measurement itself.
    void fetch("/api/speedtest/info", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Info | null) => setInfo(data))
      .catch(() => undefined);

    let outcome: SpeedTestOutcome | null = null;
    try {
      outcome = await runSpeedTest({
        signal: controller.signal,
        onPhase: (next) => {
          setPhase(next);
          // Each phase measures something different, so the dial and the trace
          // start fresh rather than carrying the previous phase's shape.
          setSamples([]);
          setLive(null);
        },
        onSample: (value) => {
          setLive(value);
          setSamples((current) => [...current.slice(-119), value]);
        },
        onProgress: setProgress,
        onPartial: (partial) =>
          setResults((current) => ({ ...current, ...partial })),
      });
    } catch (caught) {
      if ((caught as Error)?.name === "AbortError") {
        setPhase("idle");
        setLive(null);
        return;
      }
      setError(
        caught instanceof SpeedTestError
          ? caught.message
          : "The test could not complete. Please check your connection and try again.",
      );
      setPhase("idle");
      return;
    }

    // Saving is what makes the result shareable; if it fails the numbers are
    // still on screen, so this stays quiet.
    try {
      const response = await fetch("/api/speedtest/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(outcome),
      });
      if (response.ok) {
        const data = (await response.json()) as { token?: string };
        if (data.token) {
          setShareUrl(`${window.location.origin}/speed-test/r/${data.token}`);
        }
      }
    } catch {
      // No share link this time.
    }
  }, []);

  const busy =
    phase === "connecting" ||
    phase === "ping" ||
    phase === "download" ||
    phase === "upload";

  const gaugeLabel = phase === "upload" ? "Upload" : "Download";
  const showingLatency = phase === "connecting" || phase === "ping";

  async function copyShare() {
    await navigator.clipboard.writeText(shareUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border",
        dark
          ? "border-navy-700 bg-navy-900"
          : "border-slate-200 bg-white shadow-card",
      )}
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-10 lg:p-8">
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "w-full rounded-xl px-2 py-4",
              dark ? "" : "bg-navy-900",
            )}
          >
            <SpeedGauge
              mbps={showingLatency ? null : live}
              label={showingLatency ? "Latency" : gaugeLabel}
              unit={showingLatency ? "ms" : "Mbps"}
              caption={
                showingLatency && live !== null
                  ? `${live.toFixed(0)} ms round trip`
                  : undefined
              }
              samples={samples}
              active={busy}
            />
          </div>

          <button
            type="button"
            onClick={busy ? () => abortRef.current?.abort() : run}
            aria-live="off"
            className={cn(
              "-mt-2 inline-flex size-24 items-center justify-center rounded-full text-lg font-extrabold uppercase tracking-widest shadow-lg transition-all",
              busy
                ? "bg-navy-700 text-navy-200 hover:bg-navy-600"
                : "bg-accent-500 text-navy-950 hover:scale-105 hover:bg-accent-400",
            )}
          >
            {busy ? "Stop" : phase === "complete" ? <RotateCcw className="size-7" aria-hidden="true" /> : "Go"}
          </button>

          <p
            className={cn(
              "mt-4 text-center text-sm font-medium",
              dark ? "text-navy-300" : "text-slate-600",
            )}
            role="status"
          >
            {error || PHASE_COPY[phase]}
          </p>

          {busy && (
            <div
              className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-navy-700"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-accent-500 transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          )}
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <Metric
              Icon={ArrowDown}
              label="Download"
              unit="Mbps"
              value={results.downloadMbps}
              active={phase === "download"}
              dark={dark}
              emphasis
            />
            <Metric
              Icon={ArrowUp}
              label="Upload"
              unit="Mbps"
              value={results.uploadMbps}
              active={phase === "upload"}
              dark={dark}
              emphasis
            />
            <Metric
              Icon={Timer}
              label="Latency"
              unit="ms"
              value={results.latencyMs}
              active={phase === "ping"}
              dark={dark}
            />
            <Metric
              Icon={Waves}
              label="Jitter"
              unit="ms"
              value={results.jitterMs}
              active={phase === "ping"}
              dark={dark}
            />
          </div>

          <dl
            className={cn(
              "mt-5 grid gap-x-6 gap-y-3 rounded-xl border p-4 text-sm sm:grid-cols-2",
              dark
                ? "border-navy-700 bg-navy-800/50"
                : "border-slate-200 bg-slate-50",
            )}
          >
            <Detail
              Icon={Server}
              term="Test server"
              dark={dark}
              value={
                info?.server
                  ? `${info.server.host} · ${info.server.location}`
                  : "This website"
              }
            />
            <Detail
              Icon={Wifi}
              term="Your network"
              dark={dark}
              value={
                info?.networkName ??
                (info ? "Not published by your provider" : "—")
              }
            />
            <Detail
              Icon={Info}
              term="Your IP address"
              dark={dark}
              value={info?.ip ?? "—"}
            />
            <Detail
              Icon={CircleHelp}
              term="Packet loss"
              dark={dark}
              value="Not measured"
              hint="Packet loss cannot be measured reliably over HTTP. Ask us for an ICMP or MTR test if you suspect a lossy line."
            />
          </dl>

          {shareUrl && (
            <div
              className={cn(
                "mt-4 flex flex-wrap items-center gap-3 rounded-xl border p-3",
                dark
                  ? "border-accent-500/30 bg-accent-500/10"
                  : "border-brand-200 bg-brand-50",
              )}
            >
              <p
                className={cn(
                  "min-w-0 flex-1 truncate font-mono text-xs",
                  dark ? "text-navy-200" : "text-slate-600",
                )}
              >
                {shareUrl}
              </p>
              <button
                type="button"
                onClick={() => void copyShare()}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                  dark
                    ? "bg-accent-500 text-navy-950 hover:bg-accent-400"
                    : "bg-brand-600 text-white hover:bg-brand-700",
                )}
              >
                {copied ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="size-3.5" aria-hidden="true" />
                )}
                {copied ? "Copied" : "Copy share link"}
              </button>
            </div>
          )}

          <p
            className={cn(
              "mt-4 text-xs leading-relaxed",
              dark ? "text-navy-400" : "text-slate-500",
            )}
          >
            {note ||
              "Close file-sharing software and pause downloads before testing, and use a wired connection where you can — Wi-Fi usually limits the result before your internet service does. Figures are a measurement of this browser's path to our server at this moment, not a guarantee of your subscribed rate."}
          </p>
        </div>
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
  value: number | undefined;
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
            ? "border-navy-700 bg-navy-800/40"
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
            value === undefined
              ? dark
                ? "text-navy-600"
                : "text-slate-300"
              : dark
                ? "text-accent-400"
                : "text-brand-600",
          )}
        >
          {value === undefined
            ? active
              ? "…"
              : "—"
            : value >= 100
              ? value.toFixed(0)
              : value.toFixed(1)}
        </span>
        <span className={cn("text-sm", dark ? "text-navy-400" : "text-slate-500")}>
          {unit}
        </span>
      </p>
    </div>
  );
}

function Detail({
  Icon,
  term,
  value,
  hint,
  dark,
}: {
  Icon: typeof Server;
  term: string;
  value: string;
  hint?: string;
  dark: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          dark ? "text-navy-400" : "text-slate-400",
        )}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <dt
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            dark ? "text-navy-400" : "text-slate-500",
          )}
        >
          {term}
        </dt>
        <dd
          className={cn(
            "truncate font-medium",
            dark ? "text-navy-100" : "text-navy-800",
          )}
          title={value}
        >
          {value}
        </dd>
        {hint && (
          <p
            className={cn(
              "mt-0.5 text-xs leading-snug",
              dark ? "text-navy-500" : "text-slate-500",
            )}
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
