"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleHelp,
  Copy,
  Info,
  Server,
  Share2,
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
import { SPEEDTEST_PROVIDER } from "@/lib/speedtest-provider";
import { cn } from "@/lib/utils";

type Info = {
  ip: string | null;
  networkName: string | null;
  server: { host: string; location: string } | null;
};

type Partial4 = Partial<SpeedTestOutcome>;

const PHASE_COPY: Record<SpeedTestPhase, string> = {
  idle: "Press GO to measure against Cloudflare's edge",
  connecting: "Connecting to the test server…",
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
  const [progress, setProgress] = useState(0);
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
    setProgress(0);
    setError("");
    setShareUrl("");
    setCopied(false);
    phaseRef.current = "idle";

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
          const previous = phaseRef.current;
          phaseRef.current = next;
          setPhase(next);
          if (next === "complete") {
            setLive(null);
            setSamples([]);
            return;
          }
          // The dial belongs to one kind of reading at a time. Resetting on
          // every Cloudflare round — including the ping bursts between
          // download sizes — is what made the needle bounce.
          if (next === previous) return;
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
        phaseRef.current = "idle";
        setPhase("idle");
        setLive(null);
        setSamples([]);
        setProgress(0);
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
  const idleOrDone = phase === "idle" || phase === "complete";

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
          ? "border-navy-700 bg-navy-900 shadow-[0_0_0_1px_rgba(56,189,248,0.06),0_24px_80px_-32px_rgba(0,0,0,0.7)]"
          : "border-slate-200 bg-white shadow-card",
      )}
    >
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,24rem)_1fr] lg:items-start lg:gap-12">
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "relative w-full rounded-2xl px-3 pb-5 pt-3",
              dark ? "bg-navy-950/40" : "bg-navy-900",
            )}
          >
            <SpeedGauge
              mbps={busy && !showingLatency ? live : null}
              label={gaugeLabel}
              unit="Mbps"
              samples={samples}
              active={busy && !showingLatency}
            >
              {idleOrDone ? (
                <GoControl
                  label={phase === "complete" ? "Again" : "GO"}
                  hint={
                    phase === "complete" ? "Test again" : "Start speed test"
                  }
                  pulse={phase === "idle"}
                  onClick={() => void run()}
                />
              ) : showingLatency ? (
                <LatencyReadout
                  connecting={phase === "connecting"}
                  ms={live}
                />
              ) : null}
            </SpeedGauge>

            <PhaseStepper phase={phase} />

            <div className="mx-auto mt-4 h-1.5 w-full max-w-xs">
              {busy && (
                <div
                  className="h-full overflow-hidden rounded-full bg-navy-800"
                  role="progressbar"
                  aria-valuenow={Math.round(progress * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-accent-500 transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <p
            className={cn(
              "mt-4 text-center text-sm font-medium",
              error
                ? "text-red-400"
                : dark
                  ? "text-navy-300"
                  : "text-slate-600",
            )}
            role="status"
          >
            {error || PHASE_COPY[phase]}
          </p>

          {busy && (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="mt-3 text-sm font-semibold text-navy-400 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Stop test
            </button>
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
              done={phase === "complete" && results.downloadMbps !== undefined}
              dark={dark}
              emphasis
            />
            <Metric
              Icon={ArrowUp}
              label="Upload"
              unit="Mbps"
              value={results.uploadMbps}
              active={phase === "upload"}
              done={phase === "complete" && results.uploadMbps !== undefined}
              dark={dark}
              emphasis
            />
            <Metric
              Icon={Timer}
              label="Latency"
              unit="ms"
              value={results.latencyMs}
              active={phase === "ping"}
              done={phase === "complete" && results.latencyMs !== undefined}
              dark={dark}
            />
            <Metric
              Icon={Waves}
              label="Jitter"
              unit="ms"
              value={results.jitterMs}
              active={phase === "ping"}
              done={phase === "complete" && results.jitterMs !== undefined}
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
                  : `${SPEEDTEST_PROVIDER.host} · ${SPEEDTEST_PROVIDER.location}`
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
                "mt-4 flex flex-wrap items-center gap-3 rounded-xl border p-3.5",
                dark
                  ? "border-accent-500/30 bg-accent-500/10"
                  : "border-brand-200 bg-brand-50",
              )}
            >
              <Share2
                className={cn(
                  "size-4 shrink-0",
                  dark ? "text-accent-400" : "text-brand-600",
                )}
                aria-hidden="true"
              />
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
              "Close file-sharing software and pause downloads before testing, and use a wired connection where you can — Wi-Fi usually limits the result before your internet service does. Figures are a measurement of this browser's path to Cloudflare's nearest edge at this moment, not a guarantee of your subscribed rate."}
          </p>
        </div>
      </div>
    </div>
  );
}

function GoControl({
  label,
  hint,
  pulse,
  onClick,
}: {
  label: string;
  hint: string;
  pulse: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={hint}
      className="relative flex size-[5.5rem] items-center justify-center rounded-full bg-accent-500 text-lg font-extrabold uppercase tracking-[0.18em] text-navy-950 shadow-[0_0_0_6px_rgba(56,189,248,0.18),0_12px_32px_-8px_rgba(14,165,233,0.55)] transition-transform hover:scale-105 hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-300 sm:size-24 sm:text-xl"
    >
      {pulse && (
        <span
          className="animate-go-ring pointer-events-none absolute -inset-1 rounded-full border-2 border-accent-300/70"
          aria-hidden="true"
        />
      )}
      <span className="relative">{label}</span>
    </button>
  );
}

function LatencyReadout({
  connecting,
  ms,
}: {
  connecting: boolean;
  ms: number | null;
}) {
  return (
    <div className="px-4 text-center">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-navy-400">
        Latency
      </p>
      {connecting && ms === null ? (
        <p className="mt-2 text-sm font-semibold text-navy-300">Starting…</p>
      ) : (
        <p className="mt-0.5 flex items-baseline justify-center gap-1.5">
          <span className="text-4xl font-extrabold tabular-nums leading-none text-white sm:text-[2.75rem]">
            {ms === null ? "…" : ms.toFixed(0)}
          </span>
          <span className="text-sm font-semibold text-navy-300">ms</span>
        </p>
      )}
    </div>
  );
}

function PhaseStepper({ phase }: { phase: SpeedTestPhase }) {
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
    <ol className="mt-2 flex w-full max-w-xs items-center justify-between gap-1">
      {PHASE_STEPS.map((step, index) => {
        const done = currentIndex > index;
        const current = currentIndex === index;
        return (
          <li
            key={step.id}
            className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                "h-1.5 w-full rounded-full transition-colors",
                done || current ? "bg-accent-500" : "bg-navy-700",
                current && "shadow-[0_0_10px_rgba(14,165,233,0.55)]",
              )}
            />
            <span
              className={cn(
                "text-[0.65rem] font-bold uppercase tracking-wider",
                current
                  ? "text-accent-300"
                  : done
                    ? "text-navy-200"
                    : "text-navy-500",
              )}
            >
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
  done,
  dark,
  emphasis = false,
}: {
  Icon: typeof ArrowDown;
  label: string;
  unit: string;
  value: number | undefined;
  active: boolean;
  done: boolean;
  dark: boolean;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        active
          ? dark
            ? "border-accent-500/50 bg-accent-500/10"
            : "border-brand-300 bg-brand-50"
          : done
            ? dark
              ? "border-navy-600 bg-navy-800"
              : "border-slate-200 bg-white"
            : dark
              ? "border-navy-700 bg-navy-800/40"
              : "border-slate-200 bg-slate-50",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider",
          active
            ? dark
              ? "text-accent-300"
              : "text-brand-700"
            : dark
              ? "text-navy-400"
              : "text-slate-500",
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
