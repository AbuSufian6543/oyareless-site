import { bulkSetTicketStatusAction } from "@/app/workdesk/status-actions";
import { PageHeader } from "@/components/admin/ui";
import { ViewFilter } from "@/components/workdesk/view-filter";
import { WorkItem } from "@/components/workdesk/work-item";
import { WorkSelectBox, WorkSelection } from "@/components/workdesk/work-selection";
import { WorkLogSummary } from "@/components/workdesk/work-log";
import { prisma } from "@/lib/prisma";
import type { TicketStatus } from "@/generated/prisma/client";
import { technicianOrRedirect, technicianTicketWhere } from "@/lib/workdesk/access";
import { ticketAssigneeNames } from "@/lib/workdesk/board";
import { ticketBulkChoices } from "@/lib/workdesk/labels";
import { cleanWorkQuery, ticketSearchWhere } from "@/lib/workdesk/list-search";
import { WORK_LOG_LIST_INCLUDE, workLogTotals } from "@/lib/workdesk/work-log-query";
import { WorkSearch } from "@/components/workdesk/work-search";

export const metadata = { title: "My tickets" };

export default async function TechTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const user = await technicianOrRedirect();
  const params = await searchParams;
  const query = cleanWorkQuery(params.q);
  const searchWhere = ticketSearchWhere(query);
  const view = params.view === "done" || params.view === "all" ? params.view : "open";
  const listParams = new URLSearchParams();
  if (view !== "open") listParams.set("view", view);
  if (query) listParams.set("q", query);
  const listQuery = listParams.toString();
  const returnTo = listQuery ? `/tech/tickets?${listQuery}` : "/tech/tickets";
  const base = technicianTicketWhere(user.id);
  const doneStatuses: TicketStatus[] = ["RESOLVED", "CLOSED"];
  const viewWhere =
    view === "done"
      ? { ...base, status: { in: doneStatuses } }
      : view === "all"
        ? base
        : { ...base, status: { notIn: doneStatuses } };
  const where = searchWhere ? { AND: [base, searchWhere] } : viewWhere;

  const [tickets, openCount, doneCount] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      include: {
        customer: { select: { name: true } },
        assignedTo: { select: { name: true } },
        assignees: { include: { user: { select: { name: true } } } },
        ...WORK_LOG_LIST_INCLUDE,
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
      <WorkSearch action="/tech/tickets" query={query} kind="ticket" />
      <ViewFilter
        items={[
          { href: "/tech/tickets", label: "Open", active: view === "open", count: openCount },
          { href: "/tech/tickets?view=done", label: "Completed", active: view === "done", count: doneCount },
          { href: "/tech/tickets?view=all", label: "All", active: view === "all" },
        ]}
      />
      <WorkSelection
        ids={tickets.map((ticket) => ticket.id)}
        action={bulkSetTicketStatusAction}
        statuses={ticketBulkChoices(user.role)}
        returnTo={returnTo}
        noun="ticket"
        summary={`${tickets.length} in this list. Completed marks a ticket resolved.`}
        empty={query ? `No tickets match “${query}”.` : view === "done" ? "No completed tickets yet." : "Nothing assigned in this view."}
      >
        {tickets.map((ticket) => {
          const log = workLogTotals(ticket);
          return (
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
            leading={<WorkSelectBox id={ticket.id} label={`Select ${ticket.reference}`} />}
            meta={
              <WorkLogSummary hideEmpty minutes={log.minutes} productCount={log.productCount} />
            }
          />
          );
        })}
      </WorkSelection>
    </div>
  );
}
