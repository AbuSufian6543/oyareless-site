import {
  CircleCheck,
  ClipboardList,
  Clock,
  Headset,
  TriangleAlert,
} from "lucide-react";

import { PageHeader } from "@/components/admin/ui";
import { WorkItem, WorkList, WorkSection, WorkStatLink } from "@/components/workdesk/work-item";
import { prisma } from "@/lib/prisma";
import { technicianOrRedirect, technicianTaskWhere, technicianTicketWhere } from "@/lib/workdesk/access";
import { ticketAssigneeNames } from "@/lib/workdesk/board";
import { isOverdue, startOfToday } from "@/lib/workdesk/dates";

export const metadata = { title: "My work" };

const TASK_DONE = ["COMPLETED", "CLOSED"] as const;

export default async function TechHomePage() {
  const user = await technicianOrRedirect();
  const ticketWhere = technicianTicketWhere(user.id);
  const taskWhere = technicianTaskWhere(user.id);
  const today = startOfToday();

  const [
    ticketTotal,
    ticketOpen,
    ticketDone,
    taskTotal,
    taskOpen,
    taskDone,
    taskOverdue,
    tickets,
    tasks,
  ] = await Promise.all([
    prisma.ticket.count({ where: ticketWhere }),
    prisma.ticket.count({
      where: { ...ticketWhere, status: { notIn: ["RESOLVED", "CLOSED"] } },
    }),
    prisma.ticket.count({
      where: { ...ticketWhere, status: { in: ["RESOLVED", "CLOSED"] } },
    }),
    prisma.internalTask.count({ where: taskWhere }),
    prisma.internalTask.count({
      where: { ...taskWhere, status: { notIn: ["COMPLETED", "CLOSED"] } },
    }),
    prisma.internalTask.count({
      where: { ...taskWhere, status: { in: ["COMPLETED", "CLOSED"] } },
    }),
    prisma.internalTask.count({
      where: {
        ...taskWhere,
        status: { notIn: ["COMPLETED", "CLOSED"] },
        dueAt: { lt: today },
      },
    }),
    prisma.ticket.findMany({
      where: { ...ticketWhere, status: { notIn: ["RESOLVED", "CLOSED"] } },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 8,
      include: {
        customer: { select: { name: true } },
        assignedTo: { select: { name: true } },
        assignees: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.internalTask.findMany({
      where: { ...taskWhere, status: { notIn: ["COMPLETED", "CLOSED"] } },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 8,
      include: {
        assignees: { include: { user: { select: { name: true } } } },
      },
    }),
  ]);

  const firstName = user.name.split(" ")[0] || user.name;
  const stats = [
    {
      label: "Open tickets",
      value: ticketOpen,
      hint: `${ticketTotal} assigned`,
      href: "/tech/tickets",
      Icon: Headset,
    },
    {
      label: "Completed tickets",
      value: ticketDone,
      href: "/tech/tickets?view=done",
      Icon: CircleCheck,
    },
    {
      label: "Open tasks",
      value: taskOpen,
      hint: `${taskTotal} assigned`,
      href: "/tech/tasks",
      Icon: ClipboardList,
    },
    {
      label: "Completed tasks",
      value: taskDone,
      href: "/tech/tasks?view=done",
      Icon: CircleCheck,
    },
    {
      label: "Overdue tasks",
      value: taskOverdue,
      hint: taskOverdue > 0 ? "Needs attention today" : "Nothing overdue",
      href: "/tech/tasks?view=overdue",
      Icon: taskOverdue > 0 ? TriangleAlert : Clock,
      alert: taskOverdue > 0,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Hi, ${firstName}`}
        description="Your assigned tickets and tasks. Overdue work is highlighted so it is easy to see first."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <WorkStatLink key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WorkSection title="Open tickets" href="/tech/tickets" countLabel={`View all ${ticketOpen}`}>
          <WorkList count={tickets.length} empty="You are caught up. No open tickets.">
            {tickets.map((ticket) => (
              <WorkItem
                key={ticket.id}
                kind="ticket"
                href={`/tech/tickets/${ticket.id}`}
                reference={ticket.reference}
                title={ticket.subject}
                status={ticket.status}
                priority={ticket.priority}
                subtitle={ticket.customer.name}
                assignees={ticketAssigneeNames(ticket)}
                you={user.name}
              />
            ))}
          </WorkList>
        </WorkSection>
        <WorkSection title="Open tasks" href="/tech/tasks" countLabel={`View all ${taskOpen}`}>
          <WorkList count={tasks.length} empty="You are caught up. No open tasks.">
            {tasks.map((task) => (
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
              />
            ))}
          </WorkList>
        </WorkSection>
      </div>
    </div>
  );
}
