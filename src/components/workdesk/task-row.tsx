import type { ReactNode } from "react";
import Link from "next/link";

import { PriorityBadge, TaskStatusBadge } from "@/components/workdesk/badges";
import { AssigneeAvatars } from "@/components/workdesk/work-item";
import { cn, formatDate } from "@/lib/utils";

const ROW =
  "md:grid md:grid-cols-[2.25rem_5.25rem_minmax(0,1fr)_8.5rem_5.75rem_6.5rem_6.25rem_2.25rem] md:items-center";

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
}) {
  const due = dueAt ? (
    <span className={cn("text-xs font-semibold", overdue ? "text-rose-700" : "text-slate-500")}>
      {overdue ? "Overdue " : ""}
      {formatDate(dueAt, { month: "short", day: "numeric" })}
    </span>
  ) : (
    <span className="text-xs text-slate-400">No date</span>
  );

  return (
    <li className="bg-white hover:bg-slate-50">
      <div className={cn("flex items-start gap-2 px-2 py-2 md:hidden")}>
        {leading}
        <Link href={href} className="min-w-0 flex-1">
          <span className="font-mono text-[11px] font-semibold text-slate-400">{reference}</span>
          <span className="block truncate text-sm font-semibold text-navy-900">{title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <TaskStatusBadge status={status} />
            <PriorityBadge priority={priority} />
            {due}
          </span>
        </Link>
        {actions}
      </div>
      <div className={cn("hidden min-h-[4.25rem] gap-2 px-2 md:grid", ROW)}>
        <div className="flex justify-center">{leading}</div>
        <Link href={href} className="font-mono text-[11px] font-semibold text-slate-400 hover:text-brand-700">
          {reference}
        </Link>
        <Link href={href} className="min-w-0 truncate text-sm font-semibold text-navy-900 hover:text-brand-700">
          {title}
        </Link>
        <AssigneeAvatars names={assignees} you={you} compact />
        <PriorityBadge priority={priority} />
        {due}
        <TaskStatusBadge status={status} />
        <div className="flex justify-end">{actions}</div>
      </div>
    </li>
  );
}

export function TaskTableHead({ leading }: { leading?: ReactNode }) {
  const label = "px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400";
  return (
    <div className={cn("hidden border-b border-slate-200 bg-slate-50 py-2 md:grid", ROW)} role="row">
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
