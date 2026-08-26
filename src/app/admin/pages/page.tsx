import Link from "next/link";
import { Copy, FileText, Plus, SquarePen } from "lucide-react";

import { duplicatePageAction } from "@/app/admin/pages/actions";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Pages" };

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; error?: string }>;
}) {
  const params = await searchParams;

  const pages = await prisma.page.findMany({
    orderBy: [{ status: "asc" }, { navOrder: "asc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      isSystem: true,
      showInHeaderNav: true,
      updatedAt: true,
      author: { select: { name: true } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Pages"
        description="Build and edit every page on the public website."
        actions={
          <Link
            href="/admin/pages/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            New page
          </Link>
        }
      />

      {params.deleted && (
        <div className="mb-5">
          <Alert tone="success">The page was deleted.</Alert>
        </div>
      )}
      {params.error === "system" && (
        <div className="mb-5">
          <Alert tone="danger">
            System pages back built-in routes and cannot be deleted. You can edit
            or archive them instead.
          </Alert>
        </div>
      )}

      {pages.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="size-8" aria-hidden="true" />}
            title="No pages yet"
            description="Create your first page to start building the site."
            action={
              <Link
                href="/admin/pages/new"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <Plus className="size-4" aria-hidden="true" />
                New page
              </Link>
            }
          />
        </Card>
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left">
                <tr>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Page
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600">
                    Status
                  </th>
                  <th className="hidden px-5 py-3 font-semibold text-slate-600 lg:table-cell">
                    Last edited
                  </th>
                  <th className="px-5 py-3 text-right font-semibold text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/pages/${page.id}`}
                        className="font-semibold text-navy-900 hover:text-brand-700"
                      >
                        {page.title}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500">
                          /{page.slug === "home" ? "" : page.slug}
                        </span>
                        {page.isSystem && <Badge tone="navy">System</Badge>}
                        {page.showInHeaderNav && (
                          <Badge tone="info">In menu</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={page.status} />
                    </td>
                    <td className="hidden px-5 py-3.5 text-slate-500 lg:table-cell">
                      {formatDateTime(page.updatedAt)}
                      {page.author?.name && (
                        <span className="block text-xs text-slate-400">
                          by {page.author.name}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/pages/${page.id}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-navy-800 transition-colors hover:bg-white"
                        >
                          <SquarePen className="size-3.5" aria-hidden="true" />
                          Edit
                        </Link>
                        <form action={duplicatePageAction}>
                          <input
                            type="hidden"
                            name="pageId"
                            value={page.id}
                          />
                          <button
                            type="submit"
                            title="Duplicate this page"
                            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-navy-800 transition-colors hover:bg-white"
                          >
                            <Copy className="size-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Duplicate</span>
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
