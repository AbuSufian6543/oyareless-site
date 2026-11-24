"use client";

import Link from "next/link";
import { memo, useMemo, useState } from "react";

import { CountUp } from "@/components/workdesk/count-up";
import type { DayActivity } from "@/lib/workdesk/activity-series";

const WIDTH = 320;
const HEIGHT = 128;

function ActivityChartCardInner({
  points,
  completedThisWeek,
  previousTotal,
}: {
  points: DayActivity[];
  completedThisWeek: number;
  previousTotal: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const geometry = useMemo(() => {
    const max = Math.max(1, ...points.map((point) => point.total));
    const coords = points.map((point, index) => {
      const x = points.length <= 1 ? WIDTH / 2 : (index / (points.length - 1)) * WIDTH;
      const y = HEIGHT - (point.total / max) * (HEIGHT - 20) - 10;
      return { ...point, x, y };
    });
    const line = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
    const area = `M0,${HEIGHT} ${coords.map((point) => `L${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")} L${WIDTH},${HEIGHT} Z`;
    return { coords, line, area };
  }, [points]);

  const thisWeek = points.reduce((sum, point) => sum + point.total, 0);
  const delta = thisWeek - previousTotal;
  const busiest = points.reduce<DayActivity | null>((best, point) => {
    if (point.total <= 0) return best;
    if (!best || point.total >= best.total) return point;
    return best;
  }, null);
  const comparison =
    thisWeek === 0 && previousTotal === 0
      ? "No activity in the last two weeks"
      : delta === 0
        ? "Same as the previous week"
        : delta > 0
          ? `${delta} more than the previous week`
          : `${Math.abs(delta)} fewer than the previous week`;
  const signature = points.map((point) => `${point.key}:${point.total}:${point.created}:${point.completed}`).join("|");
  const hovered = active === null ? null : geometry.coords[active];

  return (
    <section className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,42,73,0.04)] transition duration-200 hover:-translate-y-px hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-navy-900">Activity</h3>
          <p className="mt-0.5 text-xs text-slate-500">Recorded workdesk events, last 7 days</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        <div>
          <dt className="font-semibold uppercase tracking-wider text-slate-400">This week</dt>
          <dd className="mt-0.5 text-sm font-bold tabular-nums text-navy-900">{thisWeek}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wider text-slate-400">Busiest day</dt>
          <dd className="mt-0.5 text-sm font-bold text-navy-900">{busiest ? busiest.label : "None"}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wider text-slate-400">Tasks finished</dt>
          <dd className="mt-0.5 text-sm font-bold tabular-nums text-navy-900">{completedThisWeek}</dd>
        </div>
        <div>
          <dt className="font-semibold uppercase tracking-wider text-slate-400">Vs last week</dt>
          <dd className="mt-0.5 text-sm font-bold tabular-nums text-navy-900" title={comparison}>
            {thisWeek === 0 && previousTotal === 0 ? "None" : delta === 0 ? "0" : delta > 0 ? `+${delta}` : delta}
          </dd>
        </div>
      </dl>
      <div className="relative mt-3 min-h-32 flex-1">
        <svg
          key={signature}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-32 w-full overflow-visible"
          role="img"
          aria-label="Activity over the last seven days"
        >
          <defs>
            <linearGradient id="wcActivityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22b8d8" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#1478d4" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="wcActivityLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1478d4" />
              <stop offset="100%" stopColor="#22b8d8" />
            </linearGradient>
          </defs>
          <path d={geometry.area} fill="url(#wcActivityFill)" className="wc-area" />
          <path
            d={geometry.line}
            fill="none"
            stroke="url(#wcActivityLine)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            pathLength={1}
            className="wc-line"
          />
          {geometry.coords.map((point, index) => {
            const last = index === geometry.coords.length - 1 && point.total > 0;
            return (
              <g key={point.key}>
                <line
                  x1={point.x}
                  y1={8}
                  x2={point.x}
                  y2={HEIGHT}
                  stroke="#7dd3fc"
                  strokeWidth="1"
                  className={active === index ? "opacity-100" : "opacity-0"}
                  style={{ transition: "opacity 160ms ease" }}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={last ? 4.5 : 3.5}
                  fill="#1478d4"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className={`wc-point${last ? " wc-pulse" : ""}`}
                  style={{ animationDelay: `${index * 55}ms` }}
                />
              </g>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex">
          {geometry.coords.map((point, index) => (
            <button
              key={point.key}
              type="button"
              className="h-full flex-1 cursor-crosshair bg-transparent"
              aria-label={`${point.key}: ${point.total} events, ${point.created} created, ${point.completed} completed`}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive((current) => (current === index ? null : current))}
              onFocus={() => setActive(index)}
              onBlur={() => setActive((current) => (current === index ? null : current))}
            />
          ))}
        </div>
        {hovered ? (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md transition duration-150"
            style={{ left: `${(hovered.x / WIDTH) * 100}%` }}
          >
            <p className="font-bold text-navy-900">{hovered.key}</p>
            <p className="mt-1 text-slate-600">Task updates <span className="float-right font-semibold tabular-nums text-navy-900">{hovered.updates}</span></p>
            <p className="text-slate-600">Tasks created <span className="float-right font-semibold tabular-nums text-navy-900">{hovered.created}</span></p>
            <p className="text-slate-600">Tasks completed <span className="float-right font-semibold tabular-nums text-navy-900">{hovered.completed}</span></p>
            <p className="text-slate-600">Other events <span className="float-right font-semibold tabular-nums text-navy-900">{hovered.other}</span></p>
          </div>
        ) : null}
      </div>
      <p className="mt-2 truncate text-xs text-slate-500">{comparison}</p>
      <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {points.map((point) => (
          <span key={point.key}>{point.label}</span>
        ))}
      </div>
    </section>
  );
}

export const ActivityChartCard = memo(ActivityChartCardInner);

export function TaskDonutCard({
  done,
  open,
  href,
}: {
  done: number;
  open: number;
  href: string;
}) {
  const total = done + open;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;
  const finished = percent === 100 && total > 0;

  return (
    <section className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,42,73,0.04)] transition duration-200 hover:-translate-y-px hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-navy-900">Task progress</h3>
          <p className="mt-0.5 text-xs text-slate-500">Your finished and open tasks</p>
        </div>
        <Link href={href} className="text-xs font-semibold text-brand-700 transition-colors duration-150 hover:underline">
          Details
        </Link>
      </div>
      <div className="mt-4 flex flex-1 items-center gap-4">
        <div className={`group relative size-36 shrink-0 rounded-full ${finished ? "wc-complete" : ""}`}>
          <svg viewBox="0 0 120 120" className="size-36" role="img" aria-label={`${percent} percent of your tasks are finished`}>
            <defs>
              <linearGradient id="wcTaskProgress" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22b8d8" />
                <stop offset="100%" stopColor="#1478d4" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#22b8d8"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.18"
              className="wc-ring"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - dash}
              style={{ ["--wc-ring-from" as string]: circumference, ["--wc-ring-to" as string]: circumference - dash }}
              transform="rotate(-90 60 60)"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="url(#wcTaskProgress)"
              strokeWidth="10"
              strokeLinecap="round"
              className="wc-ring"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - dash}
              style={{ ["--wc-ring-from" as string]: circumference, ["--wc-ring-to" as string]: circumference - dash }}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold tabular-nums tracking-tight text-navy-900">
              <CountUp value={percent} duration={1100} />%
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Finished</span>
            {finished ? (
              <span className="wc-check mt-0.5 text-sm font-bold text-emerald-600" aria-hidden="true">
                ✓
              </span>
            ) : null}
          </div>
          {finished ? (
            <>
              <span className="wc-spark absolute left-2 top-3 size-1.5 rounded-full bg-cyan-300" />
              <span className="wc-spark absolute right-3 top-5 size-1 rounded-full bg-sky-400" style={{ animationDelay: "80ms" }} />
              <span className="wc-spark absolute right-2 bottom-6 size-1.5 rounded-full bg-cyan-200" style={{ animationDelay: "140ms" }} />
            </>
          ) : null}
          <div
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-40 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs opacity-0 shadow-md transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            <p className="flex justify-between gap-3 text-slate-600">Completed <span className="font-semibold tabular-nums text-navy-900">{done}</span></p>
            <p className="flex justify-between gap-3 text-slate-600">Remaining <span className="font-semibold tabular-nums text-navy-900">{open}</span></p>
            <p className="flex justify-between gap-3 text-slate-600">Total <span className="font-semibold tabular-nums text-navy-900">{total}</span></p>
          </div>
        </div>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-brand-500" />
            <span className="text-slate-600">Finished</span>
            <span className="ml-auto font-bold tabular-nums text-navy-900">{done}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-slate-300" />
            <span className="text-slate-600">Still open</span>
            <span className="ml-auto font-bold tabular-nums text-navy-900">{open}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
