import Link from "next/link";

import { PageHeader } from "@/components/admin/ui";
import { PriorityBadge, TicketStatusBadge } from "@/components/workdesk/badges";
import { prisma } from "@/lib/prisma";
import type { TicketStatus } from "@/generated/prisma/client";
import { cn, formatDateTime } from "@/lib/utils";
import { technicianOrRedirect, technicianTicketWhere } from "@/lib/workdesk/access";

export const metadata = { title: "My tickets" };

const VIEWS = [
  { id: "open", label: "Open", href: "/tech/tickets" },
  { id: "done", label: "Completed", href: "/tech/tickets?view=done" },
  { id: "all", label: "All", href: "/tech/tickets?view=all" },
] as const;

export default async function TechTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await technicianOrRedirect();
  const params = await searchParams;
  const view = params.view === "done" || params.view === "all" ? params.view : "open";
  const base = technicianTicketWhere(user.id);
  const doneStatuses: TicketStatus[] = ["RESOLVED", "CLOSED"];
  const where =
    view === "done"
      ? { ...base, status: { in: doneStatuses } }
      : view === "all"
        ? base
        : { ...base, status: { notIn: doneStatuses } };

  const [tickets, openCount, doneCount] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { customer: { select: { name: true } } },
    }),
    prisma.ticket.count({ where: { ...base, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
    prisma.ticket.count({ where: { ...base, status: { in: ["RESOLVED", "CLOSED"] } } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Assigned tickets"
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
        {tickets.map((ticket) => (
          <li key={ticket.id} className="px-4 py-3">
            <Link href={`/tech/tickets/${ticket.id}`} className="font-semibold text-navy-900 hover:text-brand-700">
              {ticket.reference} — {ticket.subject}
            </Link>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <TicketStatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              <span>{ticket.customer.name}</span>
              <span>{formatDateTime(ticket.updatedAt)}</span>
            </p>
          </li>
        ))}
        {tickets.length === 0 && (
          <li className="px-4 py-8 text-sm text-slate-500">
            {view === "done" ? "No completed tickets yet." : "Nothing assigned in this view."}
          </li>
        )}
      </ul>
    </div>
  );
}
