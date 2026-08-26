import { FileText, LayoutTemplate, Mail, Rocket } from "lucide-react";

import { createPageAction } from "@/app/admin/pages/actions";
import {
  Alert,
  Card,
  CardTitle,
  PageHeader,
  TextField,
} from "@/components/admin/ui";

export const metadata = { title: "New page" };

const TEMPLATES = [
  {
    value: "blank",
    label: "Blank",
    description: "Just a hero section to start from.",
    icon: FileText,
  },
  {
    value: "service",
    label: "Service page",
    description: "Hero, intro copy, capability grid and a call to action.",
    icon: LayoutTemplate,
  },
  {
    value: "landing",
    label: "Landing page",
    description: "Tall hero, stats, services, testimonials and a CTA banner.",
    icon: Rocket,
  },
  {
    value: "contact",
    label: "Contact page",
    description: "Contact details with a map plus an enquiry form.",
    icon: Mail,
  },
] as const;

const ERRORS: Record<string, string> = {
  title: "Please give the page a title.",
  duplicate: "A page already uses that address. Try a different one.",
  reserved: "That address is reserved by the system. Choose another.",
};

export default async function NewPagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error ? ERRORS[params.error] : null;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Create a page"
        description="Pick a starting layout — you can add, remove and reorder sections afterwards."
        breadcrumb={{ href: "/admin/pages", label: "Pages" }}
      />

      {error && (
        <div className="mb-5">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}

      <form action={createPageAction}>
        <Card className="mb-5">
          <CardTitle description="The title appears in the browser tab and as the default heading.">
            Page details
          </CardTitle>

          <div className="space-y-4">
            <TextField
              label="Page title"
              name="title"
              required
              autoFocus
              placeholder="Managed Network Services"
            />
            <TextField
              label="URL address"
              name="slug"
              hint="Leave blank to generate one from the title."
              placeholder="managed-network-services"
            />
          </div>
        </Card>

        <Card className="mb-5">
          <CardTitle>Starting layout</CardTitle>

          <div className="grid gap-3 sm:grid-cols-2">
            {TEMPLATES.map((template, index) => (
              <label
                key={template.value}
                className="group relative flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:border-brand-400 hover:bg-brand-50/40 has-checked:border-brand-500 has-checked:bg-brand-50/60"
              >
                <input
                  type="radio"
                  name="template"
                  value={template.value}
                  defaultChecked={index === 0}
                  className="mt-0.5 size-4 shrink-0 border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-bold text-navy-800">
                    <template.icon
                      className="size-4 text-brand-600"
                      aria-hidden="true"
                    />
                    {template.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                    {template.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Create page
          </button>
          <p className="text-xs text-slate-500">
            The page starts as a draft and is not visible to the public.
          </p>
        </div>
      </form>
    </div>
  );
}
