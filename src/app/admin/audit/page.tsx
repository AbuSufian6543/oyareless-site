import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Audit log" };

const PAGE_SIZE = 100;

/** Security-relevant events get a louder treatment in the list. */
function toneFor(action: string): "danger" | "warning" | "info" | "neutral" {
  if (action.startsWith("user.login_failed")) return "danger";
  if (action.startsWith("user.") || action.includes("deleted")) return "warning";
  if (action.includes("published") || action.includes("created")) return "info";
  return "neutral";
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string }>;
}) {
  await requireAdminRole("SUPERADMIN");

  const params = await searchParams;
  const pageNumber = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const filter = params.action;

  const where = filter ? { action: { startsWith: filter } } : {};

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const groups = [
    { value: "", label: "Everything" },
    { value: "user.", label: "Accounts & sign-ins" },
    { value: "page.", label: "Pages" },
    { value: "post.", label: "Articles" },
    { value: "stream.", label: "Streams" },
    { value: "media.", label: "Media" },
    { value: "settings.", label: "Settings" },
  ];

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Append-only record of privileged actions. Useful for internal controls and incident review."
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {groups.map((group) => (
          <Link
            key={group.value}
            href={
              group.value
                ? `/admin/audit?action=${encodeURIComponent(group.value)}`
                : "/admin/audit"
            }
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              (filter ?? "") === group.value
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {group.label}
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShieldAlert className="size-8" aria-hidden="true" />}
            title="Nothing recorded yet"
            description="Sign-ins, content changes and configuration updates will appear here."
          />
        </Card>
      ) : (
        <>
          <DataTable headers={["When", "Action", "Who", "Detail", "IP"]}>
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                  {formatDateTime(entry.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={toneFor(entry.action)}>{entry.action}</Badge>
                </td>
                <td className="px-4 py-3 text-xs">
                  {entry.user ? (
                    <>
                      <span className="font-semibold text-navy-800">
                        {entry.user.name}
                      </span>
                      <span className="block text-slate-400">
                        {entry.user.email}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">System / anonymous</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {entry.summary ?? "—"}
                  {entry.entityType && (
                    <span className="block text-slate-400">
                      {entry.entityType}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {entry.ipAddress ?? "—"}
                </td>
              </tr>
            ))}
          </DataTable>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between text-sm">
              <p className="text-slate-500">
                Page {pageNumber} of {totalPages} · {total} entries
              </p>
              <div className="flex gap-2">
                {pageNumber > 1 && (
                  <Link
                    href={`/admin/audit?page=${pageNumber - 1}${
                      filter ? `&action=${encodeURIComponent(filter)}` : ""
                    }`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-navy-800 hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                )}
                {pageNumber < totalPages && (
                  <Link
                    href={`/admin/audit?page=${pageNumber + 1}${
                      filter ? `&action=${encodeURIComponent(filter)}` : ""
                    }`}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-navy-800 hover:bg-slate-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
