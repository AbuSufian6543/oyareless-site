import {
  saveNavItemAction,
  seedShippedNavAction,
} from "@/app/admin/navigation/actions";
import { NavMenuEditor, type NavEditorItem } from "@/components/admin/nav-menu-editor";
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

export const metadata = { title: "Menus" };

const ERRORS: Record<string, string> = {
  invalid: "A label and a link are required.",
  exists: "Menus are already set up — drag the lists below to change the order.",
  nopages: "No published pages are marked to show in the header menu.",
};

export default async function NavigationPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; deleted?: string; error?: string }>;
}) {
  await requireAdminRole("EDITOR");

  const params = await searchParams;

  const [items, pages] = await Promise.all([
    prisma.navItem.findMany({
      orderBy: [{ location: "asc" }, { order: "asc" }],
    }),
    prisma.page.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { title: "asc" },
      select: { title: true, slug: true },
    }),
  ]);

  const editorItems: NavEditorItem[] = items.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    location: item.location,
    order: item.order,
    parentId: item.parentId,
    isVisible: item.isVisible,
    openInNewTab: item.openInNewTab,
  }));

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
    { value: "/request-quote", label: "Request a quote (/request-quote)" },
    { value: "/portal", label: "Customer portal (/portal)" },
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Menus"
        description="Change the order of pages under Services, Tools, Support, and Company. Drag a row, use the arrows, or move a page into a different dropdown. This is what visitors see in the header and footer."
        breadcrumb={{ href: "/admin/pages", label: "Pages" }}
      />

      {params.saved && (
        <div className="mb-5">
          <Alert tone="success">The menus were updated.</Alert>
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
          <CardTitle description="Load the standard Services, Tools, Support, and Company menus, then drag them into the order you want.">
            Start from the shipped menus
          </CardTitle>
          <form action={seedShippedNavAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
            >
              Load Services, Tools, Support, and Company
            </button>
          </form>
        </Card>
      )}

      {items.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <NavMenuEditor items={editorItems} linkSuggestions={linkSuggestions} />

          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card>
              <CardTitle>Add a page to a menu</CardTitle>
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
                  label="Menu"
                  name="location"
                  defaultValue="HEADER"
                  options={[
                    { value: "HEADER", label: "Header" },
                    { value: "FOOTER", label: "Footer" },
                    { value: "UTILITY", label: "Top utility bar" },
                  ]}
                />
                <SelectField
                  label="Show under"
                  name="parentId"
                  defaultValue=""
                  hint="Pick Services, Tools, Support, or Company to add it to that dropdown."
                  options={[
                    { value: "", label: "Top level — not inside a dropdown" },
                    ...topLevel.map((entry) => ({
                      value: entry.id,
                      label: `${entry.label} (${entry.location === "HEADER" ? "header" : entry.location.toLowerCase()})`,
                    })),
                  ]}
                />
                <TextField
                  label="Order"
                  name="order"
                  type="number"
                  min={0}
                  defaultValue={0}
                  hint="Leave 0 to add at the top. After saving, drag it into place."
                />
                <CheckboxField label="Visible on the public site" name="isVisible" defaultChecked />
                <CheckboxField label="Open in a new tab" name="openInNewTab" />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Add to menu
                </button>
              </form>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
