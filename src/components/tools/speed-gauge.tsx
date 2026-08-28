"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Tick values, evenly spaced around the arc. The spacing is deliberately not
 * linear: a linear 0–1000 dial would crush every domestic connection into the
 * first centimetre, so each band gets equal room and the needle stays readable
 * on a 5 Mbps line and a gigabit one alike.
 */
const STOPS = [0, 1, 5, 10, 25, 50, 100, 250, 500, 1000];

const START_ANGLE = 135;
const SWEEP = 270;
const RADIUS = 88;
const CENTRE = 100;

/** How quickly the needle and readout catch the live figure, in seconds. */
const NEEDLE_TAU_SECONDS = 0.28;

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

export function SpeedGauge({
  mbps,
  label,
  unit = "Mbps",
  caption,
  samples,
  active,
  className,
}: {
  /** Live value, or null before a reading exists. */
  mbps: number | null;
  label: string;
  unit?: string;
  caption?: string;
  /** Recent readings for the sparkline, oldest first. */
  samples: number[];
  active: boolean;
  className?: string;
}) {
  const target = mbps === null ? 0 : Math.max(0, mbps);
  const displayed = useSmoothedValue(target, active);
  const fraction = gaugeFraction(displayed);
  const angle = START_ANGLE + fraction * SWEEP;
  const showReadout = mbps !== null || displayed > 0.08;

  return (
    <div className={cn("relative mx-auto w-full max-w-sm", className)}>
      <svg
        viewBox="0 0 200 200"
        className="w-full"
        role="img"
        aria-label={
          mbps === null && !showReadout
            ? `${label}: waiting to start`
            : `${label}: ${formatValue(displayed)} ${unit}`
        }
      >
        <defs>
          <linearGradient id="gauge-arc" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-brand-500)" />
            <stop offset="60%" stopColor="var(--color-accent-400)" />
            <stop offset="100%" stopColor="var(--color-accent-300)" />
          </linearGradient>
        </defs>

        <path
          d={arcPath(0, 1)}
          fill="none"
          stroke="currentColor"
          className="text-navy-700/60"
          strokeWidth={10}
          strokeLinecap="round"
        />

        {fraction > 0.005 && (
          <path
            d={arcPath(0, fraction)}
            fill="none"
            stroke="url(#gauge-arc)"
            strokeWidth={10}
            strokeLinecap="round"
          />
        )}

        {STOPS.map((stop, index) => {
          const tickFraction = index / (STOPS.length - 1);
          const outer = pointAt(tickFraction, RADIUS - 9);
          const inner = pointAt(tickFraction, RADIUS - 16);
          const text = pointAt(tickFraction, RADIUS - 28);
          return (
            <g key={stop}>
              <line
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke="currentColor"
                className="text-navy-600"
                strokeWidth={1.5}
              />
              <text
                x={text.x}
                y={text.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-navy-400 text-[0.5rem] font-semibold"
              >
                {stop}
              </text>
            </g>
          );
        })}

        {/* Rotated from the dial origin every frame. CSS transitions on SVG
            transforms restart from the last target and make the needle bounce. */}
        <g
          style={{
            transformOrigin: `${CENTRE}px ${CENTRE}px`,
            transform: `rotate(${angle - START_ANGLE}deg)`,
          }}
        >
          <line
            x1={CENTRE}
            y1={CENTRE}
            x2={pointAt(0, RADIUS - 22).x}
            y2={pointAt(0, RADIUS - 22).y}
            stroke="currentColor"
            className="text-accent-400"
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={6}
          className="fill-navy-800 stroke-accent-400"
          strokeWidth={2}
        />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-navy-400">
          {label}
        </p>
        <p className="mt-0.5 flex items-baseline justify-center gap-1.5">
          <span className="text-4xl font-extrabold tabular-nums text-white">
            {showReadout ? formatValue(displayed) : "—"}
          </span>
          <span className="text-sm font-semibold text-navy-300">{unit}</span>
        </p>
        {caption && (
          <p className="mt-1 text-[0.6875rem] text-navy-400">{caption}</p>
        )}
      </div>

      <Sparkline samples={samples} />
    </div>
  );
}

/**
 * Eases the dial toward each new reading so a single noisy sample cannot yank
 * the needle. One animation loop runs for the life of the test; restarting it
 * on every sample is what used to make the transform hitch.
 */
function useSmoothedValue(target: number, active: boolean): number {
  const [displayed, setDisplayed] = useState(0);
  const displayedRef = useRef(0);
  const targetRef = useRef(target);
  const activeRef = useRef(active);
  targetRef.current = target;
  activeRef.current = active;

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const goal = targetRef.current;
      if (reduceMotion) {
        if (displayedRef.current !== goal) {
          displayedRef.current = goal;
          setDisplayed(goal);
        }
        if (activeRef.current) frame = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const current = displayedRef.current;
      const next =
        current + (goal - current) * (1 - Math.exp(-dt / NEEDLE_TAU_SECONDS));
      const settled = Math.abs(next - goal) < 0.04;
      const value = settled ? goal : next;
      const previous = displayedRef.current;
      displayedRef.current = value;
      if (Math.abs(previous - value) >= 0.005) {
        setDisplayed(value);
      }
      if (!settled || activeRef.current) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return displayed;
}

/**
 * Shows how steady the connection was during the phase. Scaled to its own peak
 * rather than the dial, so variation is visible even on a slow link.
 */
function Sparkline({ samples }: { samples: number[] }) {
  if (samples.length < 3) {
    return <div className="mt-2 h-10" aria-hidden="true" />;
  }

  const recent = smoothSeries(samples.slice(-60));
  const peak = Math.max(...recent, 0.001);
  const step = 100 / Math.max(recent.length - 1, 1);
  const points = recent
    .map((value, index) => {
      const x = index * step;
      const y = 30 - (value / peak) * 26;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 32"
      preserveAspectRatio="none"
      className="mt-2 h-10 w-full"
      aria-hidden="true"
    >
      <polyline
        points={`0,32 ${points} 100,32`}
        className="fill-accent-500/10"
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        className="text-accent-400"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Light pass so the trace is a curve, not a seismograph of every request. */
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

/**
 * Angles run clockwise on screen from the lower left (135°) through the top to
 * the lower right (405°), which is the 270° sweep a dial face wants.
 */
function pointAt(fraction: number, radius: number): { x: number; y: number } {
  const angle = ((START_ANGLE + fraction * SWEEP) * Math.PI) / 180;
  return {
    x: CENTRE + radius * Math.cos(angle),
    y: CENTRE + radius * Math.sin(angle),
  };
}

function formatValue(value: number): string {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
}
