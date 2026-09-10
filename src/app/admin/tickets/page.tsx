import { createStaffTicketAction } from "@/app/admin/tickets/actions";
import { PageHeader, SelectField, TextAreaField, TextField } from "@/components/admin/ui";
import { AssigneeChecklist } from "@/components/workdesk/assignee-checklist";
import { AttachmentField } from "@/components/workdesk/attachment-field";
import { ViewFilter } from "@/components/workdesk/view-filter";
import { WorkItem, WorkList } from "@/components/workdesk/work-item";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import {
  OPEN_TICKET,
  ticketAssignedTo,
  ticketAssignedToOthers,
  ticketAssigneeNames,
  ticketUnassigned,
} from "@/lib/workdesk/board";
import { listAssignableStaff } from "@/lib/workdesk/staff";

export const metadata = { title: "Tickets" };

const VIEWS = ["mine", "team", "unassigned", "open", "all"] as const;
type TicketView = (typeof VIEWS)[number];

function parseView(value: string | undefined): TicketView {
  return VIEWS.includes(value as TicketView) ? (value as TicketView) : "open";
}

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; create?: string; error?: string }>;
}) {
  const user = await requireAdminRole("EDITOR");
  const params = await searchParams;
  const view = parseView(params.view);
  const createOpen = params.create === "1" || params.error === "invalid";

  const mineFilter = { ...OPEN_TICKET, ...ticketAssignedTo(user.id) };
  const teamFilter = { ...OPEN_TICKET, ...ticketAssignedToOthers(user.id) };
  const unassignedFilter = { ...OPEN_TICKET, ...ticketUnassigned() };

  const where =
    view === "mine"
      ? mineFilter
      : view === "team"
        ? teamFilter
        : view === "unassigned"
          ? unassignedFilter
          : view === "open"
            ? OPEN_TICKET
            : undefined;

  const [tickets, customers, staff, mineCount, teamCount, unassignedCount, openCount, allCount] =
    await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: 200,
        include: {
          customer: { select: { name: true } },
          assignedTo: { select: { id: true, name: true } },
          assignees: { include: { user: { select: { id: true, name: true } } } },
        },
      }),
      prisma.customer.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      listAssignableStaff(),
      prisma.ticket.count({ where: mineFilter }),
      prisma.ticket.count({ where: teamFilter }),
      prisma.ticket.count({ where: unassignedFilter }),
      prisma.ticket.count({ where: OPEN_TICKET }),
      prisma.ticket.count(),
    ]);

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Customer tickets assigned to you, to the team, or still waiting for an owner. Open a card to reply or reassign."
      />

      <details
        className="mb-6 rounded-xl border border-slate-200 bg-white open:shadow-sm"
        open={createOpen || undefined}
      >
        <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-navy-900">
          Open a ticket for a customer
        </summary>
        <form
          action={createStaffTicketAction}
          encType="multipart/form-data"
          className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2"
        >
          <SelectField
            label="Customer"
            name="customerId"
            required
            options={customers.map((customer) => ({ value: customer.id, label: customer.name }))}
          />
          <div className="sm:col-span-2">
            <AssigneeChecklist staff={staff} legend="Assign to" />
          </div>
          <TextField label="Subject" name="subject" required className="sm:col-span-2" />
          <SelectField
            label="Priority"
            name="priority"
            defaultValue="NORMAL"
            options={[
              { value: "LOW", label: "Low" },
              { value: "NORMAL", label: "Normal" },
              { value: "HIGH", label: "High" },
              { value: "EMERGENCY", label: "Emergency" },
            ]}
          />
          <div className="sm:col-span-2">
            <TextAreaField label="Message" name="body" rows={4} required />
          </div>
          <div className="sm:col-span-2">
            <AttachmentField />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Create ticket
            </button>
          </div>
        </form>
      </details>

      <ViewFilter
        items={[
          { href: "/admin/tickets", label: "Open", active: view === "open", count: openCount },
          { href: "/admin/tickets?view=mine", label: "Assigned to me", active: view === "mine", count: mineCount },
          { href: "/admin/tickets?view=team", label: "Assigned to others", active: view === "team", count: teamCount },
          { href: "/admin/tickets?view=unassigned", label: "Unassigned", active: view === "unassigned", count: unassignedCount },
          { href: "/admin/tickets?view=all", label: "All", active: view === "all", count: allCount },
        ]}
      />

      <WorkList
        count={tickets.length}
        empty={
          view === "mine"
            ? "No open tickets are assigned to you."
            : view === "team"
              ? "No open tickets are assigned to other staff."
              : view === "unassigned"
                ? "Every open ticket has an assignee."
                : "No tickets in this view."
        }
      >
        {tickets.map((ticket) => (
          <WorkItem
            key={ticket.id}
            kind="ticket"
            href={`/admin/tickets/${ticket.id}`}
            reference={ticket.reference}
            title={ticket.subject}
            status={ticket.status}
            priority={ticket.priority}
            subtitle={ticket.customer.name}
            updatedAt={ticket.updatedAt}
            assignees={ticketAssigneeNames(ticket)}
            you={user.name}
          />
        ))}
      </WorkList>
    </div>
  );
}
