import Link from "next/link";
import {
  CircleCheck,
  ClipboardList,
  Clock,
  Headset,
  TriangleAlert,
} from "lucide-react";

import { PageHeader } from "@/components/admin/ui";
import { PriorityBadge, TaskStatusBadge, TicketStatusBadge } from "@/components/workdesk/badges";
import { prisma } from "@/lib/prisma";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { technicianOrRedirect, technicianTaskWhere, technicianTicketWhere } from "@/lib/workdesk/access";

export const metadata = { title: "My work" };

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

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
      include: { customer: { select: { name: true } } },
    }),
    prisma.internalTask.findMany({
      where: { ...taskWhere, status: { notIn: ["COMPLETED", "CLOSED"] } },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 8,
    }),
  ]);

  const firstName = user.name.split(" ")[0] || user.name;
  const stats = [
    {
      label: "Assigned tickets",
      value: ticketTotal,
      hint: `${ticketOpen} open`,
      href: "/tech/tickets",
      Icon: Headset,
    },
    {
      label: "Completed tickets",
      value: ticketDone,
      hint: ticketTotal === 0 ? "None assigned yet" : undefined,
      href: "/tech/tickets?view=done",
      Icon: CircleCheck,
    },
    {
      label: "Assigned tasks",
      value: taskTotal,
      hint: `${taskOpen} open`,
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
      label: "Overdue",
      value: taskOverdue,
      hint: taskOverdue > 0 ? "Due before today" : "Nothing overdue",
      href: "/tech/tasks",
      Icon: taskOverdue > 0 ? TriangleAlert : Clock,
      alert: taskOverdue > 0,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Hi, ${firstName}`}
        description="Your assigned tickets and tasks. Counts include extra ticket access an admin granted you."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={cn(
              "rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
              stat.alert ? "border-amber-300" : "border-slate-200 hover:border-brand-200",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-navy-900">
                  {stat.value}
                </p>
                {stat.hint && (
                  <p className={cn("mt-1 text-xs", stat.alert ? "font-semibold text-amber-700" : "text-slate-500")}>
                    {stat.hint}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg",
                  stat.alert ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-600",
                )}
              >
                <stat.Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-bold text-navy-900">Open tickets</h2>
            <Link href="/tech/tickets" className="text-sm font-semibold text-brand-700">
              View all {ticketOpen}
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="py-3">
                <Link href={`/tech/tickets/${ticket.id}`} className="block">
                  <p className="font-semibold text-navy-900">
                    {ticket.reference} — {ticket.subject}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <TicketStatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    <span>{ticket.customer.name}</span>
                    <span>{formatDateTime(ticket.updatedAt)}</span>
                  </p>
                </Link>
              </li>
            ))}
            {tickets.length === 0 && (
              <li className="py-6 text-sm text-slate-500">You are caught up. No open tickets.</li>
            )}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-bold text-navy-900">Open tasks</h2>
            <Link href="/tech/tasks" className="text-sm font-semibold text-brand-700">
              View all {taskOpen}
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const overdue = Boolean(task.dueAt && task.dueAt < today);
              return (
                <li key={task.id} className="py-3">
                  <Link href={`/tech/tasks/${task.id}`} className="block">
                    <p className="font-semibold text-navy-900">
                      {task.reference} — {task.title}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <TaskStatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                      {task.dueAt ? (
                        <span className={overdue ? "font-semibold text-amber-700" : undefined}>
                          {overdue ? "Overdue " : "Due "}
                          {formatDate(task.dueAt)}
                        </span>
                      ) : null}
                    </p>
                  </Link>
                </li>
              );
            })}
            {tasks.length === 0 && (
              <li className="py-6 text-sm text-slate-500">You are caught up. No open tasks.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
