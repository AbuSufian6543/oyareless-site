import Link from "next/link";

import { PageHeader } from "@/components/admin/ui";
import { PriorityBadge, TaskStatusBadge, TicketStatusBadge } from "@/components/workdesk/badges";
import { prisma } from "@/lib/prisma";
import { technicianOrRedirect } from "@/lib/workdesk/access";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata = { title: "My work" };

export default async function TechHomePage() {
  const user = await technicianOrRedirect();
  const ticketWhere = {
    OR: [
      { assignedToId: user.id },
      { accessGrants: { some: { userId: user.id } } },
    ],
  };
  const [tickets, tasks] = await Promise.all([
    prisma.ticket.findMany({
      where: { ...ticketWhere, status: { not: "CLOSED" } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { customer: { select: { name: true } } },
    }),
    prisma.internalTask.findMany({
      where: {
        assignees: { some: { userId: user.id } },
        status: { not: "CLOSED" },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="My work"
        description="Only tickets and tasks assigned to you, or that an admin granted you extra access to."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-navy-900">Tickets</h2>
            <Link href="/tech/tickets" className="text-sm font-semibold text-brand-700">
              View all
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
            {tickets.length === 0 && <li className="py-4 text-sm text-slate-500">No open tickets.</li>}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-navy-900">Tasks</h2>
            <Link href="/tech/tasks" className="text-sm font-semibold text-brand-700">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <li key={task.id} className="py-3">
                <Link href={`/tech/tasks/${task.id}`} className="block">
                  <p className="font-semibold text-navy-900">
                    {task.reference} — {task.title}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <TaskStatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                    {task.dueAt ? <span>Due {formatDate(task.dueAt)}</span> : null}
                  </p>
                </Link>
              </li>
            ))}
            {tasks.length === 0 && <li className="py-4 text-sm text-slate-500">No open tasks.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
