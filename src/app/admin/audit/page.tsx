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
import { hasRole } from "@/lib/auth";
import {
  auditActionLabel,
  readAuditMeta,
} from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { cn, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Audit log" };

const PAGE_SIZE = 100;

const ALL_GROUPS = [
  { value: "", label: "Everything" },
  { value: "user.", label: "Accounts & sign-ins" },
  { value: "page.", label: "Pages" },
  { value: "post.", label: "Articles" },
  { value: "stream.", label: "Streams" },
  { value: "quote.", label: "Quotes" },
  { value: "media.", label: "Media" },
  { value: "settings.", label: "Settings" },
  { value: "ticket.", label: "Tickets" },
  { value: "task.", label: "Tasks" },
] as const;

const WORKDESK_GROUPS = [
  { value: "", label: "Everything" },
  { value: "ticket.", label: "Tickets" },
  { value: "task.", label: "Tasks" },
] as const;

function workdeskAuditWhere() {
  return {
    OR: [
      { action: { startsWith: "ticket." } },
      { action: { startsWith: "task." } },
    ],
  };
}

function toneFor(action: string): "danger" | "warning" | "info" | "neutral" {
  if (action.startsWith("user.login_failed") || action.endsWith(".deleted")) {
    return "danger";
  }
  if (action.startsWith("user.") || action.includes("revoked") || action.includes("status_changed")) {
    return "warning";
  }
  if (action.includes("published") || action.includes("created")) return "info";
  return "neutral";
}

function entityLabel(entityType: string | null): string | null {
  if (!entityType) return null;
  if (entityType === "InternalTask") return "Task";
  if (entityType === "QuoteRequest") return "Quote";
  return entityType;
}

function hrefFor(input: { page?: number; action?: string; q?: string }) {
  const params = new URLSearchParams();
  if (input.action) params.set("action", input.action);
  if (input.q) params.set("q", input.q);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  const query = params.toString();
  return query ? `/admin/audit?${query}` : "/admin/audit";
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; q?: string }>;
}) {
  const user = await requireAdminRole("EMPLOYEE");
  const fullAudit = hasRole(user, "SUPERADMIN");
  const groups = fullAudit ? ALL_GROUPS : WORKDESK_GROUPS;

  const params = await searchParams;
  const pageNumber = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const requested = params.action?.trim() ?? "";
  const filter =
    fullAudit || requested === "ticket." || requested === "task."
      ? requested
      : "";
  const query = params.q?.trim() ?? "";

  const clauses: object[] = [];
  if (!fullAudit) clauses.push(workdeskAuditWhere());
  if (filter) clauses.push({ action: { startsWith: filter } });
  if (query) {
    clauses.push({
      OR: [
        { summary: { contains: query, mode: "insensitive" as const } },
        { ipAddress: { contains: query, mode: "insensitive" as const } },
        { action: { contains: query, mode: "insensitive" as const } },
        { entityId: { contains: query } },
      ],
    });
  }
  const where = clauses.length === 0 ? {} : clauses.length === 1 ? clauses[0] : { AND: clauses };

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

  const ticketIds = [
    ...new Set(
      entries
        .filter((entry) => entry.entityType === "Ticket" && entry.entityId)
        .map((entry) => entry.entityId as string),
    ),
  ];
  const taskIds = [
    ...new Set(
      entries
        .filter((entry) => entry.entityType === "InternalTask" && entry.entityId)
        .map((entry) => entry.entityId as string),
    ),
  ];

  const [liveTickets, liveTasks] = await Promise.all([
    ticketIds.length > 0
      ? prisma.ticket.findMany({
          where: { id: { in: ticketIds } },
          select: { id: true },
        })
      : [],
    taskIds.length > 0
      ? prisma.internalTask.findMany({
          where: { id: { in: taskIds } },
          select: { id: true },
        })
      : [],
  ]);

  const liveTicketIds = new Set(liveTickets.map((row) => row.id));
  const liveTaskIds = new Set(liveTasks.map((row) => row.id));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title={fullAudit ? "Audit log" : "Ticket & task audit"}
        description={
          fullAudit
            ? "Append-only record of sign-ins, content, quotes, tickets, and tasks. Every row keeps the caller IP. Deleting a ticket or task does not erase its trail."
            : "Create, update, and delete history for tickets and tasks, with caller IP. Site and account changes are not shown on this role."
        }
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {groups.map((group) => (
          <Link
            key={group.value || "all"}
            href={hrefFor({ action: group.value || undefined, q: query || undefined })}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              filter === group.value
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {group.label}
          </Link>
        ))}
      </div>

      <form
        action="/admin/audit"
        method="get"
        className="mb-5 flex flex-wrap items-end gap-2"
      >
        {filter ? <input type="hidden" name="action" value={filter} /> : null}
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-navy-800">
            Search summary or IP
          </span>
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="WC-1042, 203.0.113.10"
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50"
        >
          Find
        </button>
        {query ? (
          <Link
            href={hrefFor({ action: filter || undefined })}
            className="px-2 py-2 text-sm font-semibold text-slate-500 hover:text-navy-800"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ShieldAlert className="size-8" aria-hidden="true" />}
            title="Nothing recorded yet"
            description={
              fullAudit
                ? "Sign-ins, content changes, quote requests, tickets, and tasks will appear here with the caller IP."
                : "Opening, updating, or deleting a ticket or task will appear here with the caller IP. Message text is not stored."
            }
          />
        </Card>
      ) : (
        <>
          <DataTable headers={["When", "Action", "Who", "Detail", "IP"]}>
            {entries.map((entry) => {
              const meta = readAuditMeta(entry.details);
              const name = entry.user?.name ?? meta.actorName;
              const email = entry.user?.email ?? meta.actorEmail;
              const kind = meta.actorKind;
              const reference = meta.reference;
              const liveTicket =
                entry.entityType === "Ticket" &&
                entry.entityId &&
                liveTicketIds.has(entry.entityId);
              const liveTask =
                entry.entityType === "InternalTask" &&
                entry.entityId &&
                liveTaskIds.has(entry.entityId);
              const href = liveTicket
                ? `/admin/tickets/${entry.entityId}`
                : liveTask
                  ? `/admin/tasks/${entry.entityId}`
                  : null;

              return (
                <tr key={entry.id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneFor(entry.action)}>
                      {auditActionLabel(entry.action)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {name ? (
                      <>
                        <span className="font-semibold text-navy-800">{name}</span>
                        <span className="block text-slate-400">
                          {kind === "customer"
                            ? email
                              ? `Customer · ${email}`
                              : "Customer portal"
                            : email ?? (kind === "staff" ? "Staff" : "—")}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400">System / anonymous</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {entry.summary ?? "—"}
                    {(reference || entry.entityType) && (
                      <span className="mt-0.5 block text-slate-400">
                        {href ? (
                          <Link href={href} className="font-medium text-brand-700 hover:underline">
                            {reference ?? entityLabel(entry.entityType)}
                          </Link>
                        ) : (
                          <>
                            {reference ?? entityLabel(entry.entityType)}
                            {entry.action.endsWith(".deleted") ? (
                              <span className="ml-1">deleted</span>
                            ) : null}
                          </>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {entry.ipAddress ?? "—"}
                  </td>
                </tr>
              );
            })}
          </DataTable>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between text-sm">
              <p className="text-slate-500">
                Page {pageNumber} of {totalPages} · {total} entries
              </p>
              <div className="flex gap-2">
                {pageNumber > 1 && (
                  <Link
                    href={hrefFor({
                      page: pageNumber - 1,
                      action: filter || undefined,
                      q: query || undefined,
                    })}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-navy-800 hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                )}
                {pageNumber < totalPages && (
                  <Link
                    href={hrefFor({
                      page: pageNumber + 1,
                      action: filter || undefined,
                      q: query || undefined,
                    })}
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
