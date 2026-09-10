import { PageHeader } from "@/components/admin/ui";
import { ViewFilter } from "@/components/workdesk/view-filter";
import { WorkItem, WorkList } from "@/components/workdesk/work-item";
import { prisma } from "@/lib/prisma";
import type { TicketStatus } from "@/generated/prisma/client";
import { technicianOrRedirect, technicianTicketWhere } from "@/lib/workdesk/access";
import { ticketAssigneeNames } from "@/lib/workdesk/board";

export const metadata = { title: "My tickets" };

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
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      include: {
        customer: { select: { name: true } },
        assignedTo: { select: { name: true } },
        assignees: { include: { user: { select: { name: true } } } },
      },
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
      <ViewFilter
        items={[
          { href: "/tech/tickets", label: "Open", active: view === "open", count: openCount },
          { href: "/tech/tickets?view=done", label: "Completed", active: view === "done", count: doneCount },
          { href: "/tech/tickets?view=all", label: "All", active: view === "all" },
        ]}
      />
      <WorkList
        count={tickets.length}
        empty={view === "done" ? "No completed tickets yet." : "Nothing assigned in this view."}
      >
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
    </div>
  );
}
