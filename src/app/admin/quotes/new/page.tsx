import { saveQuoteAction } from "@/app/admin/quotes/actions";
import { QuoteForm } from "@/components/admin/quote-form";
import { Alert, PageHeader } from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "New quote" };

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminRole("EDITOR");
  const params = await searchParams;

  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="New quote request"
        description="Log a quote that came in by phone, email, or the website."
        breadcrumb={{ href: "/admin/quotes", label: "Quotes" }}
      />

      {params.error && (
        <div className="mb-5">
          <Alert tone="danger">
            Please check the name, email, and project details.
          </Alert>
        </div>
      )}

      <QuoteForm
        action={saveQuoteAction}
        submitLabel="Create quote"
        customers={customers}
        values={{
          contactName: "",
          email: "",
          phone: "",
          companyName: "",
          siteAddress: "",
          details: "",
          timeframe: "",
          budgetRange: "",
          status: "NEW",
          customerId: "",
          internalNotes: "",
          serviceAreas: [],
        }}
      />
    </div>
  );
}
