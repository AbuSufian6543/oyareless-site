import { notFound } from "next/navigation";

import { PortalShell } from "@/app/portal/layout";
import { replyTicketAction } from "@/app/portal/tickets/actions";
import { prisma } from "@/lib/prisma";
import { requirePortalUser } from "@/lib/portal-auth";
import { scopeToCustomer } from "@/lib/portal-scope";

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
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  try {
    scopeToCustomer(ticket, user.customerId);
  } catch {
    notFound();
  }
  if (!ticket) notFound();

  const visible = ticket.messages.filter((message) => !message.isInternal);

  return (
    <PortalShell>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {ticket.reference} · {ticket.status}
      </p>
      <h1 className="mt-1 text-2xl font-extrabold text-navy-900">{ticket.subject}</h1>
      <ol className="mt-6 space-y-3">
        {visible.map((message) => (
          <li key={message.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="text-xs text-slate-500">
              {message.authorCustomerUserId ? "You" : message.authorStaffName || "WirelessCom"} ·{" "}
              {message.createdAt.toLocaleString("en-CA")}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-navy-900">{message.body}</p>
          </li>
        ))}
      </ol>
      <form action={replyTicketAction} className="mt-6 space-y-3">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <textarea name="body" required rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          Reply
        </button>
      </form>
    </PortalShell>
  );
}
