import { notFound } from "next/navigation";

import { techReplyTicketAction, techUpdateTicketStatusAction } from "@/app/tech/actions";
import { Card, CardTitle, PageHeader, SelectField } from "@/components/admin/ui";
import { ActivityLog } from "@/components/workdesk/activity-log";
import { AttachmentField } from "@/components/workdesk/attachment-field";
import { AttachmentList } from "@/components/workdesk/attachment-list";
import { PriorityBadge, TicketStatusBadge } from "@/components/workdesk/badges";
import { AssigneeAvatars } from "@/components/workdesk/work-item";
import { WorkLog, WorkLogSummary } from "@/components/workdesk/work-log";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";
import { assertTicketAccess, handleWorkdeskAuth, technicianOrRedirect } from "@/lib/workdesk/access";
import { ticketAssigneeNames } from "@/lib/workdesk/board";
import { workdeskFileHref } from "@/lib/workdesk/files";
import { TICKET_STATUS_LABELS } from "@/lib/workdesk/labels";
import { TECHNICIAN_TICKET_STATUSES } from "@/lib/workdesk/rules";
import { WORK_LOG_INCLUDE } from "@/lib/workdesk/work-log-query";

export const metadata = { title: "Ticket" };

export default async function TechTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await technicianOrRedirect();
  const { id } = await params;
  try {
    await assertTicketAccess(user, id);
  } catch (error) {
    handleWorkdeskAuth(error, "/tech/tickets");
  }

  const [ticket, catalog] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: { select: { name: true } },
        assignedTo: { select: { name: true } },
        assignees: { include: { user: { select: { name: true } } } },
        messages: { orderBy: { createdAt: "asc" }, include: { attachments: true } },
        events: { orderBy: { createdAt: "asc" } },
        ...WORK_LOG_INCLUDE,
      },
    }),
    prisma.workProduct.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: true, category: true },
    }),
  ]);
  if (!ticket) notFound();

  const closed = ticket.status === "CLOSED";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <PageHeader
          breadcrumb={{ href: "/tech/tickets", label: "Tickets" }}
          title={`${ticket.reference}: ${ticket.subject}`}
          description={ticket.customer.name}
        />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <TicketStatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <WorkLogSummary
            minutes={ticket.timeEntries.reduce((sum, row) => sum + row.minutes, 0)}
            productCount={ticket.productUsages.length}
          />
        </div>
        <WorkLog
          ticketId={ticket.id}
          timeEntries={ticket.timeEntries}
          productUsages={ticket.productUsages}
          catalog={catalog}
          currentUserId={user.id}
          canManageAll={false}
          canEdit={!closed}
          canSaveToCatalog={false}
        />
        <ol className="mt-6 space-y-3">
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
        {!closed && (
          <form action={techReplyTicketAction} encType="multipart/form-data" className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
            <input type="hidden" name="ticketId" value={ticket.id} />
            <textarea name="body" required rows={5} placeholder="Reply to the customer or add an internal note" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            <AttachmentField />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isInternal" className="size-4" />
              Internal note (not shown to the customer)
            </label>
            <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
              Send
            </button>
          </form>
        )}
      </div>
      <aside className="space-y-4">
        <Card>
          <CardTitle>Assigned to</CardTitle>
          <AssigneeAvatars names={ticketAssigneeNames(ticket)} you={user.name} />
        </Card>
        {!closed && (
          <Card>
            <CardTitle>Status</CardTitle>
            <form action={techUpdateTicketStatusAction} className="space-y-2">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <SelectField
                label="Update status"
                name="status"
                defaultValue={
                  TECHNICIAN_TICKET_STATUSES.includes(ticket.status as (typeof TECHNICIAN_TICKET_STATUSES)[number])
                    ? ticket.status
                    : "IN_PROGRESS"
                }
                options={TECHNICIAN_TICKET_STATUSES.map((status) => ({
                  value: status,
                  label: TICKET_STATUS_LABELS[status],
                }))}
              />
              <button type="submit" className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                Save status
              </button>
              <p className="text-xs text-slate-500">Mark resolved when your work is done. An admin closes the ticket after review.</p>
            </form>
          </Card>
        )}
        <Card>
          <CardTitle>History</CardTitle>
          <ActivityLog events={ticket.events} />
        </Card>
      </aside>
    </div>
  );
}
