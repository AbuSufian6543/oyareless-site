import Link from "next/link";
import { ScrollText } from "lucide-react";

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
import {
  ticketAuditLabel,
  type TicketAuditAction,
} from "@/lib/workdesk/ticket-audit";

export const metadata = { title: "Ticket audit log" };

const PAGE_SIZE = 100;

const GROUPS: Array<{ value: string; label: string }> = [
  { value: "", label: "Everything" },
  { value: "ticket.created", label: "Created" },
  { value: "ticket.replied", label: "Replies" },
  { value: "ticket.noted", label: "Notes" },
  { value: "ticket.status_changed", label: "Status" },
  { value: "ticket.priority_changed", label: "Priority" },
  { value: "ticket.assigned", label: "Assignment" },
  { value: "ticket.updated", label: "Details" },
  { value: "ticket.access_", label: "Access" },
  { value: "ticket.deleted", label: "Deleted" },
];

function toneFor(action: string): "danger" | "warning" | "info" | "neutral" {
  if (action === "ticket.deleted") return "danger";
  if (action === "ticket.access_revoked" || action === "ticket.status_changed") {
    return "warning";
  }
  if (action === "ticket.created") return "info";
  return "neutral";
}

function queryString(input: { page?: number; action?: string; ticket?: string }) {
  const params = new URLSearchParams();
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.action) params.set("action", input.action);
  if (input.ticket) params.set("ticket", input.ticket);
  const query = params.toString();
  return query ? `/admin/tickets/audit?${query}` : "/admin/tickets/audit";
}

export default async function TicketAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; ticket?: string }>;
}) {
  await requireAdminRole("EDITOR");

  const params = await searchParams;
  const pageNumber = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const filter = params.action?.trim() ?? "";
  const ticketQuery = params.ticket?.trim() ?? "";

  const where = {
    ...(filter ? { action: { startsWith: filter } } : {}),
    ...(ticketQuery
      ? { ticketReference: { equals: ticketQuery, mode: "insensitive" as const } }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.ticketAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNumber - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        actorUser: { select: { name: true, email: true } },
        actorCustomerUser: { select: { name: true, email: true } },
      },
    }),
    prisma.ticketAuditLog.count({ where }),
  ]);

  const liveIds = new Set(
    (
      await prisma.ticket.findMany({
        where: {
          id: {
            in: entries
              .map((entry) => entry.ticketId)
              .filter((id): id is string => Boolean(id)),
          },
        },
        select: { id: true },
      })
    ).map((ticket) => ticket.id),
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        breadcrumb={{ href: "/admin/tickets", label: "Tickets" }}
        title="Ticket audit log"
        description="Append-only record of ticket create, update, and delete. Separate from the site audit log. Deleting a ticket does not erase these rows."
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {GROUPS.map((group) => (
          <Link
            key={group.value || "all"}
            href={queryString({ action: group.value || undefined, ticket: ticketQuery || undefined })}
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
        action="/admin/tickets/audit"
        method="get"
        className="mb-5 flex flex-wrap items-end gap-2"
      >
        {filter ? <input type="hidden" name="action" value={filter} /> : null}
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-navy-800">Ticket reference</span>
          <input
            type="search"
            name="ticket"
            defaultValue={ticketQuery}
            placeholder="WC-1042"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50"
        >
          Find
        </button>
        {ticketQuery ? (
          <Link
            href={queryString({ action: filter || undefined })}
            className="px-2 py-2 text-sm font-semibold text-slate-500 hover:text-navy-800"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {entries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ScrollText className="size-8" aria-hidden="true" />}
            title="Nothing recorded yet"
            description="Opening, updating, or deleting a ticket will appear here. Message text is not stored."
          />
        </Card>
      ) : (
        <>
          <DataTable headers={["When", "Ticket", "Action", "Who", "Detail", "IP"]}>
            {entries.map((entry) => {
              const person = entry.actorUser ?? entry.actorCustomerUser;
              const live = entry.ticketId ? liveIds.has(entry.ticketId) : false;
              return (
                <tr key={entry.id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-navy-800">
                    {live && entry.ticketId ? (
                      <Link
                        href={`/admin/tickets/${entry.ticketId}`}
                        className="text-brand-700 hover:underline"
                      >
                        {entry.ticketReference}
                      </Link>
                    ) : (
                      <span>
                        {entry.ticketReference}
                        {entry.action === "ticket.deleted" ? (
                          <span className="ml-1 font-normal text-slate-400">deleted</span>
                        ) : null}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={toneFor(entry.action)}>
                      {ticketAuditLabel(entry.action as TicketAuditAction)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-semibold text-navy-800">
                      {person?.name ?? entry.actorName}
                    </span>
                    <span className="block text-slate-400">
                      {entry.actorKind === "customer"
                        ? person && "email" in person
                          ? `Customer · ${person.email}`
                          : "Customer portal"
                        : person && "email" in person
                          ? person.email
                          : "Staff"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{entry.summary}</td>
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
                    href={queryString({
                      page: pageNumber - 1,
                      action: filter || undefined,
                      ticket: ticketQuery || undefined,
                    })}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-navy-800 hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                )}
                {pageNumber < totalPages && (
                  <Link
                    href={queryString({
                      page: pageNumber + 1,
                      action: filter || undefined,
                      ticket: ticketQuery || undefined,
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
