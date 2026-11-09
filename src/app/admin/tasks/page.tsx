import Link from "next/link";
import { Plus } from "lucide-react";

import { bulkSetTaskStatusAction } from "@/app/workdesk/status-actions";
import { Alert } from "@/components/admin/ui";
import { WorkdeskPageHeader } from "@/components/workdesk/dashboard-panels";
import { TaskQuickActions } from "@/components/workdesk/task-quick-actions";
import { ViewFilter } from "@/components/workdesk/view-filter";
import { WorkItem } from "@/components/workdesk/work-item";
import { WorkLogSummary } from "@/components/workdesk/work-log";
import { WorkSelectBox, WorkSelection } from "@/components/workdesk/work-selection";
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
import { taskBulkChoices } from "@/lib/workdesk/labels";
import { cleanWorkQuery, taskSearchWhere } from "@/lib/workdesk/list-search";
import { WORK_LOG_LIST_INCLUDE, workLogTotals } from "@/lib/workdesk/work-log-query";
import { WorkSearch } from "@/components/workdesk/work-search";

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
  searchParams: Promise<{ view?: string; notify?: string; q?: string }>;
}) {
  const user = await requireAdminRole("EMPLOYEE");
  const params = await searchParams;
  const view = parseView(params.view);
  const query = cleanWorkQuery(params.q);
  const searchWhere = taskSearchWhere(query);
  const today = startOfToday();
  const tomorrow = startOfTomorrow();
  const listParams = new URLSearchParams();
  if (view !== "mine") listParams.set("view", view);
  if (query) listParams.set("q", query);
  const listQuery = listParams.toString();
  const returnTo = listQuery ? `/admin/tasks?${listQuery}` : "/admin/tasks";

  const mineFilter = { ...OPEN_TASK, ...taskAssignedTo(user.id) };
  const teamFilter = { ...OPEN_TASK, ...taskAssignedToOthers(user.id) };
  const unassignedFilter = { ...OPEN_TASK, ...taskUnassigned() };
  const overdueFilter = { ...OPEN_TASK, dueAt: { lt: today } };
  const todayFilter = { ...OPEN_TASK, dueAt: { gte: today, lt: tomorrow } };
  const upcomingFilter = { ...OPEN_TASK, dueAt: { gte: tomorrow } };
  const completedFilter = { status: "COMPLETED" as const };
  const closedFilter = { status: "CLOSED" as const };

  const viewWhere =
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
  const where = searchWhere ?? viewWhere;

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
      orderBy: searchWhere
        ? [{ updatedAt: "desc" }]
        : view === "completed" || view === "closed"
          ? [{ updatedAt: "desc" }]
          : [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      take: searchWhere ? 40 : 200,
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
      <WorkdeskPageHeader
        kicker="Workdesk"
        title="Tasks"
        description={`${mineCount} assigned to you · ${todayCount} due today · ${overdueCount} overdue`}
        actions={
          <>
            <Link
              href="/admin"
              className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-800 hover:border-brand-300 hover:bg-brand-50"
            >
              Calendar
            </Link>
            {canManage ? (
              <Link
                href="/admin/audit?action=task."
                className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-800 hover:border-brand-300 hover:bg-brand-50"
              >
                Audit log
              </Link>
            ) : null}
            <Link
              href="/admin/tasks/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="size-4" aria-hidden="true" />
              New task
            </Link>
          </>
        }
      />
      {params.notify === "none" ? (
        <div className="mb-4">
          <Alert tone="warning">Assign someone before sending a notification.</Alert>
        </div>
      ) : null}
      <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,42,73,0.05)]">
        <div className="px-3 pt-3">
          <WorkSearch action="/admin/tasks" query={query} kind="task" className="mb-3" />
        </div>
        <ViewFilter
          groups={[
            {
              label: "People",
              items: [
                { href: "/admin/tasks", label: "Assigned to me", active: !query && view === "mine", count: mineCount },
                { href: "/admin/tasks?view=team", label: "Assigned to others", active: !query && view === "team", count: teamCount },
                { href: "/admin/tasks?view=unassigned", label: "Unassigned", active: !query && view === "unassigned", count: unassignedCount },
                { href: "/admin/tasks?view=all", label: "All open", active: !query && view === "all", count: allCount },
              ],
            },
            {
              label: "Due",
              items: [
                { href: "/admin/tasks?view=overdue", label: "Overdue", active: !query && view === "overdue", count: overdueCount, tone: "danger" },
                { href: "/admin/tasks?view=today", label: "Today", active: !query && view === "today", count: todayCount },
                { href: "/admin/tasks?view=upcoming", label: "Upcoming", active: !query && view === "upcoming", count: upcomingCount },
              ],
            },
            {
              label: "Finished",
              items: [
                { href: "/admin/tasks?view=completed", label: "Completed", active: !query && view === "completed", count: completedCount, tone: "success" },
                { href: "/admin/tasks?view=closed", label: "Closed", active: !query && view === "closed", count: closedCount },
              ],
            },
          ]}
        />
      </section>
      <WorkSelection
        ids={tasks.map((task) => task.id)}
        action={bulkSetTaskStatusAction}
        statuses={taskBulkChoices(user.role)}
        returnTo={returnTo}
        noun="task"
        summary={query ? `${tasks.length} matching this search` : `${tasks.length} in this view`}
        empty={query ? `No tasks match “${query}”.` : emptyCopy(view)}
      >
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
              leading={<WorkSelectBox id={task.id} label={`Select ${task.reference}`} />}
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
      </WorkSelection>
    </div>
  );
}
