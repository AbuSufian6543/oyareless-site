import Link from "next/link";

import { PageHeader } from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Quotes" };

export default async function AdminQuotesPage() {
  await requireAdminRole("EDITOR");
  const quotes = await prisma.quoteRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { customer: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Quote requests"
        description="Public quote form submissions. Match them to a customer before they appear in the portal."
      />
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase text-slate-500">
            <th className="py-2">Ref</th>
            <th>Contact</th>
            <th>Company</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((quote) => (
            <tr key={quote.id} className="border-b border-slate-100">
              <td className="py-2 font-mono text-xs">
                <Link href={`/admin/quotes/${quote.id}`} className="text-brand-700 hover:underline">
                  {quote.reference}
                </Link>
              </td>
              <td>{quote.contactName}</td>
              <td>{quote.companyName ?? quote.customer?.name ?? "—"}</td>
              <td>{quote.status}</td>
            </tr>
          ))}
          {quotes.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-slate-500">
                No quote requests yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
