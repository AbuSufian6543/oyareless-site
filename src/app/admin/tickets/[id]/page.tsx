import { notFound } from "next/navigation";
import Link from "next/link";

import {
  assignTicketAction,
  deleteTicketAction,
  grantTicketAccessAction,
  notifyTicketStaffAction,
  replyStaffTicketAction,
  revokeTicketAccessAction,
  updateTicketDetailsAction,
  updateTicketPriorityAction,
  updateTicketStatusAction,
} from "@/app/admin/tickets/actions";
import { Alert, Card, CardTitle, PageHeader, SelectField, TextField } from "@/components/admin/ui";
import { ConfirmSubmit } from "@/components/workdesk/confirm-submit";
import { ActivityLog } from "@/components/workdesk/activity-log";
import { AssigneeChecklist } from "@/components/workdesk/assignee-checklist";
import { AttachmentField } from "@/components/workdesk/attachment-field";
import { AttachmentList } from "@/components/workdesk/attachment-list";
import { PriorityBadge, TicketStatusBadge } from "@/components/workdesk/badges";
import { EmailStaffButton, WorkdeskNotifyMenu } from "@/components/workdesk/notify-menu";
import { AssigneeAvatars } from "@/components/workdesk/work-item";
import { requireAdminRole } from "@/lib/admin-guard";
import { hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { ticketAssigneeNames } from "@/lib/workdesk/board";
import { ADMIN_TICKET_STATUSES } from "@/lib/workdesk/rules";
import { workdeskFileHref } from "@/lib/workdesk/files";
import { TICKET_CATEGORIES, TICKET_STATUS_LABELS } from "@/lib/workdesk/labels";
import { listAssignableStaff } from "@/lib/workdesk/staff";

export default async function AdminTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notify?: string }>;
}) {
  const user = await requireAdminRole("EMPLOYEE");
  const { id } = await params;
  const query = await searchParams;
  const [ticket, staff, customers] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true } },
        assignees: { include: { user: { select: { id: true, name: true } } } },
        accessGrants: { include: { user: { select: { id: true, name: true } } } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { attachments: true },
        },
        events: { orderBy: { createdAt: "asc" } },
      },
    }),
    listAssignableStaff(),
    prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!ticket) notFound();

  const selectedAssigneeIds =
    ticket.assignees.length > 0
      ? ticket.assignees.map((row) => row.userId)
      : ticket.assignedToId
        ? [ticket.assignedToId]
        : [];
  const assignedIds = new Set(selectedAssigneeIds);
  const recipientIds = new Set([
    ...assignedIds,
    ...ticket.accessGrants.map((grant) => grant.userId),
  ]);
  const grantOptions = staff
    .filter((person) => person.role === "TECHNICIAN")
    .filter((person) => !assignedIds.has(person.id))
    .filter((person) => !ticket.accessGrants.some((grant) => grant.userId === person.id))
    .map((person) => ({
      value: person.id,
      label: person.name,
    }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <PageHeader
          breadcrumb={{ href: "/admin/tickets", label: "Tickets" }}
          title={`${ticket.reference}: ${ticket.subject}`}
          description={`${ticket.customer.name} · ${ticket.category} · ${
            ticket.assignees.map((row) => row.user.name).join(", ") ||
            ticket.assignedTo?.name ||
            "Unassigned"
          }`}
          actions={
            <EmailStaffButton
              action={notifyTicketStaffAction}
              hiddenFields={{ ticketId: ticket.id }}
              disabled={recipientIds.size === 0}
            />
          }
        />
        {query.notify === "none" ? (
          <div className="mb-4">
            <Alert tone="warning">Assign someone before sending a reminder.</Alert>
          </div>
        ) : null}
        <div className="mb-4 flex flex-wrap gap-2">
          <TicketStatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <ol className="space-y-3">
          {ticket.messages.map((message) => (
            <li
              key={message.id}
              className={
                message.isInternal
                  ? "rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm"
                  : "rounded-lg border border-slate-200 bg-white p-4 text-sm"
              }
            >
              <p className="text-xs text-slate-500">
                {message.isInternal ? "Internal · " : ""}
                {message.authorStaffName || "Customer"} · {formatDateTime(message.createdAt)}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
              <AttachmentList
                files={message.attachments.map((file) => ({
                  ...file,
                  url: workdeskFileHref("ticket", file.id),
                }))}
              />
            </li>
          ))}
        </ol>
        <form action={replyStaffTicketAction} encType="multipart/form-data" className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <textarea
            name="body"
            required
            rows={5}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Reply or add a note"
          />
          <AttachmentField />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isInternal" className="size-4" />
            Internal note (not shown in the portal)
          </label>
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Send
          </button>
        </form>
      </div>

      <aside className="space-y-4">
        <Card>
          <CardTitle>Assigned to</CardTitle>
          <AssigneeAvatars names={ticketAssigneeNames(ticket)} />
        </Card>
        <WorkdeskNotifyMenu
          action={notifyTicketStaffAction}
          hiddenFields={{ ticketId: ticket.id }}
          hasRecipients={recipientIds.size > 0}
        />
        <Card>
          <CardTitle>Manage</CardTitle>
          <form action={updateTicketStatusAction} className="space-y-2">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <SelectField
              label="Status"
              name="status"
              defaultValue={ticket.status}
              options={ADMIN_TICKET_STATUSES.map((status) => ({
                value: status,
                label: TICKET_STATUS_LABELS[status],
              }))}
            />
            <button type="submit" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
              Update status
            </button>
          </form>
          <form action={updateTicketPriorityAction} className="mt-4 space-y-2">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <SelectField
              label="Priority"
              name="priority"
              defaultValue={ticket.priority}
              options={[
                { value: "LOW", label: "Low" },
                { value: "NORMAL", label: "Normal" },
                { value: "HIGH", label: "High" },
                { value: "EMERGENCY", label: "Emergency" },
              ]}
            />
            <button type="submit" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
              Update priority
            </button>
          </form>
          <form action={assignTicketAction} className="mt-4 space-y-2">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <AssigneeChecklist
              staff={staff}
              selectedIds={selectedAssigneeIds}
              legend="Assign technicians"
            />
            <button type="submit" className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Save assignment
            </button>
          </form>
        </Card>

        <Card>
          <CardTitle>Edit ticket</CardTitle>
          <form action={updateTicketDetailsAction} className="space-y-3">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <TextField label="Subject" name="subject" required defaultValue={ticket.subject} />
            <SelectField
              label="Category"
              name="category"
              defaultValue={ticket.category}
              options={TICKET_CATEGORIES.map((category) => ({ value: category, label: category }))}
            />
            <SelectField
              label="Customer"
              name="customerId"
              defaultValue={ticket.customerId}
              options={[
                ...customers.map((customer) => ({ value: customer.id, label: customer.name })),
                customers.some((customer) => customer.id === ticket.customerId)
                  ? []
                  : [{ value: ticket.customerId, label: ticket.customer.name }],
              ].flat()}
            />
            <button type="submit" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
              Save details
            </button>
          </form>
        </Card>

        <Card>
          <CardTitle description="Technicians who can open this ticket without being assigned. Prefer assigning above so they get work notifications.">
            Additional access
          </CardTitle>
          <ul className="mb-3 space-y-2 text-sm">
            {ticket.accessGrants.map((grant) => (
              <li key={grant.id} className="flex items-center justify-between gap-2">
                <span>{grant.user.name}</span>
                <form action={revokeTicketAccessAction}>
                  <input type="hidden" name="grantId" value={grant.id} />
                  <input type="hidden" name="ticketId" value={ticket.id} />
                  <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">
                    Remove
                  </button>
                </form>
              </li>
            ))}
            {ticket.accessGrants.length === 0 && (
              <li className="text-slate-500">None yet.</li>
            )}
          </ul>
          {grantOptions.length > 0 ? (
          <form action={grantTicketAccessAction} className="space-y-2">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <SelectField
              label="Grant access"
              name="userId"
              options={grantOptions}
            />
            <button type="submit" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">
              Grant
            </button>
          </form>
          ) : (
            <p className="text-xs text-slate-500">All technicians already have access, or none are available.</p>
          )}
        </Card>

        <Card>
          <CardTitle>History</CardTitle>
          <ActivityLog events={ticket.events} />
          {hasRole(user, "EMPLOYEE") ? (
            <Link
              href={`/admin/audit?action=ticket.&q=${encodeURIComponent(ticket.reference)}`}
              className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
            >
              Open in audit log
            </Link>
          ) : null}
        </Card>

        <Card className="border-red-200">
          <CardTitle description="Removes the ticket, messages, and files. Prefer Closed if you want to keep a record.">
            Delete ticket
          </CardTitle>
          <form action={deleteTicketAction}>
            <input type="hidden" name="ticketId" value={ticket.id} />
            <ConfirmSubmit
              message={`Delete ${ticket.reference}? This cannot be undone.`}
              className="w-full rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Delete ticket
            </ConfirmSubmit>
          </form>
        </Card>
      </aside>
    </div>
  );
}
