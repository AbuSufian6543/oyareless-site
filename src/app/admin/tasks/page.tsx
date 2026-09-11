import Link from "next/link";

import { Alert, PageHeader } from "@/components/admin/ui";
import { TaskQuickActions } from "@/components/workdesk/task-quick-actions";
import { ViewFilter } from "@/components/workdesk/view-filter";
import { WorkItem, WorkList } from "@/components/workdesk/work-item";
import { WorkLogSummary } from "@/components/workdesk/work-log";
import { requireAdminRole } from "@/lib/admin-guard";
import { hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  OPEN_TASK,
  taskAssignedTo,
  taskAssignedToOthers,
  taskUnassigned,
} from "@/lib/workdesk/board";
import { isOverdue, startOfToday, startOfTomorrow } from "@/lib/workdesk/dates";
import { WORK_LOG_LIST_INCLUDE, workLogTotals } from "@/lib/workdesk/work-log-query";

export const metadata = { title: "Tasks" };

const VIEWS = [
  "mine",
  "team",
  "unassigned",
  "overdue",
  "today",
  "upcoming",
  "completed",
  "closed",
  "all",
] as const;
type TaskView = (typeof VIEWS)[number];

const TASK_DONE = ["COMPLETED", "CLOSED"] as const;

function parseView(value: string | undefined): TaskView {
  return VIEWS.includes(value as TaskView) ? (value as TaskView) : "mine";
}

function emptyCopy(view: TaskView): string {
  switch (view) {
    case "mine":
      return "No open tasks are assigned to you.";
    case "team":
      return "No open tasks are assigned to other staff.";
    case "unassigned":
      return "Every open task has an assignee.";
    case "overdue":
      return "Nothing is overdue.";
    case "today":
      return "Nothing is due today.";
    case "upcoming":
      return "No upcoming due dates.";
    case "completed":
      return "No completed tasks yet.";
    case "closed":
      return "No closed tasks yet.";
    default:
      return "No open internal tasks yet.";
  }
}

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; notify?: string }>;
}) {
  const user = await requireAdminRole("EMPLOYEE");
  const params = await searchParams;
  const view = parseView(params.view);
  const today = startOfToday();
  const tomorrow = startOfTomorrow();
  const returnTo = view === "mine" ? "/admin/tasks" : `/admin/tasks?view=${view}`;

  const mineFilter = { ...OPEN_TASK, ...taskAssignedTo(user.id) };
  const teamFilter = { ...OPEN_TASK, ...taskAssignedToOthers(user.id) };
  const unassignedFilter = { ...OPEN_TASK, ...taskUnassigned() };
  const overdueFilter = { ...OPEN_TASK, dueAt: { lt: today } };
  const todayFilter = { ...OPEN_TASK, dueAt: { gte: today, lt: tomorrow } };
  const upcomingFilter = { ...OPEN_TASK, dueAt: { gte: tomorrow } };
  const completedFilter = { status: "COMPLETED" as const };
  const closedFilter = { status: "CLOSED" as const };

  const where =
    view === "mine"
      ? mineFilter
      : view === "team"
        ? teamFilter
        : view === "unassigned"
          ? unassignedFilter
          : view === "overdue"
            ? overdueFilter
            : view === "today"
              ? todayFilter
              : view === "upcoming"
                ? upcomingFilter
                : view === "completed"
                  ? completedFilter
                  : view === "closed"
                    ? closedFilter
                    : OPEN_TASK;

  const [
    tasks,
    mineCount,
    teamCount,
    unassignedCount,
    overdueCount,
    todayCount,
    upcomingCount,
    completedCount,
    closedCount,
    allCount,
  ] = await Promise.all([
    prisma.internalTask.findMany({
      where,
      orderBy:
        view === "completed" || view === "closed"
          ? [{ updatedAt: "desc" }]
          : [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        assignees: { include: { user: { select: { id: true, name: true } } } },
        ...WORK_LOG_LIST_INCLUDE,
      },
    }),
    prisma.internalTask.count({ where: mineFilter }),
    prisma.internalTask.count({ where: teamFilter }),
    prisma.internalTask.count({ where: unassignedFilter }),
    prisma.internalTask.count({ where: overdueFilter }),
    prisma.internalTask.count({ where: todayFilter }),
    prisma.internalTask.count({ where: upcomingFilter }),
    prisma.internalTask.count({ where: completedFilter }),
    prisma.internalTask.count({ where: closedFilter }),
    prisma.internalTask.count({ where: OPEN_TASK }),
  ]);

  const canManage = hasRole(user, "EMPLOYEE");

  return (
    <div>
      <PageHeader
        title="Internal tasks"
        description="Open a card to update status, reassign, or add a note. Assigned staff are emailed when you create or assign. Use Send reminder to ping them again. Completed and closed work can be deleted from those tabs."
        actions={
          <div className="flex flex-wrap gap-2">
            {canManage ? (
              <Link
                href="/admin/audit?action=task."
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50"
              >
                Audit log
              </Link>
            ) : null}
            <Link
              href="/admin/tasks/new"
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              New task
            </Link>
          </div>
        }
      />
      {params.notify === "none" ? (
        <div className="mb-4">
          <Alert tone="warning">Assign someone before sending a notification.</Alert>
        </div>
      ) : null}
      <ViewFilter
        items={[
          { href: "/admin/tasks", label: "Assigned to me", active: view === "mine", count: mineCount },
          { href: "/admin/tasks?view=team", label: "Assigned to others", active: view === "team", count: teamCount },
          { href: "/admin/tasks?view=unassigned", label: "Unassigned", active: view === "unassigned", count: unassignedCount },
          { href: "/admin/tasks?view=overdue", label: "Overdue", active: view === "overdue", count: overdueCount },
          { href: "/admin/tasks?view=today", label: "Today", active: view === "today", count: todayCount },
          { href: "/admin/tasks?view=upcoming", label: "Upcoming", active: view === "upcoming", count: upcomingCount },
          { href: "/admin/tasks?view=completed", label: "Completed", active: view === "completed", count: completedCount },
          { href: "/admin/tasks?view=closed", label: "Closed", active: view === "closed", count: closedCount },
          { href: "/admin/tasks?view=all", label: "All open", active: view === "all", count: allCount },
        ]}
      />
      <WorkList count={tasks.length} empty={emptyCopy(view)}>
        {tasks.map((task) => {
          const done = task.status === "COMPLETED" || task.status === "CLOSED";
          const log = workLogTotals(task);
          return (
            <WorkItem
              key={task.id}
              kind="task"
              href={`/admin/tasks/${task.id}`}
              reference={task.reference}
              title={task.title}
              status={task.status}
              priority={task.priority}
              dueAt={task.dueAt}
              updatedAt={task.updatedAt}
              overdue={isOverdue(task.dueAt, task.status, TASK_DONE)}
              assignees={task.assignees.map((row) => row.user.name)}
              you={user.name}
              meta={
                <WorkLogSummary hideEmpty minutes={log.minutes} productCount={log.productCount} />
              }
              actions={
                <TaskQuickActions
                  taskId={task.id}
                  reference={task.reference}
                  returnTo={returnTo}
                  canNotify={task.assignees.length > 0}
                  canDelete={canManage && done}
                />
              }
            />
          );
        })}
      </WorkList>
    </div>
  );
}
