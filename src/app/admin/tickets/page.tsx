import Link from "next/link";

import { createStaffTicketAction, deleteTicketAction } from "@/app/admin/tickets/actions";
import { PageHeader, SelectField, TextAreaField, TextField } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/workdesk/confirm-submit";
import { AssigneeChecklist } from "@/components/workdesk/assignee-checklist";
import { AttachmentField } from "@/components/workdesk/attachment-field";
import { PriorityBadge, TicketStatusBadge } from "@/components/workdesk/badges";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { listAssignableStaff } from "@/lib/workdesk/staff";

export const metadata = { title: "Tickets" };

export default async function AdminTicketsPage() {
  await requireAdminRole("EDITOR");
  const [tickets, customers, staff] = await Promise.all([
    prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        customer: { select: { name: true } },
        assignedTo: { select: { name: true } },
        assignees: { include: { user: { select: { name: true } } } },
      },
    }),
    prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    listAssignableStaff(),
  ]);

  return (
    <div>
      <PageHeader
        title="Tickets"
        description="Customer support tickets. Assign one or more technicians; each person is emailed and notified in the site."
      />

      <form
        action={createStaffTicketAction}
        encType="multipart/form-data"
        className="mb-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 font-bold text-navy-900">Open a ticket for a customer</h2>
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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Assignees</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Opened</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-mono text-xs">
                  <Link href={`/admin/tickets/${ticket.id}`} className="font-semibold text-brand-700 hover:underline">
                    {ticket.reference}
                  </Link>
                </td>
                <td className="px-4 py-3">{ticket.subject}</td>
                <td className="px-4 py-3">{ticket.customer.name}</td>
                <td className="px-4 py-3">
                  {ticket.assignees.map((row) => row.user.name).join(", ") ||
                    ticket.assignedTo?.name ||
                    "—"}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={ticket.priority} />
                </td>
                <td className="px-4 py-3">
                  <TicketStatusBadge status={ticket.status} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(ticket.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/tickets/${ticket.id}`} className="text-xs font-semibold text-brand-700 hover:underline">
                      Edit
                    </Link>
                    <form action={deleteTicketAction}>
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <ConfirmSubmit
                        message={`Delete ${ticket.reference}? This cannot be undone.`}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Delete
                      </ConfirmSubmit>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No tickets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
