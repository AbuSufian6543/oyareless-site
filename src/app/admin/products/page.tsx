import { Alert, Card, CardTitle, PageHeader, SelectField, TextField } from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { WORK_PRODUCT_CATEGORIES, WORK_PRODUCT_UNITS } from "@/lib/workdesk/labels";
import { createWorkProductAction, updateWorkProductAction } from "@/app/admin/products/actions";

export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminRole("EMPLOYEE");
  const params = await searchParams;
  const products = await prisma.workProduct.findMany({
    orderBy: [{ isActive: "desc" }, { category: "asc" }, { name: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Products used on jobs"
        description="Pick these when logging cable, radios, cameras, and other parts on a ticket or task. This is a job list, not warehouse stock or invoicing."
      />
      {params.error === "invalid" ? (
        <div className="mb-4">
          <Alert tone="danger">Enter a product name of at least two characters.</Alert>
        </div>
      ) : null}
      {params.error === "exists" ? (
        <div className="mb-4">
          <Alert tone="warning">That name or SKU is already on the list.</Alert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card>
          <CardTitle>Add a product</CardTitle>
          <form action={createWorkProductAction} className="space-y-3">
            <TextField label="Name" name="name" required placeholder="Cat6 Ethernet cable" />
            <TextField label="SKU" name="sku" hint="optional" placeholder="CAB-CAT6" />
            <SelectField
              label="Category"
              name="category"
              defaultValue="General"
              options={WORK_PRODUCT_CATEGORIES.map((category) => ({
                value: category,
                label: category,
              }))}
            />
            <SelectField
              label="Unit"
              name="unit"
              defaultValue="each"
              options={WORK_PRODUCT_UNITS.map((unit) => ({
                value: unit,
                label: unit,
              }))}
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Add to list
            </button>
          </form>
        </Card>

        <div className="space-y-3">
          {products.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No products yet. Add cable, radios, cameras, and other parts staff pick on a ticket or task.
            </p>
          ) : null}
          {products.map((product) => (
            <form
              key={product.id}
              action={updateWorkProductAction}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <input type="hidden" name="productId" value={product.id} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <TextField label="Name" name="name" required defaultValue={product.name} />
                <TextField label="SKU" name="sku" defaultValue={product.sku ?? ""} />
                <SelectField
                  label="Category"
                  name="category"
                  defaultValue={product.category}
                  options={WORK_PRODUCT_CATEGORIES.map((category) => ({
                    value: category,
                    label: category,
                  }))}
                />
                <SelectField
                  label="Unit"
                  name="unit"
                  defaultValue={product.unit}
                  options={WORK_PRODUCT_UNITS.map((unit) => ({
                    value: unit,
                    label: unit,
                  }))}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-navy-800">
                  <input
                    type="checkbox"
                    name="isActive"
                    value="1"
                    defaultChecked={product.isActive}
                    className="size-4"
                  />
                  Active (shown on tickets and tasks)
                </label>
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-navy-800 hover:bg-slate-50"
                >
                  Save
                </button>
              </div>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
