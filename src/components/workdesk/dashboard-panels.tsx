import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { CountUp } from "@/components/workdesk/count-up";
import { StaffIllustration } from "@/components/workdesk/staff-illustration";
import type { DashboardPersona } from "@/generated/prisma/client";
import { zonedParts } from "@/lib/timezone";
import { cn, formatDate } from "@/lib/utils";

export function WorkdeskPageHeader({
  kicker,
  title,
  description,
  persona,
  accountHref,
  actions,
  className,
  meta,
}: {
  kicker?: string;
  title: string;
  description?: ReactNode;
  persona?: DashboardPersona | null;
  accountHref?: string;
  actions?: ReactNode;
  className?: string;
  meta?: ReactNode;
}) {
  const portrait =
    persona !== undefined ? (
      <span className="size-10 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
        <StaffIllustration persona={persona} size="thumb" />
      </span>
    ) : null;

  return (
    <header
      className={cn(
        "wc-enter mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {kicker}
            </p>
          ) : null}
          <h1 className="truncate text-xl font-bold tracking-tight text-navy-900">{title}</h1>
          {description ? (
            <p className="mt-0.5 max-w-2xl text-sm leading-snug text-slate-500">{description}</p>
          ) : null}
          {meta ? <div className="mt-1 text-sm font-medium text-navy-800">{meta}</div> : null}
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
  className,
  meta,
}: {
  hello: string;
  firstName: string;
  todayLabel: string;
  summary: ReactNode;
  persona: DashboardPersona | null;
  actions: ReactNode;
  accountHref?: string;
  className?: string;
  meta?: ReactNode;
}) {
  return (
    <WorkdeskPageHeader
      kicker={todayLabel}
      title={`${hello}, ${firstName}`}
      description={summary}
      persona={persona}
      accountHref={accountHref}
      actions={actions}
      className={className}
      meta={meta}
    />
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
  index = 0,
}: {
  href: string;
  label: string;
  value: number;
  hint?: string;
  tone?: StatTone;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  index?: number;
}) {
  const colors = STAT_TONES[tone];
  return (
    <Link
      href={href}
      style={{ animationDelay: `${index * 50}ms` }}
      className={cn(
        "wc-row group rounded-xl border p-3 shadow-[0_1px_2px_rgba(15,42,73,0.04)] transition duration-200 hover:-translate-y-px hover:shadow-sm",
        colors.card,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className={cn("mt-1 text-2xl font-extrabold tabular-nums tracking-tight", colors.value)}>
            <CountUp value={value} />
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
