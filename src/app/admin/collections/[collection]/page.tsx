import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Search, Trash2 } from "lucide-react";

import { deleteCollectionRecordAction } from "@/app/admin/collections/actions";
import {
  Alert,
  Badge,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  inputClass,
} from "@/components/admin/ui";
import { AdminIcon } from "@/components/admin/admin-icon";
import { getCollection } from "@/lib/admin-collections";
import { listRecords } from "@/lib/admin-collections.server";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

const PAGE_SIZE = 40;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection: key } = await params;
  return { title: getCollection(key)?.plural ?? "Not found" };
}

export default async function CollectionListPage({
  params,
  searchParams,
}: {
  params: Promise<{ collection: string }>;
  searchParams: Promise<{ q?: string; page?: string; deleted?: string }>;
}) {
  const { collection: key } = await params;
  const query = await searchParams;

  const collection = getCollection(key);
  if (!collection) notFound();

  const user = await getCurrentUser();
  const canWrite = hasRole(user, collection.writeRole);
  const canDelete = hasRole(user, "ADMIN");

  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const search = query.q ?? "";

  const { rows, total } = await listRecords(collection, {
    query: search,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-6xl">
      <PageHeader
        title={collection.plural}
        description={collection.description}
        actions={
          canWrite ? (
            <Link
              href={`/admin/collections/${collection.key}/new`}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="size-4" aria-hidden="true" />
              New {collection.label.toLowerCase()}
            </Link>
          ) : undefined
        }
      />

      {query.deleted && (
        <div className="mb-5">
          <Alert tone="success">
            The {collection.label.toLowerCase()} was deleted.
          </Alert>
        </div>
      )}

      {collection.searchFields.length > 0 && (
        <form className="mb-5" action={`/admin/collections/${collection.key}`}>
          <div className="relative max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder={`Search ${collection.plural.toLowerCase()}…`}
              aria-label={`Search ${collection.plural}`}
              className={`${inputClass} pl-9`}
            />
          </div>
        </form>
      )}

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon={<AdminIcon name={collection.icon} className="size-8" />}
            title={
              search
                ? `No ${collection.plural.toLowerCase()} match “${search}”`
                : `No ${collection.plural.toLowerCase()} yet`
            }
            description={
              search
                ? "Try a different search term."
                : collection.description
            }
            action={
              canWrite && !search ? (
                <Link
                  href={`/admin/collections/${collection.key}/new`}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Create the first one
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <DataTable
          headers={[
            ...collection.listColumns.map((column) => column.label),
            "",
          ]}
        >
          {rows.map((row) => {
            const id = String(row.id);
            return (
              <tr key={id} className="hover:bg-slate-50/70">
                {collection.listColumns.map((column, index) => (
                  <td key={column.field} className="px-4 py-3 align-middle">
                    {index === 0 ? (
                      <Link
                        href={`/admin/collections/${collection.key}/${id}`}
                        className="font-semibold text-navy-800 hover:text-brand-700"
                      >
                        {truncate(cellText(row[column.field]))}
                      </Link>
                    ) : (
                      <Cell field={column.field} value={row[column.field]} />
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-right align-middle">
                  {canDelete && (
                    <form action={deleteCollectionRecordAction}>
                      <input type="hidden" name="collection" value={collection.key} />
                      <input type="hidden" name="id" value={id} />
                      <button
                        type="submit"
                        aria-label={`Delete ${cellText(row[collection.titleField])}`}
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}

      {pageCount > 1 && (
        <nav
          className="mt-5 flex items-center justify-between text-sm"
          aria-label="Pagination"
        >
          <p className="text-slate-500">
            Page {page} of {pageCount} · {total} total
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageHref(collection.key, search, page - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-navy-800 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < pageCount && (
              <Link
                href={pageHref(collection.key, search, page + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-navy-800 hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

function pageHref(key: string, search: string, page: number): string {
  const query = new URLSearchParams();
  if (search) query.set("q", search);
  query.set("page", String(page));
  return `/admin/collections/${key}?${query.toString()}`;
}

function Cell({ field, value }: { field: string; value: unknown }) {
  if (typeof value === "boolean") {
    return value ? (
      <Badge tone="success">Yes</Badge>
    ) : (
      <Badge tone="neutral">No</Badge>
    );
  }

  if (value instanceof Date) {
    return <span className="text-slate-600">{formatDateTime(value)}</span>;
  }

  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">—</span>;
  }

  if (field === "status") return <StatusBadge status={String(value)} />;

  if (field === "severity" || field === "kind" || field === "placement") {
    return <Badge tone="navy">{humanise(String(value))}</Badge>;
  }

  return <span className="text-slate-600">{truncate(String(value))}</span>;
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (value instanceof Date) return formatDateTime(value);
  return String(value);
}

function truncate(text: string, max = 70): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function humanise(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, " ");
}
