"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Tick values, evenly spaced around the arc. Spacing is not linear: a linear
 * 0–1000 dial would crush every domestic connection into the first centimetre,
 * so each band gets equal room and the arc stays readable on a 5 Mbps line and
 * a gigabit one alike.
 */
const STOPS = [0, 1, 5, 10, 25, 50, 100, 250, 500, 1000];
/** Labels drawn on the face. Intermediate stops stay as ticks only. */
const LABELS = new Set([0, 10, 50, 100, 250, 500, 1000]);

const START_ANGLE = 150;
const SWEEP = 240;
const RADIUS = 90;
const CENTRE = { x: 120, y: 118 };

const NEEDLE_TAU_SECONDS = 0.28;
const HOME_TAU_SECONDS = 0.42;

/** Maps Mbps onto 0–1 of the arc by interpolating between the tick stops. */
export function gaugeFraction(mbps: number): number {
  const value = Math.max(0, mbps);
  const last = STOPS.length - 1;
  if (value >= STOPS[last]) return 1;

  for (let index = 0; index < last; index += 1) {
    const low = STOPS[index];
    const high = STOPS[index + 1];
    if (value <= high) {
      const within = (value - low) / (high - low);
      return (index + within) / last;
    }
  }
  return 1;
}

export function formatGaugeValue(value: number): string {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

export function SpeedGauge({
  mbps,
  label,
  unit = "Mbps",
  samples,
  active,
  children,
  className,
}: {
  /** Live throughput, or null when the arc should home to rest. */
  mbps: number | null;
  label: string;
  unit?: string;
  samples: number[];
  active: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const glowId = `${gradientId}-glow`;
  const arcTarget = mbps === null ? 0 : gaugeFraction(mbps);
  const numberTarget = mbps === null ? 0 : Math.max(0, mbps);
  const displayedArc = useSmoothedValue(arcTarget, active);
  const displayedMbps = useSmoothedValue(numberTarget, active);
  const fraction = displayedArc;
  const showReadout =
    !children &&
    active &&
    (mbps !== null || displayedMbps > 0.08);
  const tip = pointAt(fraction, RADIUS);

  return (
    <div className={cn("relative mx-auto w-full max-w-[22rem] sm:max-w-md", className)}>
      <div className="relative">
        <svg
          viewBox="0 0 240 220"
          className="w-full overflow-visible"
          role="img"
          aria-label={
            showReadout
              ? `${label}: ${formatGaugeValue(displayedMbps)} ${unit}`
              : `${label}: at rest`
          }
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-brand-500)" />
              <stop offset="55%" stopColor="var(--color-accent-400)" />
              <stop offset="100%" stopColor="var(--color-accent-200)" />
            </linearGradient>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d={arcPath(0, 1)}
            fill="none"
            stroke="currentColor"
            className="text-white/10"
            strokeWidth={16}
            strokeLinecap="round"
          />

          {fraction > 0.008 && (
            <path
              d={arcPath(0, fraction)}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={16}
              strokeLinecap="round"
              filter={`url(#${glowId})`}
            />
          )}

          {STOPS.map((stop, index) => {
            const tickFraction = index / (STOPS.length - 1);
            const major = LABELS.has(stop);
            const outer = pointAt(tickFraction, RADIUS + 14);
            const inner = pointAt(tickFraction, RADIUS + (major ? 6 : 9));
            const text = pointAt(tickFraction, RADIUS + 26);
            return (
              <g key={stop}>
                <line
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="currentColor"
                  className={major ? "text-white/45" : "text-white/20"}
                  strokeWidth={major ? 2 : 1.25}
                  strokeLinecap="round"
                />
                {major && (
                  <text
                    x={text.x}
                    y={text.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-navy-300 font-mono text-[0.6rem] tracking-wide"
                  >
                    {stop}
                  </text>
                )}
              </g>
            );
          })}

          {fraction > 0.012 && (
            <circle
              cx={tip.x}
              cy={tip.y}
              r={7}
              className="fill-accent-200"
              filter={`url(#${glowId})`}
            />
          )}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {children ? (
            <div className="pointer-events-auto">{children}</div>
          ) : showReadout ? (
            <Readout
              label={label}
              value={formatGaugeValue(displayedMbps)}
              unit={unit}
            />
          ) : null}
        </div>
      </div>

      {active && samples.length >= 3 ? (
        <Sparkline samples={samples} />
      ) : null}
    </div>
  );
}

export function Readout({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="px-4 text-center">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-navy-400">
        {label}
      </p>
      <p className="mt-1 flex items-baseline justify-center gap-1.5">
        <span className="font-mono text-[2.75rem] font-semibold leading-none tracking-tight text-white sm:text-6xl">
          {value}
        </span>
        <span className="text-sm font-semibold text-navy-300">{unit}</span>
      </p>
    </div>
  );
}

function useSmoothedValue(target: number, running: boolean): number {
  const [displayed, setDisplayed] = useState(0);
  const displayedRef = useRef(0);
  const targetRef = useRef(target);
  const runningRef = useRef(running);
  targetRef.current = target;
  runningRef.current = running;
  // Restart the loop when the test stops so the arc can home to zero even
  // though `target` lives in a ref and would not otherwise retrigger it.
  const home = !running && target === 0;

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const goal = targetRef.current;
      const tau =
        goal === 0 && !runningRef.current
          ? HOME_TAU_SECONDS
          : NEEDLE_TAU_SECONDS;

      if (reduceMotion) {
        if (displayedRef.current !== goal) {
          displayedRef.current = goal;
          setDisplayed(goal);
        }
        if (runningRef.current) frame = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const current = displayedRef.current;
      const next = current + (goal - current) * (1 - Math.exp(-dt / tau));
      const settled = Math.abs(next - goal) < 0.004;
      const value = settled ? goal : next;
      const previous = displayedRef.current;
      displayedRef.current = value;
      if (Math.abs(previous - value) >= 0.002 || (settled && previous !== value)) {
        setDisplayed(value);
      }
      if (!settled || runningRef.current) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- target is a ref
  }, [running, home]);

  return displayed;
}

function Sparkline({ samples }: { samples: number[] }) {
  const recent = smoothSeries(samples.slice(-60));
  const peak = Math.max(...recent, 0.001);
  const step = 100 / Math.max(recent.length - 1, 1);
  const points = recent
    .map((value, index) => {
      const x = index * step;
      const y = 28 - (value / peak) * 22;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="mx-auto -mt-1 h-8 w-[70%] opacity-80"
      aria-hidden="true"
    >
      <polyline
        points={`0,32 ${points} 100,32`}
        className="fill-accent-500/15"
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        className="text-accent-300"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function smoothSeries(values: number[]): number[] {
  if (values.length === 0) return values;
  const alpha = 0.35;
  const out: number[] = [values[0]];
  for (let index = 1; index < values.length; index += 1) {
    out.push(out[index - 1] + (values[index] - out[index - 1]) * alpha);
  }
  return out;
}

function arcPath(from: number, to: number): string {
  const start = pointAt(from, RADIUS);
  const end = pointAt(to, RADIUS);
  const largeArc = (to - from) * SWEEP > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function pointAt(fraction: number, radius: number): { x: number; y: number } {
  const angle = ((START_ANGLE + fraction * SWEEP) * Math.PI) / 180;
  return {
    x: CENTRE.x + radius * Math.cos(angle),
    y: CENTRE.y + radius * Math.sin(angle),
  };
}

