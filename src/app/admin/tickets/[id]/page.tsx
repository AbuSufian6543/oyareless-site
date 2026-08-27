import { notFound } from "next/navigation";

import { replyStaffTicketAction } from "@/app/admin/tickets/actions";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminRole("EDITOR");
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`${ticket.reference}: ${ticket.subject}`}
        description={`${ticket.customer.name} · ${ticket.status} · ${ticket.priority}`}
      />
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
              {message.authorStaffName || "Customer"} · {message.createdAt.toLocaleString("en-CA")}
            </p>
            <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
          </li>
        ))}
      </ol>
      <form action={replyStaffTicketAction} className="mt-6 space-y-3">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <textarea name="body" required rows={5} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isInternal" className="size-4" />
          Internal note (not shown in the portal)
        </label>
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
          Send
        </button>
      </form>
    </div>
  );
}
