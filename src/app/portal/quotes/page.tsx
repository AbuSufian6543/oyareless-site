import { PortalShell } from "@/app/portal/layout";
import { prisma } from "@/lib/prisma";
import { requirePortalUser } from "@/lib/portal-auth";
import { scopedWhere } from "@/lib/portal-scope";

export const metadata = { title: "Quotes", robots: { index: false } };

export default async function PortalQuotesPage() {
  const user = await requirePortalUser();
  const quotes = await prisma.quoteRequest.findMany({
    where: scopedWhere(user.customerId),
    orderBy: { createdAt: "desc" },
  });

  return (
    <PortalShell>
      <h1 className="text-2xl font-extrabold text-navy-900">Quotes</h1>
      <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {quotes.map((quote) => (
          <li key={quote.id} className="px-4 py-3 text-sm">
            <p className="font-semibold text-navy-900">
              {quote.reference} · {quote.status}
            </p>
            <p className="text-slate-600">{quote.details.slice(0, 180)}</p>
          </li>
        ))}
        {quotes.length === 0 && (
          <li className="px-4 py-6 text-sm text-slate-500">
            No quotes are linked to this account yet.
          </li>
        )}
      </ul>
    </PortalShell>
  );
}
