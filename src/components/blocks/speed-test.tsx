"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Share2,
  Timer,
  Waves,
} from "lucide-react";

import { Readout, SpeedGauge } from "@/components/tools/speed-gauge";
import {
  runSpeedTest,
  SpeedTestError,
  type SpeedTestOutcome,
  type SpeedTestPhase,
} from "@/lib/speedtest-client";
import { SPEEDTEST_PROVIDER } from "@/lib/speedtest-provider";
import { cn } from "@/lib/utils";

type Info = {
  ip: string | null;
  networkName: string | null;
  server: { host: string; location: string } | null;
};

type Partial4 = Partial<SpeedTestOutcome>;

const PHASE_COPY: Record<SpeedTestPhase, string> = {
  idle: "",
  connecting: "Connecting to Cloudflare's edge…",
  ping: "Measuring latency and jitter…",
  download: "Measuring download speed…",
  upload: "Measuring upload speed…",
  complete: "Test complete",
};

const PHASE_STEPS = [
  { id: "ping", label: "Latency" },
  { id: "download", label: "Download" },
  { id: "upload", label: "Upload" },
] as const;

/**
 * Throughput test against Cloudflare's public edge network. Results reflect
 * this browser's path to the nearest Cloudflare location, not our server.
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
  const [error, setError] = useState("");
  const [info, setInfo] = useState<Info | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const phaseRef = useRef<SpeedTestPhase>("idle");

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
    setError("");
    setShareUrl("");
    setCopied(false);
    phaseRef.current = "idle";

    void fetch("/api/speedtest/info", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Info | null) => setInfo(data))
      .catch(() => undefined);

    let outcome: SpeedTestOutcome | null = null;
    try {
      outcome = await runSpeedTest({
        signal: controller.signal,
        onPhase: (next) => {
          const previous = phaseRef.current;
          phaseRef.current = next;
          setPhase(next);
          if (next === "complete") {
            setLive(null);
            setSamples([]);
            return;
          }
          if (next === previous) return;
          setSamples([]);
          setLive(null);
        },
        onSample: (value) => {
          setLive(value);
          setSamples((current) => [...current.slice(-119), value]);
        },
        onProgress: () => undefined,
        onPartial: (partial) =>
          setResults((current) => ({ ...current, ...partial })),
      });
    } catch (caught) {
      if ((caught as Error)?.name === "AbortError") {
        phaseRef.current = "idle";
        setPhase("idle");
        setLive(null);
        setSamples([]);
        return;
      }
      setError(
        caught instanceof SpeedTestError
          ? caught.message
          : "The test could not complete. Please check your connection and try again.",
      );
      phaseRef.current = "idle";
      setPhase("idle");
      setLive(null);
      setSamples([]);
      return;
    }

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
  const showingLatency = phase === "connecting" || phase === "ping";
  const throughput = phase === "download" || phase === "upload";
  const complete = phase === "complete";

  const gaugeMbps = throughput ? live : null;

  async function copyShare() {
    await navigator.clipboard.writeText(shareUrl).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const status = error || PHASE_COPY[phase];

  return (
    <div
      className={cn(
        !dark &&
          "overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-card sm:p-6",
      )}
    >
      <div
        className={cn(
          "relative mx-auto max-w-3xl rounded-[1.75rem] border border-white/10 bg-navy-950/75",
          "shadow-[0_0_80px_-28px_rgba(34,184,216,0.45)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem] bg-[radial-gradient(ellipse_at_50%_28%,rgb(34_184_216_/_0.14),transparent_58%)]"
          aria-hidden="true"
        />

        <div className="relative px-4 py-8 sm:px-10 sm:py-10">
          <SpeedGauge
            mbps={gaugeMbps}
            label={phase === "upload" ? "Upload" : "Download"}
            unit="Mbps"
            samples={throughput ? samples : []}
            active={throughput}
          >
            {phase === "idle" || phase === "complete" ? (
              <GoControl
                pulse={phase === "idle"}
                hint={phase === "complete" ? "Test again" : "Start speed test"}
                onClick={() => void run()}
              />
            ) : showingLatency ? (
              <LatencyFace connecting={phase === "connecting"} ms={live} />
            ) : null}
          </SpeedGauge>

          <PhasePills phase={phase} />

          <div className="mt-5 min-h-8 text-center">
            {status ? (
              <p
                className={cn(
                  "text-sm font-medium",
                  error ? "text-red-400" : "text-navy-300",
                )}
                role="status"
              >
                {status}
              </p>
            ) : null}

            {busy && (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="mt-2 text-sm font-semibold text-navy-400 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Stop test
              </button>
            )}
          </div>

          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 border-t border-white/10 pt-8 sm:grid-cols-4 sm:gap-6">
            <Metric
              Icon={ArrowDown}
              label="Download"
              unit="Mbps"
              value={results.downloadMbps}
              active={phase === "download"}
              dark
            />
            <Metric
              Icon={ArrowUp}
              label="Upload"
              unit="Mbps"
              value={results.uploadMbps}
              active={phase === "upload"}
              dark
            />
            <Metric
              Icon={Timer}
              label="Latency"
              unit="ms"
              value={results.latencyMs}
              active={showingLatency}
              dark
            />
            <Metric
              Icon={Waves}
              label="Jitter"
              unit="ms"
              value={results.jitterMs}
              active={showingLatency}
              dark
            />
          </div>
        </div>
      </div>

      <dl
        className={cn(
          "mx-auto mt-8 flex max-w-3xl flex-col gap-2 text-center text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-5 sm:gap-y-1",
          dark ? "text-navy-300" : "text-slate-600",
        )}
      >
        <div>
          <dt className="sr-only">Test server</dt>
          <dd>
            {info?.server
              ? `${info.server.host} · ${info.server.location}`
              : `${SPEEDTEST_PROVIDER.host} · ${SPEEDTEST_PROVIDER.location}`}
          </dd>
        </div>
        <MetaDot dark={dark} />
        <div>
          <dt className="sr-only">Your network</dt>
          <dd>
            {info?.networkName ??
              (info ? "Network name not published" : "Your network")}
          </dd>
        </div>
        <MetaDot dark={dark} />
        <div>
          <dt className="sr-only">Your IP address</dt>
          <dd className="font-mono text-[0.8125rem]">{info?.ip ?? "—"}</dd>
        </div>
      </dl>

      {shareUrl && (
        <div className="mx-auto mt-6 flex max-w-3xl justify-center">
          <button
            type="button"
            onClick={() => void copyShare()}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors",
              dark
                ? "bg-accent-500 text-navy-950 hover:bg-accent-400"
                : "bg-brand-600 text-white hover:bg-brand-700",
            )}
          >
            {copied ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Share2 className="size-4" aria-hidden="true" />
            )}
            {copied ? "Link copied" : "Copy share link"}
          </button>
        </div>
      )}

      <p
        className={cn(
          "mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed",
          dark ? "text-navy-400" : "text-slate-500",
        )}
      >
        {note ||
          "Pause downloads and use a wired connection where you can — Wi-Fi usually limits the result before your internet service does. This is a measurement of this browser's path to Cloudflare's nearest edge at this moment, not a guarantee of your subscribed rate. Packet loss is not measured over HTTP."}
      </p>
    </div>
  );
}

function GoControl({
  hint,
  pulse,
  onClick,
}: {
  hint: string;
  pulse: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={hint}
      className="relative flex size-[6.25rem] items-center justify-center rounded-full bg-accent-400 text-[1.35rem] font-extrabold tracking-[0.22em] text-navy-950 shadow-[0_0_0_10px_rgba(56,189,248,0.12),0_16px_40px_-8px_rgba(14,165,233,0.55)] transition-transform hover:scale-[1.04] hover:bg-accent-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-200 sm:size-[7.25rem] sm:text-[1.5rem]"
    >
      {pulse && (
        <span
          className="animate-go-ring pointer-events-none absolute -inset-1 rounded-full border-2 border-accent-200/80"
          aria-hidden="true"
        />
      )}
      <span className="relative pl-0.5">GO</span>
    </button>
  );
}

function LatencyFace({
  connecting,
  ms,
}: {
  connecting: boolean;
  ms: number | null;
}) {
  if (connecting && ms === null) {
    return (
      <div className="px-4 text-center">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-navy-400">
          Connecting
        </p>
        <p className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-navy-300">
          <span
            className="size-1.5 rounded-full bg-accent-400 animate-live-dot"
            aria-hidden="true"
          />
          Finding edge
        </p>
      </div>
    );
  }

  return (
    <Readout
      label="Latency"
      value={ms === null ? "…" : ms.toFixed(0)}
      unit="ms"
    />
  );
}

function PhasePills({ phase }: { phase: SpeedTestPhase }) {
  const currentIndex =
    phase === "connecting" || phase === "ping"
      ? 0
      : phase === "download"
        ? 1
        : phase === "upload"
          ? 2
          : phase === "complete"
            ? 3
            : -1;

  return (
    <ol className="mt-2 flex items-center justify-center gap-2 sm:gap-3">
      {PHASE_STEPS.map((step, index) => {
        const done = currentIndex > index;
        const current = currentIndex === index;
        return (
          <li key={step.id} className="flex items-center gap-2 sm:gap-3">
            {index > 0 && (
              <span
                className={cn(
                  "hidden h-px w-6 sm:block",
                  done || current ? "bg-accent-500/70" : "bg-white/10",
                )}
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] transition-colors",
                current
                  ? "bg-accent-500/15 text-accent-300 ring-1 ring-accent-400/40"
                  : done
                    ? "text-navy-200"
                    : "text-navy-500",
              )}
            >
              {done && <Check className="size-3" aria-hidden="true" />}
              {current && (
                <span
                  className="size-1.5 rounded-full bg-accent-400 animate-live-dot"
                  aria-hidden="true"
                />
              )}
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Metric({
  Icon,
  label,
  unit,
  value,
  active,
  dark,
}: {
  Icon: typeof ArrowDown;
  label: string;
  unit: string;
  value: number | undefined;
  active: boolean;
  dark: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={cn(
          "flex items-center justify-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em]",
          active
            ? "text-accent-300"
            : dark
              ? "text-navy-400"
              : "text-slate-500",
        )}
      >
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 flex items-baseline justify-center gap-1">
        <span
          className={cn(
            "font-mono text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl",
            value === undefined
              ? dark
                ? "text-navy-700"
                : "text-slate-300"
              : dark
                ? "text-white"
                : "text-navy-900",
            active && "text-accent-300",
          )}
        >
          {value === undefined
            ? active
              ? "…"
              : "—"
            : formatMetric(value, unit)}
        </span>
      </p>
      <p
        className={cn(
          "mt-0.5 text-xs font-medium",
          dark ? "text-navy-400" : "text-slate-500",
        )}
      >
        {unit}
      </p>
    </div>
  );
}

function MetaDot({ dark }: { dark: boolean }) {
  return (
    <span
      className={cn(
        "hidden size-1 rounded-full sm:inline-block",
        dark ? "bg-navy-600" : "bg-slate-300",
      )}
      aria-hidden="true"
    />
  );
}

function formatMetric(value: number, unit: string): string {
  if (unit === "ms") return value.toFixed(1);
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
}
