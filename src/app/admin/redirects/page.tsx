import { ArrowRight, Trash2 } from "lucide-react";

import {
  deleteRedirectAction,
  saveRedirectAction,
} from "@/app/admin/redirects/actions";
import {
  Alert,
  Badge,
  Card,
  CardTitle,
  CheckboxField,
  DataTable,
  PageHeader,
  SelectField,
  TextField,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Redirects" };

const ERRORS: Record<string, string> = {
  invalid: "Both a source and a destination are required.",
  duplicate: "A redirect for that source path already exists.",
  loop: "The source and destination cannot be the same.",
};

export default async function RedirectsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  await requireAdminRole("ADMIN");

  const params = await searchParams;

  const redirects = await prisma.redirect.findMany({
    orderBy: [{ isActive: "desc" }, { source: "asc" }],
  });

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Redirects"
        description="Send old or renamed URLs to their new home so links and search rankings survive."
      />

      {params.saved && (
        <div className="mb-5">
          <Alert tone="success">The redirect was saved.</Alert>
        </div>
      )}
      {params.deleted && (
        <div className="mb-5">
          <Alert tone="success">The redirect was removed.</Alert>
        </div>
      )}
      {params.error && (
        <div className="mb-5">
          <Alert tone="danger">
            {ERRORS[params.error] ?? "The redirect could not be saved."}
          </Alert>
        </div>
      )}

      <Card className="mb-6">
        <CardTitle description="Legacy .html addresses from the old site are already handled automatically — add anything extra here.">
          Add a redirect
        </CardTitle>

        <form action={saveRedirectAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="From (source path)"
              name="source"
              required
              placeholder="/old-services"
              hint="Path on this site."
            />
            <TextField
              label="To (destination)"
              name="destination"
              required
              placeholder="/services"
              hint="A path, or a full https:// URL."
            />
            <SelectField
              label="Type"
              name="statusCode"
              defaultValue="301"
              options={[
                { value: "301", label: "301 — permanent (recommended)" },
                { value: "302", label: "302 — temporary" },
              ]}
            />
          </div>

          <CheckboxField
            label="Active"
            name="isActive"
            defaultChecked
            description="Turn off to disable the redirect without deleting it."
          />

          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Add redirect
          </button>
        </form>
      </Card>

      {redirects.length > 0 && (
        <DataTable headers={["Redirect", "Type", "Hits", "Status", ""]}>
          {redirects.map((entry) => (
            <tr key={entry.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3">
                <span className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="text-navy-900">{entry.source}</span>
                  <ArrowRight className="size-3.5 text-slate-400" aria-hidden="true" />
                  <span className="text-brand-700">{entry.destination}</span>
                </span>
              </td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                {entry.statusCode}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">{entry.hits}</td>
              <td className="px-4 py-3">
                <Badge tone={entry.isActive ? "success" : "neutral"}>
                  {entry.isActive ? "Active" : "Off"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <form action={deleteRedirectAction}>
                  <input type="hidden" name="id" value={entry.id} />
                  <button
                    type="submit"
                    aria-label={`Delete redirect from ${entry.source}`}
                    className="rounded p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
