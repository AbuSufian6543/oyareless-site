"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PriorityBadge, TaskStatusBadge, TicketStatusBadge } from "@/components/workdesk/badges";
import { AssigneeAvatars } from "@/components/workdesk/work-item";
import { cn, formatDate } from "@/lib/utils";

const TABLE =
  "xl:grid xl:grid-cols-[2.25rem_4.75rem_minmax(0,1fr)_minmax(0,7.5rem)_4.75rem_5.25rem_5.5rem_2.25rem] xl:items-center";

function DueLabel({ dueAt, overdue }: { dueAt?: Date | null; overdue?: boolean }) {
  if (!dueAt) return <span className="text-xs text-slate-400">No date</span>;
  return (
    <span className={cn("whitespace-nowrap text-xs font-semibold", overdue ? "text-rose-700" : "text-slate-500")}>
      {overdue ? "Overdue " : ""}
      {formatDate(dueAt, { month: "short", day: "numeric" })}
    </span>
  );
}

export function TaskRow({
  href,
  reference,
  title,
  status,
  priority,
  dueAt,
  overdue,
  assignees,
  you,
  leading,
  actions,
  variant = "embed",
  index = 0,
}: {
  href: string;
  reference: string;
  title: string;
  status: string;
  priority: string;
  dueAt?: Date | null;
  overdue?: boolean;
  assignees: string[];
  you?: string;
  leading?: ReactNode;
  actions?: ReactNode;
  variant?: "table" | "embed";
  index?: number;
}) {
  const delay = `${Math.min(index, 14) * 28}ms`;
  const due = <DueLabel dueAt={dueAt} overdue={overdue} />;
  const router = useRouter();
  function openRow(event: MouseEvent<HTMLLIElement>) {
    const target = event.target as HTMLElement | null;
    if (!target || target.closest("a, button, input, label, textarea, select, summary, details")) return;
    router.push(href);
  }

  if (variant === "embed") {
    return (
      <li onClick={openRow} className="wc-row wc-task min-w-0 cursor-pointer bg-white transition-colors duration-150 hover:bg-slate-50" style={{ animationDelay: delay }}>
        <div className="flex min-w-0 items-center gap-2 px-3 py-2">
          {leading}
          <Link href={href} className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-400">{reference}</span>
              <span className="truncate text-sm font-semibold text-navy-900">{title}</span>
            </span>
            <span className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
              <AssigneeAvatars names={assignees} you={you} compact hideNames />
              <PriorityBadge priority={priority} />
              {due}
              <TaskStatusBadge status={status} />
            </span>
          </Link>
          {actions}
        </div>
      </li>
    );
  }

  return (
    <li onClick={openRow} className="wc-row wc-task min-w-0 cursor-pointer bg-white transition-colors duration-150 hover:bg-slate-50" style={{ animationDelay: delay }}>
      <div className="flex min-w-0 items-start gap-2 px-2 py-2 xl:hidden">
        {leading}
        <Link href={href} className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <span className="font-mono text-[11px] font-semibold text-slate-400">{reference}</span>
          <span className="block truncate text-sm font-semibold text-navy-900">{title}</span>
          <span className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
            <AssigneeAvatars names={assignees} you={you} compact hideNames />
            <PriorityBadge priority={priority} />
            {due}
            <TaskStatusBadge status={status} />
          </span>
        </Link>
        {actions}
      </div>
      <div className={cn("hidden min-h-[4.25rem] min-w-0 gap-2 px-2 xl:grid", TABLE)}>
        <div className="flex justify-center">{leading}</div>
        <Link href={href} className="truncate font-mono text-[11px] font-semibold text-slate-400 hover:text-brand-700">
          {reference}
        </Link>
        <Link href={href} className="min-w-0 truncate text-sm font-semibold text-navy-900 hover:text-brand-700">
          {title}
        </Link>
        <div className="min-w-0">
          <AssigneeAvatars names={assignees} you={you} compact />
        </div>
        <PriorityBadge priority={priority} />
        {due}
        <TaskStatusBadge status={status} />
        <div className="flex justify-end">{actions}</div>
      </div>
    </li>
  );
}

export function TaskTableHead({ leading }: { leading?: ReactNode }) {
  const label = "min-w-0 truncate px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400";
  return (
    <div className={cn("hidden border-b border-slate-200 bg-slate-50 py-2 xl:grid", TABLE)} role="row">
      <div className="flex justify-center">{leading}</div>
      <span className={label}>ID</span>
      <span className={label}>Task</span>
      <span className={label}>Assignees</span>
      <span className={label}>Priority</span>
      <span className={label}>Due</span>
      <span className={label}>Status</span>
      <span className="sr-only">Actions</span>
    </div>
  );
}

export function TicketRow({
  href,
  reference,
  title,
  status,
  priority,
  subtitle,
  assignees = [],
  you,
  index = 0,
}: {
  href: string;
  reference: string;
  title: string;
  status: string;
  priority: string;
  subtitle?: string;
  assignees?: string[];
  you?: string;
  index?: number;
}) {
  return (
    <li className="wc-row min-w-0 bg-white hover:bg-slate-50" style={{ animationDelay: `${Math.min(index, 14) * 28}ms` }}>
      <Link
        href={href}
        className="flex min-w-0 items-center gap-2 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        <span className="w-16 shrink-0 font-mono text-[11px] font-semibold text-slate-400">{reference}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-navy-900">{title}</span>
          <span className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5">
            {subtitle ? <span className="max-w-full truncate text-xs text-slate-500">{subtitle}</span> : null}
            <AssigneeAvatars names={assignees} you={you} compact hideNames />
            <PriorityBadge priority={priority} />
            <TicketStatusBadge status={status} />
          </span>
        </span>
      </Link>
    </li>
  );
}
