import Link from "next/link";

import { PageHeader } from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Tickets" };

export default async function AdminTicketsPage() {
  await requireAdminRole("EDITOR");
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader title="Tickets" description="Customer portal tickets. Internal notes never leave /admin." />
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase text-slate-500">
            <th className="py-2">Ref</th>
            <th>Subject</th>
            <th>Customer</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="border-b border-slate-100">
              <td className="py-2 font-mono text-xs">
                <Link href={`/admin/tickets/${ticket.id}`} className="text-brand-700 hover:underline">
                  {ticket.reference}
                </Link>
              </td>
              <td>{ticket.subject}</td>
              <td>{ticket.customer.name}</td>
              <td>{ticket.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
