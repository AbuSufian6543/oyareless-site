import Link from "next/link";
import { FileText, Plus, Search, SquarePen } from "lucide-react";

import {
  Alert,
  Badge,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import {
  QUOTE_STATUSES,
  quoteStatusLabel,
  quoteStatusTone,
} from "@/lib/quotes";
import { cn, formatDateTime } from "@/lib/utils";
import type { QuoteStatus } from "@/generated/prisma/client";

export const metadata = { title: "Quotes" };

const FILTERS = [
  { value: "all", label: "All" },
  ...QUOTE_STATUSES,
] as const;

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    deleted?: string;
  }>;
}) {
  await requireAdminRole("EDITOR");
  const params = await searchParams;
  const filter = params.status ?? "all";
  const query = (params.q ?? "").trim();
  const statusFilter =
    filter !== "all" && QUOTE_STATUSES.some((item) => item.value === filter)
      ? (filter as QuoteStatus)
      : undefined;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(query
      ? {
          OR: [
            { reference: { contains: query, mode: "insensitive" as const } },
            { contactName: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { companyName: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [quotes, counts] = await Promise.all([
    prisma.quoteRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { customer: { select: { name: true } } },
    }),
    prisma.quoteRequest.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (status: string) =>
    status === "all"
      ? counts.reduce((total, row) => total + row._count, 0)
      : (counts.find((row) => row.status === status)?._count ?? 0);

  function hrefFor(status: string) {
    const search = new URLSearchParams();
    if (status !== "all") search.set("status", status);
    if (query) search.set("q", query);
    const qs = search.toString();
    return qs ? `/admin/quotes?${qs}` : "/admin/quotes";
  }

  return (
    <div>
      <PageHeader
        title="Quote requests"
        description="Website and phone quote requests. Link a request to a customer before it appears in the portal."
        actions={
          <Link
            href="/admin/quotes/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            New quote
          </Link>
        }
      />

      {params.deleted && (
        <div className="mb-5">
          <Alert tone="success">The quote request was deleted.</Alert>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <Link
              key={item.value}
              href={hrefFor(item.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                filter === item.value
                  ? "bg-navy-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {item.label}
              <span className="ml-1.5 tabular-nums opacity-70">
                {countFor(item.value)}
              </span>
            </Link>
          ))}
        </div>
        <form action="/admin/quotes" className="relative w-full lg:max-w-xs">
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search name, email, company, ref"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-sm text-navy-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
          />
        </form>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="size-8" aria-hidden="true" />}
            title={query || statusFilter ? "No matching quotes" : "No quote requests yet"}
            description={
              query || statusFilter
                ? "Try a different status or search."
                : "Public /request-quote submissions land here. You can also log a quote that came in by phone."
            }
            action={
              <Link
                href="/admin/quotes/new"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <Plus className="size-4" aria-hidden="true" />
                New quote
              </Link>
            }
          />
        </Card>
      ) : (
        <DataTable
          headers={["Reference", "Contact", "Project", "Status", "Received", ""]}
        >
          {quotes.map((quote) => (
            <tr key={quote.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3.5">
                <Link
                  href={`/admin/quotes/${quote.id}`}
                  className="font-mono text-sm font-semibold text-brand-700 hover:underline"
                >
                  {quote.reference}
                </Link>
              </td>
              <td className="px-4 py-3.5">
                <p className="font-semibold text-navy-900">{quote.contactName}</p>
                <p className="text-xs text-slate-500">
                  {quote.companyName ?? quote.customer?.name ?? quote.email}
                </p>
              </td>
              <td className="max-w-xs px-4 py-3.5 text-sm text-slate-600">
                {quote.serviceAreas.length > 0
                  ? quote.serviceAreas.slice(0, 3).join(", ")
                  : quote.details.slice(0, 80) || "—"}
                {quote.serviceAreas.length > 3 ? "…" : ""}
              </td>
              <td className="px-4 py-3.5">
                <Badge tone={quoteStatusTone(quote.status)}>
                  {quoteStatusLabel(quote.status)}
                </Badge>
              </td>
              <td className="px-4 py-3.5 text-sm text-slate-500">
                {formatDateTime(quote.createdAt)}
              </td>
              <td className="px-4 py-3.5">
                <Link
                  href={`/admin/quotes/${quote.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-navy-800 transition-colors hover:bg-white"
                >
                  <SquarePen className="size-3.5" aria-hidden="true" />
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
