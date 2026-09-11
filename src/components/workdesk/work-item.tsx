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
              "flex size-6 items-center justify-center rounded-full border border-white text-[10px] font-bold",
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
  const body = (
    <>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="font-mono text-xs font-semibold text-brand-700">{reference}</span>
        <span className="font-semibold text-navy-900">{title}</span>
      </p>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {kind === "ticket" ? (
          <TicketStatusBadge status={status} />
        ) : (
          <TaskStatusBadge status={status} />
        )}
        <PriorityBadge priority={priority} />
        {meta}
        {subtitle ? <span>{subtitle}</span> : null}
        {dueAt ? (
          <span className={overdue ? "font-semibold text-amber-700" : undefined}>
            {overdue ? "Overdue " : "Due "}
            {formatDate(dueAt)}
          </span>
        ) : null}
        {updatedAt ? <span>Updated {formatDateTime(updatedAt)}</span> : null}
      </p>
      {assignees ? (
        <p className="mt-2">
          <AssigneeAvatars names={assignees} you={you} />
        </p>
      ) : null}
    </>
  );

  if (actions) {
    return (
      <li
        className={cn(
          "flex flex-col gap-3 rounded-xl border bg-white p-4 sm:flex-row sm:items-start sm:justify-between",
          overdue ? "border-amber-300" : "border-slate-200",
        )}
      >
        <Link href={href} className="min-w-0 flex-1 rounded-lg hover:bg-brand-50/40">
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
          "block rounded-xl border bg-white px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40",
          overdue ? "border-amber-300" : "border-slate-200",
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
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {empty}
      </p>
    );
  }

  return <ul className="space-y-2">{children}</ul>;
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
        "rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        alert ? "border-amber-300" : "border-slate-200 hover:border-brand-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-navy-900">{value}</p>
          {hint ? (
            <p className={cn("mt-1 text-xs", alert ? "font-semibold text-amber-700" : "text-slate-500")}>
              {hint}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            alert ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-600",
          )}
        >
          <Icon className="size-5" aria-hidden={true} />
        </span>
      </div>
    </Link>
  );
}
