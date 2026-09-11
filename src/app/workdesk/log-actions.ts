"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import type { TimeEntryKind } from "@/generated/prisma/client";
import { hasRole, type SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  assertTaskAccess,
  assertTicketAccess,
  handleWorkdeskAuth,
  isTechnician,
  workdeskHref,
  workdeskStaffOrRedirect,
} from "@/lib/workdesk/access";
import { recordTaskAudit, recordTicketAudit } from "@/lib/workdesk/audit";
import { dateInputValue, parseDateInput } from "@/lib/workdesk/dates";
import { recordWorkdeskEvent } from "@/lib/workdesk/events";
import { formatLoggedDuration, parseLoggedMinutes, parseProductQuantity } from "@/lib/workdesk/hours";
import { TIME_ENTRY_KIND_LABELS, TIME_ENTRY_KINDS } from "@/lib/workdesk/labels";
import { revalidateWorkdesk } from "@/lib/workdesk/revalidate";

const TIME_KINDS = new Set<string>(TIME_ENTRY_KINDS);

type WorkTarget =
  | { kind: "ticket"; ticketId: string }
  | { kind: "task"; taskId: string };

function readTarget(formData: FormData): WorkTarget | null {
  const ticketId = String(formData.get("ticketId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  if (ticketId && !taskId) return { kind: "ticket", ticketId };
  if (taskId && !ticketId) return { kind: "task", taskId };
  return null;
}

async function requireLogAccess(staff: SessionUser, target: WorkTarget) {
  if (target.kind === "ticket") {
    const ticket = await assertTicketAccess(staff, target.ticketId);
    return { status: ticket.status, reference: ticket.reference, subject: ticket.subject };
  }
  const task = await assertTaskAccess(staff, target.taskId);
  return { status: task.status, reference: task.reference, subject: task.title };
}

function canWriteLog(staff: SessionUser, status: string): boolean {
  if (hasRole(staff, "EMPLOYEE")) return true;
  return status !== "CLOSED";
}

function canRemoveRow(staff: SessionUser, ownerId: string): boolean {
  return hasRole(staff, "EMPLOYEE") || staff.id === ownerId;
}

function bounceTo(staff: SessionUser, target: WorkTarget): never {
  redirect(
    workdeskHref(
      staff.role,
      target.kind === "ticket" ? { ticketId: target.ticketId } : { taskId: target.taskId },
    ),
  );
}

function ids(target: WorkTarget): { ticketId?: string; taskId?: string } {
  return target.kind === "ticket" ? { ticketId: target.ticketId } : { taskId: target.taskId };
}

function staffTicketActor(staff: SessionUser) {
  return { kind: "staff" as const, id: staff.id, name: staff.name, email: staff.email };
}

function staffTaskActor(staff: SessionUser) {
  return { id: staff.id, name: staff.name, email: staff.email };
}

export async function addTimeEntryAction(formData: FormData): Promise<void> {
  const staff = await workdeskStaffOrRedirect();
  const target = readTarget(formData);
  if (!target) return;

  let item: { status: string; reference: string; subject: string };
  try {
    item = await requireLogAccess(staff, target);
  } catch (error) {
    handleWorkdeskAuth(error, isTechnician(staff) ? "/tech" : "/admin");
  }
  if (!canWriteLog(staff, item.status)) bounceTo(staff, target);

  const minutes = parseLoggedMinutes(
    String(formData.get("hours") ?? ""),
    String(formData.get("minutes") ?? ""),
  );
  const kindRaw = String(formData.get("kind") ?? "ONSITE");
  const kind = TIME_KINDS.has(kindRaw) ? (kindRaw as TimeEntryKind) : "ONSITE";
  const workedOn =
    parseDateInput(String(formData.get("workedOn") ?? dateInputValue(new Date()))) ?? new Date();
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);
  if (!minutes) bounceTo(staff, target);

  await prisma.workTimeEntry.create({
    data: {
      ...ids(target),
      userId: staff.id,
      minutes,
      kind,
      workedOn,
      note,
    },
  });

  const duration = formatLoggedDuration(minutes);
  const kindLabel = TIME_ENTRY_KIND_LABELS[kind] ?? kind;
  await recordWorkdeskEvent({
    kind: "TIME_LOGGED",
    summary: `${staff.name} logged ${duration} (${kindLabel.toLowerCase()})`,
    ...ids(target),
    actorStaffId: staff.id,
    meta: { minutes, kind },
  });

  if (target.kind === "ticket") {
    await recordTicketAudit({
      action: "ticket.time_logged",
      ticketId: target.ticketId,
      ticketReference: item.reference,
      summary: `${staff.name} logged ${duration} on ${item.reference}`,
      actor: staffTicketActor(staff),
      details: { minutes, kind },
    });
  } else {
    await recordTaskAudit({
      action: "task.time_logged",
      taskId: target.taskId,
      taskReference: item.reference,
      summary: `${staff.name} logged ${duration} on ${item.reference}`,
      actor: staffTaskActor(staff),
      details: { minutes, kind },
    });
  }

  await revalidateWorkdesk({ ...ids(target), flash: "logged" });
  bounceTo(staff, target);
}

export async function removeTimeEntryAction(formData: FormData): Promise<void> {
  const staff = await workdeskStaffOrRedirect();
  const entryId = String(formData.get("entryId") ?? "");
  if (!entryId) return;

  const entry = await prisma.workTimeEntry.findUnique({
    where: { id: entryId },
    include: {
      ticket: { select: { reference: true, status: true } },
      task: { select: { reference: true, status: true } },
    },
  });
  if (!entry) return;
  const target: WorkTarget = entry.ticketId
    ? { kind: "ticket", ticketId: entry.ticketId }
    : { kind: "task", taskId: entry.taskId as string };

  try {
    await requireLogAccess(staff, target);
  } catch (error) {
    handleWorkdeskAuth(error, isTechnician(staff) ? "/tech" : "/admin");
  }
  const status = entry.ticket?.status ?? entry.task?.status ?? "OPEN";
  if (!canWriteLog(staff, status) || !canRemoveRow(staff, entry.userId)) {
    bounceTo(staff, target);
  }

  await prisma.workTimeEntry.delete({ where: { id: entryId } });
  const duration = formatLoggedDuration(entry.minutes);
  const reference = entry.ticket?.reference ?? entry.task?.reference ?? "";

  await recordWorkdeskEvent({
    kind: "TIME_REMOVED",
    summary: `${staff.name} removed a ${duration} time entry`,
    ticketId: entry.ticketId,
    taskId: entry.taskId,
    actorStaffId: staff.id,
  });

  if (entry.ticketId) {
    await recordTicketAudit({
      action: "ticket.time_removed",
      ticketId: entry.ticketId,
      ticketReference: reference,
      summary: `${staff.name} removed ${duration} from ${reference}`,
      actor: staffTicketActor(staff),
      details: { minutes: entry.minutes },
    });
  } else if (entry.taskId) {
    await recordTaskAudit({
      action: "task.time_removed",
      taskId: entry.taskId,
      taskReference: reference,
      summary: `${staff.name} removed ${duration} from ${reference}`,
      actor: staffTaskActor(staff),
      details: { minutes: entry.minutes },
    });
  }

  await revalidateWorkdesk({ ...ids(target), flash: "deleted" });
  bounceTo(staff, target);
}

export async function addProductUsageAction(formData: FormData): Promise<void> {
  const staff = await workdeskStaffOrRedirect();
  const target = readTarget(formData);
  if (!target) return;

  let item: { status: string; reference: string; subject: string };
  try {
    item = await requireLogAccess(staff, target);
  } catch (error) {
    handleWorkdeskAuth(error, isTechnician(staff) ? "/tech" : "/admin");
  }
  if (!canWriteLog(staff, item.status)) bounceTo(staff, target);

  const typedName = String(formData.get("productName") ?? "").trim().slice(0, 120);
  const quantity = parseProductQuantity(String(formData.get("quantity") ?? "1"));
  const note = String(formData.get("note") ?? "").trim().slice(0, 200);
  const saveToCatalog =
    String(formData.get("saveToCatalog") ?? "") === "1" && hasRole(staff, "EMPLOYEE");
  if (!typedName || typedName === "__custom__" || !quantity) bounceTo(staff, target);

  let catalog = await prisma.workProduct.findFirst({
    where: { isActive: true, name: { equals: typedName, mode: "insensitive" } },
  });

  if (!catalog && saveToCatalog) {
    catalog = await prisma.workProduct.create({
      data: {
        name: typedName,
        category: "General",
        unit: "each",
      },
    });
    revalidatePath("/admin/products");
  }

  await prisma.workProductUsage.create({
    data: {
      ...ids(target),
      productId: catalog?.id,
      name: catalog?.name ?? typedName,
      sku: catalog?.sku,
      quantity,
      unit: catalog?.unit ?? "each",
      note,
      addedById: staff.id,
    },
  });

  const label = `${quantity} ${catalog?.unit ?? "each"} ${catalog?.name ?? typedName}`;
  await recordWorkdeskEvent({
    kind: "PRODUCT_USED",
    summary: `${staff.name} used ${label}`,
    ...ids(target),
    actorStaffId: staff.id,
  });

  if (target.kind === "ticket") {
    await recordTicketAudit({
      action: "ticket.product_used",
      ticketId: target.ticketId,
      ticketReference: item.reference,
      summary: `${staff.name} recorded ${label} on ${item.reference}`,
      actor: staffTicketActor(staff),
      details: { name: catalog?.name ?? typedName, quantity },
    });
  } else {
    await recordTaskAudit({
      action: "task.product_used",
      taskId: target.taskId,
      taskReference: item.reference,
      summary: `${staff.name} recorded ${label} on ${item.reference}`,
      actor: staffTaskActor(staff),
      details: { name: catalog?.name ?? typedName, quantity },
    });
  }

  await revalidateWorkdesk({ ...ids(target), flash: "logged" });
  bounceTo(staff, target);
}

export async function removeProductUsageAction(formData: FormData): Promise<void> {
  const staff = await workdeskStaffOrRedirect();
  const usageId = String(formData.get("usageId") ?? "");
  if (!usageId) return;

  const usage = await prisma.workProductUsage.findUnique({
    where: { id: usageId },
    include: {
      ticket: { select: { reference: true, status: true } },
      task: { select: { reference: true, status: true } },
    },
  });
  if (!usage) return;
  const target: WorkTarget = usage.ticketId
    ? { kind: "ticket", ticketId: usage.ticketId }
    : { kind: "task", taskId: usage.taskId as string };

  try {
    await requireLogAccess(staff, target);
  } catch (error) {
    handleWorkdeskAuth(error, isTechnician(staff) ? "/tech" : "/admin");
  }
  const status = usage.ticket?.status ?? usage.task?.status ?? "OPEN";
  if (!canWriteLog(staff, status) || !canRemoveRow(staff, usage.addedById)) {
    bounceTo(staff, target);
  }

  await prisma.workProductUsage.delete({ where: { id: usageId } });
  const reference = usage.ticket?.reference ?? usage.task?.reference ?? "";
  const label = `${usage.quantity} ${usage.unit} ${usage.name}`;

  await recordWorkdeskEvent({
    kind: "PRODUCT_REMOVED",
    summary: `${staff.name} removed ${label}`,
    ticketId: usage.ticketId,
    taskId: usage.taskId,
    actorStaffId: staff.id,
  });

  if (usage.ticketId) {
    await recordTicketAudit({
      action: "ticket.product_removed",
      ticketId: usage.ticketId,
      ticketReference: reference,
      summary: `${staff.name} removed ${label} from ${reference}`,
      actor: staffTicketActor(staff),
      details: { name: usage.name, quantity: usage.quantity },
    });
  } else if (usage.taskId) {
    await recordTaskAudit({
      action: "task.product_removed",
      taskId: usage.taskId,
      taskReference: reference,
      summary: `${staff.name} removed ${label} from ${reference}`,
      actor: staffTaskActor(staff),
      details: { name: usage.name, quantity: usage.quantity },
    });
  }

  await revalidateWorkdesk({ ...ids(target), flash: "deleted" });
  bounceTo(staff, target);
}
