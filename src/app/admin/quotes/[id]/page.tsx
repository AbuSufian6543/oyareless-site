import { notFound } from "next/navigation";
import { Mail, Phone, Trash2 } from "lucide-react";

import {
  deleteQuoteAction,
  saveQuoteAction,
} from "@/app/admin/quotes/actions";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import { QuoteForm } from "@/components/admin/quote-form";
import {
  Alert,
  Badge,
  Card,
  CardTitle,
  PageHeader,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { quoteStatusLabel, quoteStatusTone } from "@/lib/quotes";
import { formatDateTime, telHref } from "@/lib/utils";

export const metadata = { title: "Edit quote" };

export default async function EditQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; created?: string; error?: string }>;
}) {
  await requireAdminRole("EDITOR");
  const { id } = await params;
  const query = await searchParams;

  const [quote, customers] = await Promise.all([
    prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, isActive: true } },
        attachments: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!quote) notFound();

  const customerOptions = [...customers];
  if (
    quote.customer &&
    !customerOptions.some((customer) => customer.id === quote.customerId)
  ) {
    customerOptions.unshift({ id: quote.customer.id, name: quote.customer.name });
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`${quote.reference}: ${quote.contactName}`}
        description={`Received ${formatDateTime(quote.createdAt)}`}
        breadcrumb={{ href: "/admin/quotes", label: "Quotes" }}
        actions={
          <Badge tone={quoteStatusTone(quote.status)}>
            {quoteStatusLabel(quote.status)}
          </Badge>
        }
      />

      {(query.saved || query.created) && (
        <div className="mb-5">
          <Alert tone="success">
            {query.created ? "The quote request was created." : "Changes saved."}
          </Alert>
        </div>
      )}
      {query.error && (
        <div className="mb-5">
          <Alert tone="danger">
            Please check the name, email, and project details.
          </Alert>
        </div>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Reach them
          </p>
          <a
            href={`mailto:${quote.email}?subject=${encodeURIComponent(
              `Re: Quote ${quote.reference}`,
            )}`}
            className="mt-2 flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
          >
            <Mail className="size-4 shrink-0" aria-hidden="true" />
            <span className="break-all">{quote.email}</span>
          </a>
          {quote.phone && (
            <a
              href={telHref(quote.phone)}
              className="mt-1.5 flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
            >
              <Phone className="size-4 shrink-0" aria-hidden="true" />
              {quote.phone}
            </a>
          )}
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Record
          </p>
          <dl className="mt-2 space-y-1.5 text-sm text-slate-700">
            <div className="flex justify-between gap-3">
              <dt>Source</dt>
              <dd className="font-medium text-navy-800">
                {quote.sourcePage === "staff"
                  ? "Logged by staff"
                  : quote.sourcePage || "Website"}
              </dd>
            </div>
            {quote.customer && (
              <div className="flex justify-between gap-3">
                <dt>Portal</dt>
                <dd className="font-medium text-navy-800">
                  Visible to {quote.customer.name}
                </dd>
              </div>
            )}
            {quote.respondedAt && (
              <div className="flex justify-between gap-3">
                <dt>Responded</dt>
                <dd className="font-medium text-navy-800">
                  {formatDateTime(quote.respondedAt)}
                </dd>
              </div>
            )}
            {quote.ipAddress && (
              <div className="flex justify-between gap-3">
                <dt>IP</dt>
                <dd className="font-mono text-xs text-navy-800">
                  {quote.ipAddress}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {quote.attachments.length > 0 && (
        <Card className="mb-5">
          <CardTitle>Attachments</CardTitle>
          <ul className="space-y-1.5 text-sm">
            {quote.attachments.map((file) => (
              <li key={file.id}>
                <a
                  href={file.url}
                  className="font-medium text-brand-700 hover:underline"
                >
                  {file.filename}
                </a>
                <span className="ml-2 text-xs text-slate-500">
                  {Math.max(1, Math.round(file.sizeBytes / 1024))} KB
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <QuoteForm
        action={saveQuoteAction}
        submitLabel="Save changes"
        customers={customerOptions}
        values={{
          id: quote.id,
          contactName: quote.contactName,
          email: quote.email,
          phone: quote.phone ?? "",
          companyName: quote.companyName ?? "",
          siteAddress: quote.siteAddress ?? "",
          details: quote.details,
          timeframe: quote.timeframe ?? "",
          budgetRange: quote.budgetRange ?? "",
          status: quote.status,
          customerId: quote.customerId ?? "",
          internalNotes: quote.internalNotes ?? "",
          serviceAreas: quote.serviceAreas,
        }}
      />

      <Card className="mt-6 border-red-200">
        <CardTitle description="This removes the request for staff and from any linked customer portal. It cannot be undone.">
          Delete this quote request
        </CardTitle>
        <ConfirmDeleteForm
          action={deleteQuoteAction}
          id={quote.id}
          message={`Delete ${quote.reference}? This cannot be undone.`}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete quote
          </button>
        </ConfirmDeleteForm>
      </Card>
    </div>
  );
}
