import Link from "next/link";

import { PageHeader } from "@/components/admin/ui";
import { PriorityBadge, TaskStatusBadge } from "@/components/workdesk/badges";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@/generated/prisma/client";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { technicianOrRedirect, technicianTaskWhere } from "@/lib/workdesk/access";

export const metadata = { title: "My tasks" };

const VIEWS = [
  { id: "open", label: "Open", href: "/tech/tasks" },
  { id: "done", label: "Completed", href: "/tech/tasks?view=done" },
  { id: "all", label: "All", href: "/tech/tasks?view=all" },
] as const;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function TechTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await technicianOrRedirect();
  const params = await searchParams;
  const view = params.view === "done" || params.view === "all" ? params.view : "open";
  const base = technicianTaskWhere(user.id);
  const doneStatuses: TaskStatus[] = ["COMPLETED", "CLOSED"];
  const where =
    view === "done"
      ? { ...base, status: { in: doneStatuses } }
      : view === "all"
        ? base
        : { ...base, status: { notIn: doneStatuses } };

  const [tasks, openCount, doneCount] = await Promise.all([
    prisma.internalTask.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.internalTask.count({
      where: { ...base, status: { notIn: ["COMPLETED", "CLOSED"] } },
    }),
    prisma.internalTask.count({
      where: { ...base, status: { in: ["COMPLETED", "CLOSED"] } },
    }),
  ]);
  const today = startOfToday();

  return (
    <div>
      <PageHeader
        title="Assigned tasks"
        description={`${openCount} open · ${doneCount} completed`}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {VIEWS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-semibold",
              view === item.id
                ? "bg-navy-900 text-white"
                : "border border-slate-200 bg-white text-navy-800 hover:border-brand-300",
            )}
          >
            {item.label}
            {item.id === "open" ? ` (${openCount})` : item.id === "done" ? ` (${doneCount})` : ""}
          </Link>
        ))}
      </div>
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {tasks.map((task) => {
          const overdue =
            Boolean(task.dueAt && task.dueAt < today) &&
            task.status !== "COMPLETED" &&
            task.status !== "CLOSED";
          return (
            <li key={task.id} className="px-4 py-3">
              <Link href={`/tech/tasks/${task.id}`} className="font-semibold text-navy-900 hover:text-brand-700">
                {task.reference} — {task.title}
              </Link>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <TaskStatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {task.dueAt ? (
                  <span className={overdue ? "font-semibold text-amber-700" : undefined}>
                    {overdue ? "Overdue " : "Due "}
                    {formatDate(task.dueAt)}
                  </span>
                ) : null}
                <span>{formatDateTime(task.updatedAt)}</span>
              </p>
            </li>
          );
        })}
        {tasks.length === 0 && (
          <li className="px-4 py-8 text-sm text-slate-500">
            {view === "done" ? "No completed tasks yet." : "Nothing assigned in this view."}
          </li>
        )}
      </ul>
    </div>
  );
}
