import "server-only";

import { notFound } from "next/navigation";

import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatDate, formatDateTime } from "@/lib/utils";
import { workdeskHref } from "@/lib/workdesk/access";
import { ticketAssigneeNames } from "@/lib/workdesk/board";
import {
  formatLoggedDuration,
  formatProductQuantity,
  splitWorkNoteLines,
} from "@/lib/workdesk/hours";
import {
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TICKET_STATUS_LABELS,
  TIME_ENTRY_KIND_LABELS,
} from "@/lib/workdesk/labels";
import { WORK_LOG_INCLUDE } from "@/lib/workdesk/work-log-query";
import {
  companyAddressLines,
  formatSiteAddress,
  minutesByKind,
  publicCompanyWebsite,
  sumMinutes,
  ticketNoteMeta,
  type WorkOrderCompany,
  type WorkOrderDocumentModel,
  type WorkOrderNote,
  type WorkOrderProductRow,
  type WorkOrderTimeRow,
} from "@/lib/workdesk/work-order";

function dateLabel(value: Date | string | null | undefined): string {
  return formatDate(value, { year: "numeric", month: "short", day: "numeric" });
}

function mapTimeEntries(
  rows: {
    id: string;
    minutes: number;
    kind: string;
    workedOn: Date;
    note: string;
    user: { name: string };
  }[],
): WorkOrderTimeRow[] {
  return [...rows]
    .sort((a, b) => {
      const byDay = a.workedOn.getTime() - b.workedOn.getTime();
      if (byDay !== 0) return byDay;
      return a.id.localeCompare(b.id);
    })
    .map((row) => ({
      id: row.id,
      dateLabel: dateLabel(row.workedOn),
      technician: row.user.name,
      kind: row.kind,
      kindLabel: TIME_ENTRY_KIND_LABELS[row.kind] ?? row.kind,
      minutes: row.minutes,
      durationLabel: formatLoggedDuration(row.minutes),
      notes: splitWorkNoteLines(row.note),
    }));
}

function mapProducts(
  rows: {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    unit: string;
    note: string;
    createdAt: Date;
    addedBy: { name: string };
  }[],
): WorkOrderProductRow[] {
  return [...rows]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku?.trim() || "",
      quantityLabel: formatProductQuantity(row.quantity, row.unit),
      note: row.note.trim(),
      addedBy: row.addedBy.name,
      addedOnLabel: dateLabel(row.createdAt),
    }));
}

function companyFromSettings(
  settings: Awaited<ReturnType<typeof getSettings>>,
): WorkOrderCompany {
  const website = publicCompanyWebsite();
  return {
    name: settings.companyName,
    tagline: settings.tagline,
    logoUrl: settings.logoUrl || "/brand/logo.png",
    addressLines: companyAddressLines(settings),
    phone: settings.phone,
    localPhone: settings.localPhone,
    email: settings.email,
    websiteHost: website.host,
    websiteUrl: website.url,
    hours: settings.businessHours,
    footerNote: settings.footerNote,
  };
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export async function loadTicketWorkOrder(
  id: string,
  staff: SessionUser,
): Promise<{ company: WorkOrderCompany; document: WorkOrderDocumentModel }> {
  const [settings, ticket] = await Promise.all([
    getSettings(),
    prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { name: true } },
        assignedTo: { select: { name: true } },
        assignees: { include: { user: { select: { name: true } } } },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            attachments: { select: { filename: true } },
            authorCustomerUser: { select: { name: true } },
          },
        },
        ...WORK_LOG_INCLUDE,
      },
    }),
  ]);
  if (!ticket) notFound();

  const assigned = ticketAssigneeNames(ticket);
  const timeEntries = mapTimeEntries(ticket.timeEntries);
  const products = mapProducts(ticket.productUsages);
  const totalMinutes = sumMinutes(timeEntries);
  const notes: WorkOrderNote[] = ticket.messages.map((message) => {
    const meta = ticketNoteMeta(message);
    return {
      id: message.id,
      at: formatDateTime(message.createdAt),
      author: meta.author,
      visibility: meta.visibility,
      visibilityLabel: meta.visibilityLabel,
      body: message.body.trim(),
      attachments: message.attachments.map((file) => file.filename).filter(Boolean),
    };
  });
  const opening = notes.find((note) => note.visibility !== "internal" && note.body);
  const attachments = uniqueNames(notes.flatMap((note) => note.attachments));
  const facts = [
    { label: "Category", value: ticket.category },
    { label: "Opened", value: formatDateTime(ticket.createdAt) },
    ticket.createdBy?.name
      ? { label: "Opened by", value: ticket.createdBy.name }
      : null,
    { label: "Last updated", value: formatDateTime(ticket.updatedAt) },
    ticket.firstResponseAt
      ? { label: "First response", value: formatDateTime(ticket.firstResponseAt) }
      : null,
    ticket.resolvedAt
      ? { label: "Resolved", value: formatDateTime(ticket.resolvedAt) }
      : null,
    ticket.closedAt
      ? { label: "Closed", value: formatDateTime(ticket.closedAt) }
      : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row?.value));

  return {
    company: companyFromSettings(settings),
    document: {
      kind: "ticket",
      kindLabel: "Service ticket",
      reference: ticket.reference,
      title: ticket.subject,
      description: opening?.body ?? "",
      statusLabel: TICKET_STATUS_LABELS[ticket.status] ?? ticket.status,
      priorityLabel: PRIORITY_LABELS[ticket.priority] ?? ticket.priority,
      facts,
      assigned,
      customer: {
        name: ticket.customer.name,
        accountRef: ticket.customer.accountRef?.trim() || "",
        phone: ticket.customer.phone?.trim() || "",
        email: ticket.customer.email?.trim() || "",
        address: formatSiteAddress(ticket.customer),
        accountNotes: ticket.customer.notes?.trim() || "",
      },
      timeEntries,
      kindTotals: minutesByKind(timeEntries),
      totalMinutes,
      totalDurationLabel: formatLoggedDuration(totalMinutes),
      products,
      notes,
      attachments,
      printedAtLabel: formatDateTime(new Date()),
      printedByName: staff.name,
      backHref: workdeskHref(staff.role, { ticketId: ticket.id }),
      backLabel: "Back to ticket",
    },
  };
}

export async function loadTaskWorkOrder(
  id: string,
  staff: SessionUser,
): Promise<{ company: WorkOrderCompany; document: WorkOrderDocumentModel }> {
  const [settings, task] = await Promise.all([
    getSettings(),
    prisma.internalTask.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true } },
        assignees: { include: { user: { select: { name: true } } } },
        notes: {
          orderBy: { createdAt: "asc" },
          include: { attachments: { select: { filename: true } } },
        },
        attachments: { select: { filename: true } },
        ...WORK_LOG_INCLUDE,
      },
    }),
  ]);
  if (!task) notFound();

  const assigned = task.assignees.map((row) => row.user.name);
  const timeEntries = mapTimeEntries(task.timeEntries);
  const products = mapProducts(task.productUsages);
  const totalMinutes = sumMinutes(timeEntries);
  const notes: WorkOrderNote[] = task.notes.map((note) => ({
    id: note.id,
    at: formatDateTime(note.createdAt),
    author: note.authorName,
    visibility: "internal",
    visibilityLabel: "Internal",
    body: note.body.trim(),
    attachments: note.attachments.map((file) => file.filename).filter(Boolean),
  }));
  const attachments = uniqueNames([
    ...task.attachments.map((file) => file.filename),
    ...notes.flatMap((note) => note.attachments),
  ]);
  const facts = [
    { label: "Created by", value: task.createdBy.name },
    { label: "Opened", value: formatDateTime(task.createdAt) },
    { label: "Last updated", value: formatDateTime(task.updatedAt) },
    task.dueAt ? { label: "Due", value: formatDate(task.dueAt) } : null,
    task.completedAt
      ? { label: "Completed", value: formatDateTime(task.completedAt) }
      : null,
    task.closedAt ? { label: "Closed", value: formatDateTime(task.closedAt) } : null,
  ].filter((row): row is { label: string; value: string } => Boolean(row?.value));

  return {
    company: companyFromSettings(settings),
    document: {
      kind: "task",
      kindLabel: "Internal task",
      reference: task.reference,
      title: task.title,
      description: task.description.trim(),
      statusLabel: TASK_STATUS_LABELS[task.status] ?? task.status,
      priorityLabel: PRIORITY_LABELS[task.priority] ?? task.priority,
      facts,
      assigned,
      customer: null,
      timeEntries,
      kindTotals: minutesByKind(timeEntries),
      totalMinutes,
      totalDurationLabel: formatLoggedDuration(totalMinutes),
      products,
      notes,
      attachments,
      printedAtLabel: formatDateTime(new Date()),
      printedByName: staff.name,
      backHref: workdeskHref(staff.role, { taskId: task.id }),
      backLabel: "Back to task",
    },
  };
}
