import Link from "next/link";
import { Plus } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";

import { bulkSetTaskStatusAction } from "@/app/workdesk/status-actions";
import { Alert } from "@/components/admin/ui";
import { WorkdeskPageHeader } from "@/components/workdesk/dashboard-panels";
import { ListScroll } from "@/components/workdesk/list-scroll";
import { SortSelect } from "@/components/workdesk/sort-select";
import { TaskQuickActions } from "@/components/workdesk/task-quick-actions";
import { TaskRow, TaskTableHead } from "@/components/workdesk/task-row";
import { WorkSearch } from "@/components/workdesk/work-search";
import { WorkSelectAll, WorkSelectBox, WorkSelection } from "@/components/workdesk/work-selection";
import { requireAdminRole } from "@/lib/admin-guard";
import { hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  OPEN_TASK,
  taskAssignedTo,
  taskAssignedToOthers,
  taskUnassigned,
} from "@/lib/workdesk/board";
import { isOverdue, startOfToday, startOfTomorrow } from "@/lib/workdesk/dates";
import { taskBulkChoices } from "@/lib/workdesk/labels";
import { cleanWorkQuery, taskSearchWhere } from "@/lib/workdesk/list-search";

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
type DueView = "overdue" | "today" | "upcoming";
type SortKey = "due" | "priority" | "updated" | "created" | "id";

const PEOPLE = ["mine", "team", "unassigned", "all"] as const;
const DUES: DueView[] = ["overdue", "today", "upcoming"];
const SORTS: SortKey[] = ["due", "priority", "updated", "created", "id"];

function parseView(value: string | undefined): TaskView {
  return VIEWS.includes(value as TaskView) ? (value as TaskView) : "mine";
}

function parseDue(value: string | undefined): DueView | undefined {
  return DUES.includes(value as DueView) ? (value as DueView) : undefined;
}

function parseSort(value: string | undefined): SortKey | undefined {
  return SORTS.includes(value as SortKey) ? (value as SortKey) : undefined;
}

function emptyCopy(view: TaskView, due?: DueView): string {
  if (due === "overdue") return "Nothing in this list is overdue.";
  if (due === "today") return "Nothing in this list is due today.";
  if (due === "upcoming") return "Nothing in this list is upcoming.";
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
  searchParams: Promise<{ view?: string; notify?: string; q?: string; due?: string; sort?: string }>;
}) {
  const user = await requireAdminRole("EMPLOYEE");
  const params = await searchParams;
  const view = parseView(params.view);
  const query = cleanWorkQuery(params.q);
  const due = parseDue(params.due);
  const sort = parseSort(params.sort);
  const searchWhere = taskSearchWhere(query);
  const today = startOfToday();
  const tomorrow = startOfTomorrow();
  const finished = view === "completed" || view === "closed";
  const peopleView = (PEOPLE as readonly string[]).includes(view);
  const activeDue: DueView | undefined = finished
    ? undefined
    : due && peopleView
      ? due
      : view === "overdue" || view === "today" || view === "upcoming"
        ? view
        : undefined;
  const activePeople = peopleView ? view : finished ? null : null;

  function hrefFor(nextView: TaskView, nextDue?: DueView | null, nextSort?: SortKey | null) {
    const search = new URLSearchParams();
    const nextFinished = nextView === "completed" || nextView === "closed";
    if (nextView !== "mine") search.set("view", nextView);
    if (!nextFinished && nextDue) search.set("due", nextDue);
    const sortValue = nextSort === undefined ? sort : nextSort;
    if (sortValue) search.set("sort", sortValue);
    const qs = search.toString();
    return qs ? `/admin/tasks?${qs}` : "/admin/tasks";
  }

  const mineFilter = { ...OPEN_TASK, ...taskAssignedTo(user.id) };
  const teamFilter = { ...OPEN_TASK, ...taskAssignedToOthers(user.id) };
  const unassignedFilter = { ...OPEN_TASK, ...taskUnassigned() };
  const overdueFilter = { ...OPEN_TASK, dueAt: { lt: today } };
  const todayFilter = { ...OPEN_TASK, dueAt: { gte: today, lt: tomorrow } };
  const upcomingFilter = { ...OPEN_TASK, dueAt: { gte: tomorrow } };
  const completedFilter = { status: "COMPLETED" as const };
  const closedFilter = { status: "CLOSED" as const };

  function peopleWhere(who: (typeof PEOPLE)[number]): Prisma.InternalTaskWhereInput {
    if (who === "team") return teamFilter;
    if (who === "unassigned") return unassignedFilter;
    if (who === "all") return OPEN_TASK;
    return mineFilter;
  }

  function dueWhere(value: DueView): Prisma.InternalTaskWhereInput {
    if (value === "overdue") return { dueAt: { lt: today } };
    if (value === "today") return { dueAt: { gte: today, lt: tomorrow } };
    return { dueAt: { gte: tomorrow } };
  }

  const viewWhere: Prisma.InternalTaskWhereInput =
    view === "completed"
      ? completedFilter
      : view === "closed"
        ? closedFilter
        : due && peopleView
          ? { AND: [peopleWhere(view as (typeof PEOPLE)[number]), dueWhere(due)] }
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
                    : view === "all"
                      ? OPEN_TASK
                      : mineFilter;

  const where = searchWhere ?? viewWhere;
  const orderBy: Prisma.InternalTaskOrderByWithRelationInput[] =
    sort === "priority"
      ? [{ priority: "desc" }, { dueAt: "asc" }]
      : sort === "updated"
        ? [{ updatedAt: "desc" }]
        : sort === "created"
          ? [{ createdAt: "desc" }]
          : sort === "id"
            ? [{ reference: "desc" }]
            : sort === "due"
              ? [{ dueAt: "asc" }, { createdAt: "desc" }]
              : searchWhere || finished
                ? [{ updatedAt: "desc" }]
                : [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }];

  const listParams = new URLSearchParams();
  if (view !== "mine") listParams.set("view", view);
  if (due && peopleView && !finished) listParams.set("due", due);
  if (sort) listParams.set("sort", sort);
  if (query) listParams.set("q", query);
  const listQuery = listParams.toString();
  const returnTo = listQuery ? `/admin/tasks?${listQuery}` : "/admin/tasks";

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
      orderBy,
      take: searchWhere ? 40 : 200,
      include: {
        assignees: { include: { user: { select: { id: true, name: true } } } },
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
  const ids = tasks.map((task) => task.id);
  const keptDue = due && peopleView ? due : null;
  const sortOptions = [
    { value: "default", label: "Default", href: hrefFor(view, keptDue, null) },
    { value: "due", label: "Due date", href: hrefFor(view, keptDue, "due") },
    { value: "priority", label: "Priority", href: hrefFor(view, keptDue, "priority") },
    { value: "updated", label: "Recently updated", href: hrefFor(view, keptDue, "updated") },
    { value: "created", label: "Created date", href: hrefFor(view, keptDue, "created") },
    { value: "id", label: "Task ID", href: hrefFor(view, keptDue, "id") },
  ];

  const peopleChips = [
    { view: "all" as const, label: "All open", count: allCount },
    { view: "mine" as const, label: "Assigned to me", count: mineCount },
    { view: "team" as const, label: "Assigned to others", count: teamCount },
    { view: "unassigned" as const, label: "Unassigned", count: unassignedCount },
  ];
  const dueChips = [
    { due: "overdue" as const, label: "Overdue", count: overdueCount, tone: "text-rose-600" },
    { due: "today" as const, label: "Today", count: todayCount, tone: "text-slate-500" },
    { due: "upcoming" as const, label: "Upcoming", count: upcomingCount, tone: "text-slate-500" },
  ];
  const doneChips = [
    { view: "completed" as const, label: "Completed", count: completedCount, href: "/admin/tasks?view=completed" },
    { view: "closed" as const, label: "Closed", count: closedCount, href: "/admin/tasks?view=closed" },
  ];

  return (
    <div>
      <ListScroll storageKey={`tasks:${returnTo}`} />
      <WorkdeskPageHeader
        className="mb-3"
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
        <div className="mb-3">
          <Alert tone="warning">Assign someone before sending a notification.</Alert>
        </div>
      ) : null}
      <section className="mb-3 rounded-xl border border-slate-200 bg-white p-2">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <WorkSearch action="/admin/tasks" query={query} kind="task" compact className="mb-0 min-w-0 xl:w-80" />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto px-0.5 pb-1" aria-label="Filter tasks">
              {peopleChips.map((item) => (
                <FilterLink
                  key={item.view}
                  href={hrefFor(item.view, finished ? null : (activeDue ?? null))}
                  active={!query && activePeople === item.view}
                  label={item.label}
                  count={item.count}
                />
              ))}
              <span className="mx-1 w-px shrink-0 self-stretch bg-slate-200" aria-hidden="true" />
              {dueChips.map((item) => {
                const on = !query && activeDue === item.due;
                const nextPeople: TaskView = peopleView ? view : "all";
                const href = on ? hrefFor(nextPeople, null) : hrefFor(nextPeople, item.due);
                return (
                  <FilterLink
                    key={item.due}
                    href={href}
                    active={on}
                    label={item.label}
                    count={item.count}
                    countClass={on ? undefined : item.tone}
                  />
                );
              })}
              <span className="mx-1 w-px shrink-0 self-stretch bg-slate-200" aria-hidden="true" />
              {doneChips.map((item) => (
                <FilterLink
                  key={item.view}
                  href={sort ? hrefFor(item.view, null) : item.href}
                  active={!query && view === item.view}
                  label={item.label}
                  count={item.count}
                />
              ))}
            </nav>
            <SortSelect value={sort ?? "default"} options={sortOptions} />
          </div>
        </div>
        {activeDue && peopleView ? (
          <p className="px-1 pt-2 text-xs text-slate-500">
            Showing {activeDue} tasks inside {peopleChips.find((item) => item.view === view)?.label.toLowerCase()}.
          </p>
        ) : null}
      </section>
      <WorkSelection
        ids={ids}
        action={bulkSetTaskStatusAction}
        statuses={taskBulkChoices(user.role)}
        returnTo={returnTo}
        noun="task"
        summary={query ? `${tasks.length} matching this search` : `${tasks.length} in this view`}
        empty={query ? `No tasks match “${query}”.` : emptyCopy(view, due && peopleView ? due : undefined)}
        reveal="selected"
        list={false}
      >
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 md:hidden">
            <WorkSelectAll ids={ids} />
            <span className="text-xs font-semibold text-slate-500">Mark all</span>
          </div>
          <TaskTableHead leading={<WorkSelectAll ids={ids} />} />
          <ul className="divide-y divide-slate-100">
            {tasks.map((task, index) => {
              const done = task.status === "COMPLETED" || task.status === "CLOSED";
              return (
                <TaskRow
                  key={task.id}
                  variant="table"
                  index={index}
                  href={`/admin/tasks/${task.id}?from=${encodeURIComponent(returnTo)}`}
                  reference={task.reference}
                  title={task.title}
                  status={task.status}
                  priority={task.priority}
                  dueAt={task.dueAt}
                  overdue={isOverdue(task.dueAt, task.status, ["COMPLETED", "CLOSED"])}
                  assignees={task.assignees.map((row) => row.user.name)}
                  you={user.name}
                  leading={<WorkSelectBox id={task.id} label={`Select ${task.reference}`} />}
                  actions={
                    <TaskQuickActions
                      taskId={task.id}
                      reference={task.reference}
                      returnTo={returnTo}
                      canNotify={task.assignees.length > 0}
                      canDelete={canManage && done}
                      menu
                    />
                  }
                />
              );
            })}
          </ul>
        </div>
      </WorkSelection>
    </div>
  );
}

function FilterLink({
  href,
  active,
  label,
  count,
  countClass,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  countClass?: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-sm font-semibold transition-colors duration-200",
        active
          ? "border-navy-900 bg-navy-900 text-white"
          : "border-transparent bg-slate-50 text-navy-800 hover:border-slate-200 hover:bg-white",
      )}
    >
      {label}
      <span className={cn("tabular-nums", active ? "text-sky-200" : countClass ?? "text-slate-400")}>{count}</span>
    </Link>
  );
}
