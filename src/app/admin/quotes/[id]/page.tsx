import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export default async function AdminQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminRole("EDITOR");
  const { id } = await params;
  const quote = await prisma.quoteRequest.findUnique({
    where: { id },
    include: { customer: { select: { name: true } } },
  });
  if (!quote) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`${quote.reference}: ${quote.contactName}`}
        description={`${quote.status} · ${quote.email}${quote.phone ? ` · ${quote.phone}` : ""}`}
      />
      <dl className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Company</dt>
          <dd className="mt-1 text-navy-900">{quote.companyName ?? quote.customer?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Site</dt>
          <dd className="mt-1 text-navy-900">{quote.siteAddress ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Areas</dt>
          <dd className="mt-1 text-navy-900">
            {quote.serviceAreas.length > 0 ? quote.serviceAreas.join(", ") : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Timeframe / budget</dt>
          <dd className="mt-1 text-navy-900">
            {[quote.timeframe, quote.budgetRange].filter(Boolean).join(" · ") || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Details</dt>
          <dd className="mt-1 whitespace-pre-wrap text-navy-900">{quote.details}</dd>
        </div>
      </dl>
    </div>
  );
}
