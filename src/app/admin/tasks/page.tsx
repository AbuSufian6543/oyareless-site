import Link from "next/link";

import { PageHeader } from "@/components/admin/ui";
import { ViewFilter } from "@/components/workdesk/view-filter";
import { WorkItem, WorkList } from "@/components/workdesk/work-item";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import {
  OPEN_TASK,
  taskAssignedTo,
  taskAssignedToOthers,
  taskUnassigned,
} from "@/lib/workdesk/board";
import { isOverdue, startOfToday } from "@/lib/workdesk/dates";

export const metadata = { title: "Tasks" };

const VIEWS = ["mine", "team", "unassigned", "overdue", "all"] as const;
type TaskView = (typeof VIEWS)[number];

const TASK_DONE = ["COMPLETED", "CLOSED"] as const;

function parseView(value: string | undefined): TaskView {
  return VIEWS.includes(value as TaskView) ? (value as TaskView) : "mine";
}

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireAdminRole("EDITOR");
  const params = await searchParams;
  const view = parseView(params.view);
  const today = startOfToday();

  const mineFilter = { ...OPEN_TASK, ...taskAssignedTo(user.id) };
  const teamFilter = { ...OPEN_TASK, ...taskAssignedToOthers(user.id) };
  const unassignedFilter = { ...OPEN_TASK, ...taskUnassigned() };
  const overdueFilter = { ...OPEN_TASK, dueAt: { lt: today } };

  const where =
    view === "mine"
      ? mineFilter
      : view === "team"
        ? teamFilter
        : view === "unassigned"
          ? unassignedFilter
          : view === "overdue"
            ? overdueFilter
            : undefined;

  const [tasks, mineCount, teamCount, unassignedCount, overdueCount, allCount] = await Promise.all([
    prisma.internalTask.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: {
        assignees: { include: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.internalTask.count({ where: mineFilter }),
    prisma.internalTask.count({ where: teamFilter }),
    prisma.internalTask.count({ where: unassignedFilter }),
    prisma.internalTask.count({ where: overdueFilter }),
    prisma.internalTask.count(),
  ]);

  const empty =
    view === "mine"
      ? "No open tasks are assigned to you."
      : view === "team"
        ? "No open tasks are assigned to other staff."
        : view === "unassigned"
          ? "Every open task has an assignee."
          : view === "overdue"
            ? "Nothing is overdue."
            : "No internal tasks yet.";

  return (
    <div>
      <PageHeader
        title="Internal tasks"
        description="Open a card to update status, reassign, or add a note. Overdue work is highlighted."
        actions={
          <Link
            href="/admin/tasks/new"
            className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            New task
          </Link>
        }
      />
      <ViewFilter
        items={[
          { href: "/admin/tasks", label: "Assigned to me", active: view === "mine", count: mineCount },
          { href: "/admin/tasks?view=team", label: "Assigned to others", active: view === "team", count: teamCount },
          { href: "/admin/tasks?view=unassigned", label: "Unassigned", active: view === "unassigned", count: unassignedCount },
          { href: "/admin/tasks?view=overdue", label: "Overdue", active: view === "overdue", count: overdueCount },
          { href: "/admin/tasks?view=all", label: "All", active: view === "all", count: allCount },
        ]}
      />
      <WorkList count={tasks.length} empty={empty}>
        {tasks.map((task) => (
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
          />
        ))}
      </WorkList>
    </div>
  );
}
