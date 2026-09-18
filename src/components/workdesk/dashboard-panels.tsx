import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { StaffIllustration } from "@/components/workdesk/staff-illustration";
import type { DashboardPersona } from "@/generated/prisma/client";
import { zonedParts } from "@/lib/timezone";
import { cn, formatDate } from "@/lib/utils";
import { staffRoleLabel } from "@/lib/workdesk/rules";

export function WorkdeskPageHeader({
  kicker,
  title,
  description,
  persona,
  accountHref,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  persona?: DashboardPersona | null;
  accountHref?: string;
  actions?: ReactNode;
}) {
  const portrait =
    persona !== undefined ? (
      <span className="size-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">
        <StaffIllustration persona={persona} size="thumb" />
      </span>
    ) : null;

  return (
    <header className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,42,73,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        {accountHref && portrait ? (
          <Link href={accountHref} className="shrink-0" title="Change illustration">
            {portrait}
          </Link>
        ) : (
          portrait
        )}
        <div className="min-w-0">
          {kicker ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {kicker}
            </p>
          ) : null}
          <h1 className="truncate text-xl font-bold tracking-tight text-navy-900">{title}</h1>
          {description ? (
            <p className="mt-0.5 max-w-2xl text-sm leading-snug text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function DashboardHero({
  hello,
  firstName,
  todayLabel,
  summary,
  persona,
  actions,
  accountHref,
}: {
  hello: string;
  firstName: string;
  todayLabel: string;
  summary: string;
  persona: DashboardPersona | null;
  actions: ReactNode;
  picker?: ReactNode;
  accountHref?: string;
}) {
  return (
    <WorkdeskPageHeader
      kicker={todayLabel}
      title={`${hello}, ${firstName}`}
      description={summary}
      persona={persona}
      accountHref={accountHref}
      actions={actions}
    />
  );
}

export function DashboardProfileCard({
  hello,
  firstName,
  role,
  persona,
  newTaskCount,
  homeHref,
  accountHref,
  picker,
}: {
  hello: string;
  firstName: string;
  role: string;
  persona: DashboardPersona | null;
  newTaskCount: number;
  homeHref: string;
  accountHref: string;
  picker?: ReactNode;
}) {
  return (
    <aside className="flex h-full flex-col rounded-3xl border border-navy-800/80 bg-gradient-to-b from-navy-900 to-navy-950 p-5 text-white shadow-[0_18px_40px_-24px_rgba(7,30,57,0.8)]">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-navy-300">
        My profile
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="size-12 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
          <StaffIllustration persona={persona} size="thumb" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-navy-200">
            {hello}, {firstName}
          </p>
          <p className="truncate text-lg font-bold">{firstName}</p>
          <p className="text-xs font-semibold text-accent-300">{staffRoleLabel(role)}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-navy-100">
        {newTaskCount > 0
          ? `You have ${newTaskCount} open task${newTaskCount === 1 ? "" : "s"} assigned to you.`
          : "You are caught up — nothing is assigned to you right now."}
      </p>
      {picker}
      <Link
        href={homeHref}
        className="mt-auto inline-flex items-center justify-center rounded-full bg-brand-400 px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy-950 hover:bg-brand-300"
      >
        See all tasks
      </Link>
      <Link
        href={accountHref}
        className="mt-2 text-center text-xs font-semibold text-navy-300 hover:text-white"
      >
        Change illustration
      </Link>
    </aside>
  );
}

export const STAT_TONES = {
  sky: {
    card: "border-sky-200 bg-gradient-to-br from-sky-50 to-white hover:border-sky-300",
    icon: "bg-sky-100 text-sky-700",
    value: "text-sky-800",
  },
  cyan: {
    card: "border-cyan-200 bg-gradient-to-br from-cyan-50 to-white hover:border-cyan-300",
    icon: "bg-cyan-100 text-cyan-700",
    value: "text-cyan-800",
  },
  amber: {
    card: "border-amber-200 bg-gradient-to-br from-amber-50 to-white hover:border-amber-300",
    icon: "bg-amber-100 text-amber-800",
    value: "text-amber-800",
  },
  rose: {
    card: "border-rose-200 bg-gradient-to-br from-rose-50 to-white hover:border-rose-300",
    icon: "bg-rose-100 text-rose-700",
    value: "text-rose-800",
  },
  emerald: {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-300",
    icon: "bg-emerald-100 text-emerald-700",
    value: "text-emerald-800",
  },
  violet: {
    card: "border-violet-200 bg-gradient-to-br from-violet-50 to-white hover:border-violet-300",
    icon: "bg-violet-100 text-violet-700",
    value: "text-violet-800",
  },
} as const;

export type StatTone = keyof typeof STAT_TONES;

export function ColorStatLink({
  href,
  label,
  value,
  hint,
  tone = "sky",
  Icon,
}: {
  href: string;
  label: string;
  value: number;
  hint?: string;
  tone?: StatTone;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  const colors = STAT_TONES[tone];
  return (
    <Link
      href={href}
      className={cn(
        "group rounded-xl border p-3.5 shadow-[0_1px_2px_rgba(15,42,73,0.04)] transition duration-200 hover:-translate-y-px hover:shadow-sm",
        colors.card,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className={cn("mt-1 text-2xl font-extrabold tabular-nums tracking-tight", colors.value)}>
            {value}
          </p>
          {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
        </div>
        <span className={cn("flex size-9 items-center justify-center rounded-lg", colors.icon)}>
          <Icon className="size-4" aria-hidden={true} />
        </span>
      </div>
    </Link>
  );
}

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
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = (percent / 100) * circumference;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,42,73,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-bold text-navy-900">Task progress</h2>
        <Link href={href} className="text-xs font-semibold text-brand-700 hover:underline">
          Details
        </Link>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <svg viewBox="0 0 120 120" className="size-24 shrink-0" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#taskDonut)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform="rotate(-90 60 60)"
          />
          <defs>
            <linearGradient id="taskDonut" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22b8d8" />
              <stop offset="100%" stopColor="#1478d4" />
            </linearGradient>
          </defs>
          <text
            x="60"
            y="56"
            textAnchor="middle"
            className="fill-navy-900"
            style={{ fontSize: "22px", fontWeight: 800 }}
          >
            {percent}%
          </text>
          <text
            x="60"
            y="74"
            textAnchor="middle"
            className="fill-slate-500"
            style={{ fontSize: "9px", fontWeight: 700 }}
          >
            finished
          </text>
        </svg>
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

export function ActivityChartCard({
  points,
}: {
  points: Array<{ key: string; label: string; count: number }>;
}) {
  const width = 320;
  const height = 120;
  const max = Math.max(1, ...points.map((point) => point.count));
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - (point.count / max) * (height - 16) - 8;
    return { x, y, ...point };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,42,73,0.04)]">
      <h2 className="text-sm font-bold text-navy-900">Activity</h2>
      <p className="mt-0.5 text-xs text-slate-500">Task updates over the last 7 days</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-24 w-full" aria-hidden="true">
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22b8d8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#1478d4" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#activityFill)" />
        <polyline
          points={line}
          fill="none"
          stroke="#22b8d8"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((point) => (
          <circle key={point.key} cx={point.x} cy={point.y} r="3.5" fill="#1478d4" stroke="#ffffff" strokeWidth="2" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {points.map((point) => (
          <span key={point.key}>{point.label}</span>
        ))}
      </div>
    </section>
  );
}

export function ScheduleCard({
  title,
  href,
  empty,
  items,
}: {
  title: string;
  href: string;
  empty: string;
  items: Array<{
    id: string;
    href: string;
    title: string;
    when: string;
    tone?: "sky" | "violet" | "amber" | "emerald";
  }>;
}) {
  const tones = {
    sky: "bg-sky-100 text-sky-800",
    violet: "bg-violet-100 text-violet-800",
    amber: "bg-amber-100 text-amber-800",
    emerald: "bg-emerald-100 text-emerald-800",
  } as const;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,42,73,0.05)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-navy-900">{title}</h2>
        <Link href={href} className="text-xs font-semibold text-brand-700 hover:underline">
          See all
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
          {empty}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 hover:bg-brand-50"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    tones[item.tone ?? "sky"],
                  )}
                >
                  {item.title.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-navy-900">
                    {item.title}
                  </span>
                  <span className="block text-xs text-slate-500">{item.when}</span>
                </span>
                <span className="text-slate-300" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function calendarWeeks(monthStart: Date): string[][] {
  const parts = zonedParts(monthStart);
  const weekdayName = formatDate(monthStart, { weekday: "short" }).slice(0, 3);
  const startWeekday = Math.max(
    0,
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekdayName),
  );
  const daysInMonth = new Date(Date.UTC(parts.year, parts.month, 0)).getUTCDate();
  const cells: string[] = Array.from({ length: startWeekday }, () => "");
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(
      `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
  }
  while (cells.length % 7 !== 0) cells.push("");
  const weeks: string[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function weekdayShort(date: Date): string {
  return formatDate(date, { weekday: "short" }).slice(0, 3);
}
