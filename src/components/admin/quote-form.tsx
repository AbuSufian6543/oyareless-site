import Link from "next/link";

import {
  Card,
  CardTitle,
  CheckboxField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/admin/ui";
import {
  QUOTE_SERVICE_AREAS,
  QUOTE_STATUSES,
  serviceAreaFieldId,
} from "@/lib/quote-options";

export type QuoteFormValues = {
  id?: string;
  contactName: string;
  email: string;
  phone: string;
  companyName: string;
  siteAddress: string;
  details: string;
  timeframe: string;
  budgetRange: string;
  status: string;
  customerId: string;
  internalNotes: string;
  serviceAreas: string[];
};

export function QuoteForm({
  action,
  values,
  customers,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  values: QuoteFormValues;
  customers: Array<{ id: string; name: string }>;
  submitLabel: string;
}) {
  const known = new Set<string>(QUOTE_SERVICE_AREAS);
  const extraAreas = values.serviceAreas.filter((area) => !known.has(area));

  return (
    <form action={action} className="space-y-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <Card>
        <CardTitle>Contact</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Name"
            name="contactName"
            required
            defaultValue={values.contactName}
            autoComplete="name"
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            required
            defaultValue={values.email}
            autoComplete="email"
          />
          <TextField
            label="Phone"
            name="phone"
            defaultValue={values.phone}
            autoComplete="tel"
          />
          <TextField
            label="Company"
            name="companyName"
            defaultValue={values.companyName}
          />
        </div>
      </Card>

      <Card>
        <CardTitle description="What they need quoted, and where the work would happen.">
          Project
        </CardTitle>
        <div className="space-y-4">
          <TextField
            label="Site address"
            name="siteAddress"
            defaultValue={values.siteAddress}
          />
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-navy-800">
              Services of interest
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {QUOTE_SERVICE_AREAS.map((area) => (
                <CheckboxField
                  key={area}
                  label={area}
                  name="serviceAreas"
                  id={serviceAreaFieldId(area)}
                  value={area}
                  defaultChecked={values.serviceAreas.includes(area)}
                />
              ))}
              {extraAreas.map((area) => (
                <CheckboxField
                  key={area}
                  label={area}
                  name="serviceAreas"
                  id={serviceAreaFieldId(area)}
                  value={area}
                  defaultChecked
                />
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Timeframe"
              name="timeframe"
              defaultValue={values.timeframe}
              placeholder="e.g. this quarter"
            />
            <TextField
              label="Budget range"
              name="budgetRange"
              defaultValue={values.budgetRange}
              placeholder="optional"
            />
          </div>
          <TextAreaField
            label="Project details"
            name="details"
            required
            rows={8}
            defaultValue={values.details}
          />
        </div>
      </Card>

      <Card>
        <CardTitle description="Status and customer matching. Linked quotes appear in that customer’s portal.">
          Pipeline
        </CardTitle>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Status"
              name="status"
              defaultValue={values.status}
              options={QUOTE_STATUSES.map((item) => ({
                value: item.value,
                label: item.label,
              }))}
            />
            <SelectField
              label="Customer"
              name="customerId"
              defaultValue={values.customerId}
              options={[
                { value: "", label: "Not linked yet" },
                ...customers.map((customer) => ({
                  value: customer.id,
                  label: customer.name,
                })),
              ]}
            />
          </div>
          <TextAreaField
            label="Internal notes"
            name="internalNotes"
            rows={4}
            defaultValue={values.internalNotes}
            hint="Only visible to staff."
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {submitLabel}
        </button>
        <Link
          href="/admin/quotes"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
