import Link from "next/link";

import { PortalShell } from "@/app/portal/layout";
import { prisma } from "@/lib/prisma";
import { requirePortalUser } from "@/lib/portal-auth";
import { scopedWhere } from "@/lib/portal-scope";
import { createTicketAction } from "@/app/portal/tickets/actions";

export const metadata = { title: "Tickets", robots: { index: false } };

export default async function PortalTicketsPage() {
  const user = await requirePortalUser();
  const tickets = await prisma.ticket.findMany({
    where: scopedWhere(user.customerId),
    orderBy: { createdAt: "desc" },
  });

  return (
    <PortalShell>
      <h1 className="text-2xl font-extrabold text-navy-900">Support tickets</h1>
      <form action={createTicketAction} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-navy-900">Open a ticket</h2>
        <input name="subject" required placeholder="Subject" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <textarea name="body" required rows={4} placeholder="What is happening?" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          Submit
        </button>
      </form>
      <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="px-4 py-3">
            <Link href={`/portal/tickets/${ticket.id}`} className="font-semibold text-navy-900 hover:text-brand-700">
              {ticket.reference} — {ticket.subject}
            </Link>
            <p className="text-xs text-slate-500">
              {ticket.status} · {ticket.priority}
            </p>
          </li>
        ))}
        {tickets.length === 0 && <li className="px-4 py-6 text-sm text-slate-500">No tickets yet.</li>}
      </ul>
    </PortalShell>
  );
}
