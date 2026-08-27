import Link from "next/link";

import { PortalShell } from "@/app/portal/layout";
import { prisma } from "@/lib/prisma";
import { requirePortalUser } from "@/lib/portal-auth";
import { scopedWhere } from "@/lib/portal-scope";

export const metadata = { title: "Customer portal", robots: { index: false } };

export default async function PortalHome() {
  const user = await requirePortalUser();
  const where = scopedWhere(user.customerId);

  const [tickets, documents, services, quotes] = await Promise.all([
    prisma.ticket.count({ where }),
    prisma.customerDocument.count({ where }),
    prisma.customerServiceItem.findMany({ where, orderBy: { name: "asc" } }),
    prisma.quoteRequest.count({ where }),
  ]);

  return (
    <PortalShell>
      <h1 className="text-2xl font-extrabold text-navy-900">{user.customerName}</h1>
      <p className="mt-1 text-sm text-slate-600">Signed in as {user.email}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat href="/portal/tickets" label="Tickets" value={tickets} />
        <Stat href="/portal/documents" label="Documents" value={documents} />
        <Stat href="/portal/quotes" label="Quotes" value={quotes} />
      </div>
      <h2 className="mt-10 text-lg font-bold text-navy-900">Services on account</h2>
      {services.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">None listed yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {services.map((item) => (
            <li key={item.id} className="px-4 py-3 text-sm">
              <span className="font-semibold text-navy-900">{item.name}</span>
              <span className="ml-2 text-slate-500">{item.status}</span>
            </li>
          ))}
        </ul>
      )}
    </PortalShell>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-300">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-navy-900">{value}</p>
    </Link>
  );
}
