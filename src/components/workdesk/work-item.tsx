import type { ComponentType, ReactNode } from "react";
import Link from "next/link";

import { PriorityBadge, TaskStatusBadge, TicketStatusBadge } from "@/components/workdesk/badges";
import { cn, formatDate, formatDateTime } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function cardAccent(kind: "ticket" | "task", priority: string, overdue?: boolean): string {
  if (overdue) return "border-l-amber-500";
  if (priority === "EMERGENCY") return "border-l-red-500";
  if (priority === "HIGH") return "border-l-orange-400";
  return kind === "ticket" ? "border-l-brand-500" : "border-l-navy-700";
}

export function AssigneeAvatars({
  names,
  you,
}: {
  names: string[];
  you?: string;
}) {
  if (names.length === 0) {
    return <span className="text-xs font-medium text-slate-400">Unassigned</span>;
  }

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span className="flex -space-x-1.5">
        {names.slice(0, 4).map((name) => (
          <span
            key={name}
            title={name}
            className={cn(
              "flex size-6 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold shadow-sm",
              you && name === you
                ? "bg-brand-600 text-white"
                : "bg-navy-100 text-navy-800",
            )}
          >
            {initials(name)}
          </span>
        ))}
      </span>
      <span className="truncate text-xs text-slate-600">
        {names.join(", ")}
        {you && names.includes(you) ? " · you" : ""}
      </span>
    </span>
  );
}

export function WorkItem({
  href,
  kind,
  reference,
  title,
  status,
  priority,
  overdue,
  dueAt,
  updatedAt,
  subtitle,
  assignees,
  you,
  meta,
  actions,
}: {
  href: string;
  kind: "ticket" | "task";
  reference: string;
  title: string;
  status: string;
  priority: string;
  overdue?: boolean;
  dueAt?: Date | null;
  updatedAt?: Date | null;
  subtitle?: string;
  assignees?: string[];
  you?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  const accent = cardAccent(kind, priority, overdue);
  const body = (
    <>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wide text-brand-800">
          {reference}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {kind === "ticket" ? "Ticket" : "Task"}
        </span>
      </p>
      <p className="mt-1.5 text-[0.95rem] font-semibold leading-snug text-navy-900">{title}</p>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {kind === "ticket" ? (
          <TicketStatusBadge status={status} />
        ) : (
          <TaskStatusBadge status={status} />
        )}
        <PriorityBadge priority={priority} />
        {meta}
        {subtitle ? <span className="text-slate-600">{subtitle}</span> : null}
        {dueAt ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-semibold",
              overdue ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600",
            )}
          >
            {overdue ? "Overdue " : "Due "}
            {formatDate(dueAt)}
          </span>
        ) : null}
        {updatedAt ? <span>Updated {formatDateTime(updatedAt)}</span> : null}
      </p>
      {assignees ? (
        <p className="mt-2.5">
          <AssigneeAvatars names={assignees} you={you} />
        </p>
      ) : null}
    </>
  );

  const shell = cn(
    "border-l-[3px] bg-white shadow-[0_1px_2px_rgba(15,42,73,0.05)] transition duration-200",
    accent,
    overdue ? "border-amber-200" : "border-slate-200",
  );

  if (actions) {
    return (
      <li
        className={cn(
          "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start sm:justify-between",
          shell,
        )}
      >
        <Link href={href} className="min-w-0 flex-1 rounded-xl px-1 py-0.5 hover:bg-slate-50/80">
          {body}
        </Link>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "block rounded-2xl border px-4 py-3.5 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md",
          shell,
        )}
      >
        {body}
      </Link>
    </li>
  );
}

export function WorkList({
  children,
  empty,
  count,
}: {
  children: ReactNode;
  empty: string;
  count: number;
}) {
  if (count === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-10 text-center text-sm text-slate-500">
        {empty}
      </p>
    );
  }

  return <ul className="space-y-2.5">{children}</ul>;
}

export function WorkSection({
  title,
  href,
  countLabel,
  children,
  className,
}: {
  title: string;
  href?: string;
  countLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-slate-200/90 bg-slate-50/40 p-4 sm:p-5", className)}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight text-navy-900">{title}</h2>
        {href && countLabel ? (
          <Link href={href} className="shrink-0 text-sm font-semibold text-brand-700 hover:underline">
            {countLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function WorkStatLink({
  href,
  label,
  value,
  hint,
  alert,
  Icon,
}: {
  href: string;
  label: string;
  value: number;
  hint?: string;
  alert?: boolean;
  Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,42,73,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        alert ? "border-amber-300 bg-amber-50/40" : "border-slate-200 hover:border-brand-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-navy-900">{value}</p>
          {hint ? (
            <p className={cn("mt-1 text-xs", alert ? "font-semibold text-amber-800" : "text-slate-500")}>
              {hint}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-xl transition-colors",
            alert
              ? "bg-amber-100 text-amber-800"
              : "bg-brand-50 text-brand-600 group-hover:bg-brand-100",
          )}
        >
          <Icon className="size-5" aria-hidden={true} />
        </span>
      </div>
    </Link>
  );
}
