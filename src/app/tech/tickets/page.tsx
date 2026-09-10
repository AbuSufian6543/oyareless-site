import Link from "next/link";

import { PageHeader } from "@/components/admin/ui";
import { PriorityBadge, TicketStatusBadge } from "@/components/workdesk/badges";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { technicianOrRedirect } from "@/lib/workdesk/access";

export const metadata = { title: "My tickets" };

export default async function TechTicketsPage() {
  const user = await technicianOrRedirect();
  const tickets = await prisma.ticket.findMany({
    where: {
      OR: [
        { assignedToId: user.id },
        { accessGrants: { some: { userId: user.id } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    include: { customer: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader title="Assigned tickets" description="Customer tickets assigned to you, plus any extra access an admin granted." />
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
        {tickets.length === 0 && <li className="px-4 py-8 text-sm text-slate-500">Nothing assigned yet.</li>}
      </ul>
    </div>
  );
}
