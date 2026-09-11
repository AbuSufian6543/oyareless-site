import { PageHeader } from "@/components/admin/ui";
import { ViewFilter } from "@/components/workdesk/view-filter";
import { WorkItem, WorkList } from "@/components/workdesk/work-item";
import { WorkLogSummary } from "@/components/workdesk/work-log";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@/generated/prisma/client";
import { technicianOrRedirect, technicianTaskWhere } from "@/lib/workdesk/access";
import { isOverdue, startOfToday } from "@/lib/workdesk/dates";
import { WORK_LOG_LIST_INCLUDE, workLogTotals } from "@/lib/workdesk/work-log-query";

export const metadata = { title: "My tasks" };

const TASK_DONE = ["COMPLETED", "CLOSED"] as const;

export default async function TechTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await technicianOrRedirect();
  const params = await searchParams;
  const view =
    params.view === "done" || params.view === "all" || params.view === "overdue"
      ? params.view
      : "open";
  const base = technicianTaskWhere(user.id);
  const today = startOfToday();
  const doneStatuses: TaskStatus[] = ["COMPLETED", "CLOSED"];
  const where =
    view === "done"
      ? { ...base, status: { in: doneStatuses } }
      : view === "all"
        ? base
        : view === "overdue"
          ? { ...base, status: { notIn: doneStatuses }, dueAt: { lt: today } }
          : { ...base, status: { notIn: doneStatuses } };

  const [tasks, openCount, doneCount, overdueCount] = await Promise.all([
    prisma.internalTask.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      include: {
        assignees: { include: { user: { select: { name: true } } } },
        ...WORK_LOG_LIST_INCLUDE,
      },
    }),
    prisma.internalTask.count({
      where: { ...base, status: { notIn: ["COMPLETED", "CLOSED"] } },
    }),
    prisma.internalTask.count({
      where: { ...base, status: { in: ["COMPLETED", "CLOSED"] } },
    }),
    prisma.internalTask.count({
      where: { ...base, status: { notIn: ["COMPLETED", "CLOSED"] }, dueAt: { lt: today } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Assigned tasks"
        description={`${openCount} open · ${overdueCount} overdue · ${doneCount} completed`}
      />
      <ViewFilter
        items={[
          { href: "/tech/tasks", label: "Open", active: view === "open", count: openCount },
          { href: "/tech/tasks?view=overdue", label: "Overdue", active: view === "overdue", count: overdueCount },
          { href: "/tech/tasks?view=done", label: "Completed", active: view === "done", count: doneCount },
          { href: "/tech/tasks?view=all", label: "All", active: view === "all" },
        ]}
      />
      <WorkList
        count={tasks.length}
        empty={
          view === "done"
            ? "No completed tasks yet."
            : view === "overdue"
              ? "Nothing overdue. Nice work."
              : "Nothing assigned in this view."
        }
      >
        {tasks.map((task) => {
          const log = workLogTotals(task);
          return (
          <WorkItem
            key={task.id}
            kind="task"
            href={`/tech/tasks/${task.id}`}
            reference={task.reference}
            title={task.title}
            status={task.status}
            priority={task.priority}
            dueAt={task.dueAt}
            overdue={isOverdue(task.dueAt, task.status, TASK_DONE)}
            assignees={task.assignees.map((row) => row.user.name)}
            you={user.name}
            meta={
              <WorkLogSummary hideEmpty minutes={log.minutes} productCount={log.productCount} />
            }
          />
          );
        })}
      </WorkList>
    </div>
  );
}
