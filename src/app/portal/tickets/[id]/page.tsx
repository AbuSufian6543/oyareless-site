import { notFound } from "next/navigation";

import { PortalShell } from "@/app/portal/layout";
import { replyTicketAction } from "@/app/portal/tickets/actions";
import { ActivityLog } from "@/components/workdesk/activity-log";
import { AttachmentField } from "@/components/workdesk/attachment-field";
import { AttachmentList } from "@/components/workdesk/attachment-list";
import { PriorityBadge, TicketStatusBadge } from "@/components/workdesk/badges";
import { prisma } from "@/lib/prisma";
import { requirePortalUser } from "@/lib/portal-auth";
import { scopeToCustomer } from "@/lib/portal-scope";
import { formatDateTime } from "@/lib/utils";
import { workdeskFileHref } from "@/lib/workdesk/files";
import { CUSTOMER_VISIBLE_EVENT_KINDS } from "@/lib/workdesk/rules";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function PortalTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePortalUser();
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { attachments: true },
      },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  try {
    scopeToCustomer(ticket, user.customerId);
  } catch {
    notFound();
  }
  if (!ticket) notFound();

  const visible = ticket.messages.filter((message) => !message.isInternal);
  const history = ticket.events.filter((event) =>
    (CUSTOMER_VISIBLE_EVENT_KINDS as readonly string[]).includes(event.kind),
  );
  const closed = ticket.status === "CLOSED";

  return (
    <PortalShell>
      <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        {ticket.reference}
        <TicketStatusBadge status={ticket.status} />
        <PriorityBadge priority={ticket.priority} />
      </p>
      <h1 className="mt-1 text-2xl font-extrabold text-navy-900">{ticket.subject}</h1>
      <ol className="mt-6 space-y-3">
        {visible.map((message) => (
          <li key={message.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="text-xs text-slate-500">
              {message.authorCustomerUserId ? "You" : message.authorStaffName || "WirelessCom"} ·{" "}
              {formatDateTime(message.createdAt)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-navy-900">{message.body}</p>
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
        <form action={replyTicketAction} encType="multipart/form-data" className="mt-6 space-y-3">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <textarea name="body" required rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <AttachmentField />
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            Reply
          </button>
        </form>
      )}
      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-bold text-navy-900">History</h2>
        <ActivityLog events={history} />
      </section>
    </PortalShell>
  );
}
