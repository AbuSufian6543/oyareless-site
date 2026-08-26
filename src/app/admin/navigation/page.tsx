import { CornerDownRight, Trash2 } from "lucide-react";

import {
  deleteNavItemAction,
  saveNavItemAction,
  seedNavFromPagesAction,
} from "@/app/admin/navigation/actions";
import {
  Alert,
  Card,
  CardTitle,
  CheckboxField,
  PageHeader,
  SelectField,
  TextField,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "Navigation" };

const LOCATION_LABELS = {
  HEADER: "Header menu",
  FOOTER: "Footer links",
  UTILITY: "Top utility bar",
} as const;

const ERRORS: Record<string, string> = {
  invalid: "A label and a link are required.",
  exists: "The header menu already has items — edit them instead.",
  nopages: "No published pages are marked to show in the header menu.",
};

export default async function NavigationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  await requireAdminRole("ADMIN");

  const params = await searchParams;

  const [items, pages] = await Promise.all([
    prisma.navItem.findMany({ orderBy: [{ location: "asc" }, { order: "asc" }] }),
    prisma.page.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      select: { title: true, slug: true },
    }),
  ]);

  const topLevel = items.filter((item) => !item.parentId);

  const linkSuggestions = [
    { value: "/", label: "Home (/)" },
    ...pages.map((page) => ({
      value: `/${page.slug}`,
      label: `${page.title} (/${page.slug})`,
    })),
    { value: "/news", label: "News (/news)" },
    { value: "/live", label: "Live streams (/live)" },
    { value: "/careers", label: "Careers (/careers)" },
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Navigation"
        description="Custom menus. While the header menu is empty the site falls back to published pages marked “show in menu”."
      />

      {params.saved && (
        <div className="mb-5">
          <Alert tone="success">The menu was updated.</Alert>
        </div>
      )}
      {params.deleted && (
        <div className="mb-5">
          <Alert tone="success">The menu item was removed.</Alert>
        </div>
      )}
      {params.error && (
        <div className="mb-5">
          <Alert tone="danger">
            {ERRORS[params.error] ?? "The menu could not be updated."}
          </Alert>
        </div>
      )}

      {items.length === 0 && (
        <Card className="mb-6">
          <CardTitle description="Build the header menu from pages already marked to appear in the menu, then fine-tune it here.">
            Start from your pages
          </CardTitle>
          <form action={seedNavFromPagesAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
            >
              Generate header menu from pages
            </button>
          </form>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          {(["HEADER", "UTILITY", "FOOTER"] as const).map((location) => {
            const group = items.filter((item) => item.location === location);
            return (
              <Card key={location} padded={false}>
                <div className="border-b border-slate-200 px-5 py-3.5">
                  <h2 className="font-bold text-navy-900">
                    {LOCATION_LABELS[location]}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {group.length} item{group.length === 1 ? "" : "s"}
                  </p>
                </div>

                {group.length === 0 ? (
                  <p className="px-5 py-6 text-sm text-slate-500">
                    Nothing here yet.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {group
                      .filter((item) => !item.parentId)
                      .flatMap((parent) => [
                        parent,
                        ...group.filter((item) => item.parentId === parent.id),
                      ])
                      .map((item) => (
                        <li key={item.id} className="px-5 py-3">
                          <details>
                            <summary className="flex cursor-pointer items-center gap-2 text-sm">
                              {item.parentId && (
                                <CornerDownRight
                                  className="size-3.5 shrink-0 text-slate-300"
                                  aria-hidden="true"
                                />
                              )}
                              <span
                                className={cn(
                                  "font-semibold",
                                  item.isVisible
                                    ? "text-navy-900"
                                    : "text-slate-400 line-through",
                                )}
                              >
                                {item.label}
                              </span>
                              <span className="truncate font-mono text-xs text-slate-500">
                                {item.href}
                              </span>
                              <span className="ml-auto shrink-0 text-xs text-slate-400">
                                #{item.order}
                              </span>
                            </summary>

                            <form
                              action={saveNavItemAction}
                              className="mt-3 space-y-3 border-l-2 border-slate-100 pl-4"
                            >
                              <input type="hidden" name="id" value={item.id} />

                              <div className="grid gap-3 sm:grid-cols-2">
                                <TextField
                                  label="Label"
                                  name="label"
                                  required
                                  defaultValue={item.label}
                                />
                                <TextField
                                  label="Link"
                                  name="href"
                                  required
                                  defaultValue={item.href}
                                />
                                <SelectField
                                  label="Location"
                                  name="location"
                                  defaultValue={item.location}
                                  options={Object.entries(LOCATION_LABELS).map(
                                    ([value, label]) => ({ value, label }),
                                  )}
                                />
                                <TextField
                                  label="Order"
                                  name="order"
                                  type="number"
                                  min={0}
                                  defaultValue={item.order}
                                />
                                <SelectField
                                  label="Parent item"
                                  name="parentId"
                                  defaultValue={item.parentId ?? ""}
                                  hint="Creates a dropdown."
                                  options={[
                                    { value: "", label: "None — top level" },
                                    ...topLevel
                                      .filter((entry) => entry.id !== item.id)
                                      .map((entry) => ({
                                        value: entry.id,
                                        label: entry.label,
                                      })),
                                  ]}
                                />
                              </div>

                              <div className="grid gap-2.5 sm:grid-cols-2">
                                <CheckboxField
                                  label="Visible"
                                  name="isVisible"
                                  defaultChecked={item.isVisible}
                                />
                                <CheckboxField
                                  label="Open in a new tab"
                                  name="openInNewTab"
                                  defaultChecked={item.openInNewTab}
                                />
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  type="submit"
                                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                                >
                                  Save
                                </button>
                              </div>
                            </form>

                            <form
                              action={deleteNavItemAction}
                              className="mt-2 pl-4"
                            >
                              <input type="hidden" name="id" value={item.id} />
                              <button
                                type="submit"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="size-3.5" aria-hidden="true" />
                                Remove
                              </button>
                            </form>
                          </details>
                        </li>
                      ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardTitle>Add a menu item</CardTitle>

            <form action={saveNavItemAction} className="space-y-4">
              <TextField
                label="Label"
                name="label"
                required
                placeholder="Managed IT"
              />

              <div>
                <TextField
                  label="Link"
                  name="href"
                  required
                  placeholder="/managed-it"
                  list="nav-link-suggestions"
                />
                <datalist id="nav-link-suggestions">
                  {linkSuggestions.map((suggestion) => (
                    <option key={suggestion.value} value={suggestion.value}>
                      {suggestion.label}
                    </option>
                  ))}
                </datalist>
              </div>

              <SelectField
                label="Location"
                name="location"
                defaultValue="HEADER"
                options={Object.entries(LOCATION_LABELS).map(
                  ([value, label]) => ({ value, label }),
                )}
              />

              <SelectField
                label="Parent item"
                name="parentId"
                defaultValue=""
                hint="Creates a dropdown under that item."
                options={[
                  { value: "", label: "None — top level" },
                  ...topLevel.map((entry) => ({
                    value: entry.id,
                    label: `${entry.label} (${entry.location.toLowerCase()})`,
                  })),
                ]}
              />

              <TextField
                label="Order"
                name="order"
                type="number"
                min={0}
                defaultValue={0}
              />

              <CheckboxField label="Visible" name="isVisible" defaultChecked />
              <CheckboxField label="Open in a new tab" name="openInNewTab" />

              <button
                type="submit"
                className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Add item
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
