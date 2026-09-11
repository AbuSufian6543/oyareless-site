"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { hashToken, randomToken } from "@/lib/crypto";
import { sendMail } from "@/lib/mail";
import { hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { publicUrl } from "@/lib/public-url";
import type { TicketPriority, TicketStatus } from "@/generated/prisma/client";
import { saveWorkdeskUploads } from "@/lib/workdesk/attachments";
import { workdeskAdminOrRedirect } from "@/lib/workdesk/access";
import { recordWorkdeskEvent } from "@/lib/workdesk/events";
import { recordTicketAudit } from "@/lib/workdesk/audit";
import { notifyAssignees, notifyAssignee, sendWorkdeskReminder } from "@/lib/workdesk/notify";
import { accessGrantNotice, assignmentNotice, joinStaffNames } from "@/lib/workdesk/notice";
import { nextTicketReference } from "@/lib/workdesk/references";
import { revalidateWorkdesk } from "@/lib/workdesk/revalidate";
import { workdeskAdminMaySetTicketStatus } from "@/lib/workdesk/rules";
import { PRIORITY_LABELS, TICKET_CATEGORIES, TICKET_STATUS_LABELS } from "@/lib/workdesk/labels";
import {
  activeAssigneeIds,
  assigneeIdsFrom,
  listTicketAssigneeIds,
  replaceTicketAssignees,
  staffNamesFor,
} from "@/lib/workdesk/staff";

export async function invitePortalUserAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const customerId = String(formData.get("customerId") ?? "");
  if (!email || !name || !customerId) return;

  const token = randomToken(24);
  const placeholder = await hashPassword(randomToken(24));

  try {
    await prisma.customerUser.create({
      data: {
        email,
        name,
        customerId,
        passwordHash: placeholder,
        mustChangePassword: true,
        inviteTokenHash: hashToken(token),
        inviteExpiresAt: new Date(Date.now() + 7 * 86_400_000),
      },
    });
  } catch {
    return;
  }

  const url = publicUrl(`/portal/accept?token=${encodeURIComponent(token)}`);
  const safeName = name
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  await sendMail({
    to: email,
    subject: "Your WirelessCom customer portal invite",
    html: `<p>Hello ${safeName},</p><p>An account was created for you on the WirelessCom.Ca customer portal.</p><p><a href="${url}">Choose a password</a></p><p>This link expires in 7 days.</p>`,
  });

  revalidatePath("/admin/portal-users");
}

async function attachFilesToMessage(messageId: string, formData: FormData) {
  const files = await saveWorkdeskUploads(formData);
  if (files.length === 0) return 0;
  await prisma.ticketAttachment.createMany({
    data: files.map((file) => ({
      messageId,
      filename: file.filename.split("/").pop() ?? file.filename,
      url: file.url,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    })),
  });
  return files.length;
}

export async function createStaffTicketAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const customerId = String(formData.get("customerId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const priority = String(formData.get("priority") ?? "NORMAL") as TicketPriority;
  const assigneeIds = await activeAssigneeIds(assigneeIdsFrom(formData));
  if (!customerId || subject.length < 3 || body.length < 5) {
    redirect("/admin/tickets?error=invalid");
  }

  const primaryId = assigneeIds[0] ?? null;

  const ticket = await prisma.ticket.create({
    data: {
      reference: await nextTicketReference(),
      subject: subject.slice(0, 200),
      customerId,
      priority: ["LOW", "NORMAL", "HIGH", "EMERGENCY"].includes(priority)
        ? priority
        : "NORMAL",
      assignedToId: primaryId,
      status: primaryId ? "OPEN" : "NEW",
      assignees: {
        create: assigneeIds.map((userId) => ({ userId })),
      },
      messages: {
        create: {
          body: body.slice(0, 8000),
          authorStaffId: staff.id,
          authorStaffName: staff.name,
        },
      },
    },
    include: { messages: true },
  });

  const first = ticket.messages[0];
  if (first) await attachFilesToMessage(first.id, formData);

  await recordWorkdeskEvent({
    kind: "CREATED",
    summary: `${staff.name} opened ${ticket.reference}`,
    ticketId: ticket.id,
    actorStaffId: staff.id,
  });
  await recordTicketAudit({
    action: "ticket.created",
    ticketId: ticket.id,
    ticketReference: ticket.reference,
    summary: `${staff.name} opened ${ticket.reference}`,
    actor: { kind: "staff", id: staff.id, name: staff.name },
    details: {
      subject: ticket.subject,
      priority: ticket.priority,
      assignees: assigneeIds.length,
    },
  });

  if (assigneeIds.length > 0) {
    const names = await staffNamesFor(assigneeIds);
    await recordWorkdeskEvent({
      kind: "ASSIGNED",
      summary: `${staff.name} assigned ${ticket.reference} to ${joinStaffNames(names)}`,
      ticketId: ticket.id,
      actorStaffId: staff.id,
    });
    const notice = assignmentNotice({
      actorName: staff.name,
      reference: ticket.reference,
      subject: ticket.subject,
      addedNames: names,
      allNames: names,
      kind: "ticket",
      previousCount: 0,
    });
    await notifyAssignees({
      userIds: assigneeIds,
      excludeUserIds: [staff.id],
      title: notice.title,
      body: notice.body,
      ticketId: ticket.id,
    });
  }

  await revalidateWorkdesk({ ticketId: ticket.id, flash: "created" });
  redirect(`/admin/tickets/${ticket.id}`);
}

export async function replyStaffTicketAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const isInternal = formData.get("isInternal") === "on";
  if (!ticketId || body.length < 2) return;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return;

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId,
      body: body.slice(0, 8000),
      authorStaffId: staff.id,
      authorStaffName: staff.name,
      isInternal,
    },
  });
  const fileCount = await attachFilesToMessage(message.id, formData);

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...(isInternal
        ? {}
        : {
            status: ticket.status === "NEW" ? "IN_PROGRESS" : ticket.status,
            firstResponseAt: ticket.firstResponseAt ?? new Date(),
          }),
    },
  });

  await recordWorkdeskEvent({
    kind: isInternal ? "NOTE" : "MESSAGE",
    summary: isInternal
      ? `${staff.name} added an internal note`
      : `${staff.name} replied to the customer`,
    ticketId,
    actorStaffId: staff.id,
  });
  if (fileCount > 0) {
    await recordWorkdeskEvent({
      kind: "ATTACHMENT",
      summary: `${staff.name} attached ${fileCount} file${fileCount === 1 ? "" : "s"}`,
      ticketId,
      actorStaffId: staff.id,
    });
  }
  await recordTicketAudit({
    action: isInternal ? "ticket.noted" : "ticket.replied",
    ticketId,
    ticketReference: ticket.reference,
    summary: isInternal
      ? `${staff.name} added an internal note on ${ticket.reference}`
      : `${staff.name} replied on ${ticket.reference}`,
    actor: { kind: "staff", id: staff.id, name: staff.name },
    details: {
      internal: isInternal,
      attachments: fileCount,
      statusFrom: ticket.status,
    },
  });

  await notifyAssignees({
    userIds: await listTicketAssigneeIds(ticketId),
    excludeUserIds: [staff.id],
    title: `${ticket.reference} updated`,
    body: `${staff.name} ${isInternal ? "added a note" : "replied"} on ${ticket.subject}`,
    kind: "UPDATE",
    ticketId,
  });

  await revalidateWorkdesk({ ticketId });
  redirect(`/admin/tickets/${ticketId}`);
}

export async function updateTicketStatusAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "") as TicketStatus;
  if (!ticketId || !workdeskAdminMaySetTicketStatus(status)) return;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status === status) return;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      resolvedAt: status === "RESOLVED" ? new Date() : ticket.resolvedAt,
      closedAt: status === "CLOSED" ? new Date() : status === "OPEN" ? null : ticket.closedAt,
    },
  });

  await recordWorkdeskEvent({
    kind:
      status === "CLOSED"
        ? "CLOSED"
        : status === "RESOLVED"
          ? "COMPLETED"
          : ticket.status === "CLOSED"
            ? "REOPENED"
            : "STATUS_CHANGED",
    summary: `${staff.name} set status to ${TICKET_STATUS_LABELS[status] ?? status}`,
    ticketId,
    actorStaffId: staff.id,
    meta: { from: ticket.status, to: status },
  });
  await recordTicketAudit({
    action: "ticket.status_changed",
    ticketId,
    ticketReference: ticket.reference,
    summary: `${staff.name} set ${ticket.reference} from ${TICKET_STATUS_LABELS[ticket.status] ?? ticket.status} to ${TICKET_STATUS_LABELS[status] ?? status}`,
    actor: { kind: "staff", id: staff.id, name: staff.name },
    details: { from: ticket.status, to: status },
  });

  await notifyAssignees({
    userIds: await listTicketAssigneeIds(ticketId),
    excludeUserIds: [staff.id],
    title:
      status === "RESOLVED" || status === "CLOSED"
        ? `${ticket.reference} marked ${TICKET_STATUS_LABELS[status] ?? status}`
        : `${ticket.reference} status updated`,
    body: `${staff.name} set ${ticket.reference} to ${TICKET_STATUS_LABELS[status] ?? status}`,
    kind: status === "RESOLVED" || status === "CLOSED" ? "RESOLVED" : "UPDATE",
    ticketId,
  });

  await revalidateWorkdesk({ ticketId });
  redirect(`/admin/tickets/${ticketId}`);
}

export async function updateTicketPriorityAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const ticketId = String(formData.get("ticketId") ?? "");
  const priority = String(formData.get("priority") ?? "") as TicketPriority;
  if (!ticketId || !["LOW", "NORMAL", "HIGH", "EMERGENCY"].includes(priority)) return;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.priority === priority) return;

  await prisma.ticket.update({ where: { id: ticketId }, data: { priority } });
  await recordWorkdeskEvent({
    kind: "PRIORITY_CHANGED",
    summary: `${staff.name} set priority to ${PRIORITY_LABELS[priority] ?? priority}`,
    ticketId,
    actorStaffId: staff.id,
  });
  await recordTicketAudit({
    action: "ticket.priority_changed",
    ticketId,
    ticketReference: ticket.reference,
    summary: `${staff.name} set ${ticket.reference} priority to ${PRIORITY_LABELS[priority] ?? priority}`,
    actor: { kind: "staff", id: staff.id, name: staff.name },
    details: { from: ticket.priority, to: priority },
  });
  await revalidateWorkdesk({ ticketId });
  redirect(`/admin/tickets/${ticketId}`);
}

export async function assignTicketAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const ticketId = String(formData.get("ticketId") ?? "");
  if (!ticketId) return;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { assignees: { select: { userId: true } } },
  });
  if (!ticket) return;

  const previous = new Set([
    ...ticket.assignees.map((row) => row.userId),
    ...(ticket.assignedToId ? [ticket.assignedToId] : []),
  ]);
  const nextIds = await activeAssigneeIds(assigneeIdsFrom(formData));
  const next = new Set(nextIds);
  const primaryId = nextIds[0] ?? null;
  const unchanged =
    previous.size === next.size && [...previous].every((id) => next.has(id));

  if (unchanged && ticket.assignedToId === primaryId) return;

  await replaceTicketAssignees(ticketId, nextIds);

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assignedToId: primaryId,
      status: primaryId && ticket.status === "NEW" ? "OPEN" : ticket.status,
    },
  });

  if (nextIds.length > 0) {
    await prisma.ticketAccessGrant.deleteMany({
      where: { ticketId, userId: { in: nextIds } },
    });
  }

  const names = await staffNamesFor(nextIds);
  const addedIds = nextIds.filter((id) => !previous.has(id));
  const addedNames = await staffNamesFor(addedIds);

  await recordWorkdeskEvent({
    kind: previous.size > 0 ? "REASSIGNED" : "ASSIGNED",
    summary:
      nextIds.length > 0
        ? `${staff.name} assigned the ticket to ${joinStaffNames(names)}`
        : `${staff.name} unassigned the ticket`,
    ticketId,
    actorStaffId: staff.id,
  });
  await recordTicketAudit({
    action: "ticket.assigned",
    ticketId,
    ticketReference: ticket.reference,
    summary:
      nextIds.length > 0
        ? `${staff.name} assigned ${ticket.reference} to ${joinStaffNames(names)}`
        : `${staff.name} unassigned ${ticket.reference}`,
    actor: { kind: "staff", id: staff.id, name: staff.name },
    details: { assignees: names },
  });

  if (addedIds.length > 0) {
    const notice = assignmentNotice({
      actorName: staff.name,
      reference: ticket.reference,
      subject: ticket.subject,
      addedNames,
      allNames: names,
      kind: "ticket",
      previousCount: previous.size,
    });
    await notifyAssignees({
      userIds: addedIds,
      excludeUserIds: [staff.id],
      title: notice.title,
      body: notice.body,
      ticketId,
    });
  }

  await revalidateWorkdesk({ ticketId });
  redirect(`/admin/tickets/${ticketId}`);
}

export async function grantTicketAccessAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const ticketId = String(formData.get("ticketId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!ticketId || !userId) return;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });
  if (!target?.isActive || target.role !== "TECHNICIAN") return;

  try {
    await prisma.ticketAccessGrant.create({
      data: { ticketId, userId, grantedById: staff.id },
    });
  } catch {
    return;
  }

  const granted = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  await recordWorkdeskEvent({
    kind: "GRANT_ADDED",
    summary: `${staff.name} granted extra access to ${granted?.name ?? "a technician"}`,
    ticketId,
    actorStaffId: staff.id,
  });
  await recordTicketAudit({
    action: "ticket.access_granted",
    ticketId,
    ticketReference: ticket.reference,
    summary: `${staff.name} granted extra access on ${ticket.reference} to ${granted?.name ?? "a technician"}`,
    actor: { kind: "staff", id: staff.id, name: staff.name },
    details: { grantedTo: granted?.name ?? userId },
  });
  const grantedNotice = accessGrantNotice({
    actorName: staff.name,
    grantedName: granted?.name ?? "a technician",
    reference: ticket.reference,
    subject: ticket.subject,
  });
  await notifyAssignee({
    userId,
    title: grantedNotice.title,
    body: grantedNotice.body,
    ticketId,
  });
  await revalidateWorkdesk({ ticketId });
  redirect(`/admin/tickets/${ticketId}`);
}

export async function revokeTicketAccessAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const grantId = String(formData.get("grantId") ?? "");
  const ticketId = String(formData.get("ticketId") ?? "");
  if (!grantId || !ticketId) return;

  const grant = await prisma.ticketAccessGrant.findUnique({
    where: { id: grantId },
    include: {
      user: { select: { name: true } },
      ticket: { select: { reference: true } },
    },
  });
  if (!grant) return;
  await prisma.ticketAccessGrant.delete({ where: { id: grantId } });
  await recordWorkdeskEvent({
    kind: "GRANT_REMOVED",
    summary: `${staff.name} removed extra access for ${grant.user.name}`,
    ticketId,
    actorStaffId: staff.id,
  });
  await recordTicketAudit({
    action: "ticket.access_revoked",
    ticketId,
    ticketReference: grant.ticket.reference,
    summary: `${staff.name} removed extra access on ${grant.ticket.reference} for ${grant.user.name}`,
    actor: { kind: "staff", id: staff.id, name: staff.name },
    details: { revokedFrom: grant.user.name },
  });
  await revalidateWorkdesk({ ticketId });
  redirect(`/admin/tickets/${ticketId}`);
}

export async function updateTicketDetailsAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const ticketId = String(formData.get("ticketId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "General");
  const customerId = String(formData.get("customerId") ?? "");
  if (!ticketId || subject.length < 3 || !customerId) return;

  const category = (TICKET_CATEGORIES as readonly string[]).includes(categoryRaw)
    ? categoryRaw
    : "General";

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { id: true, isActive: true },
  });
  if (!customer) return;
  if (!customer.isActive && customerId !== ticket.customerId) return;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { subject: subject.slice(0, 200), category, customerId },
  });

  const changes: string[] = [];
  if (ticket.subject !== subject) changes.push("subject");
  if (ticket.category !== category) changes.push("category");
  if (ticket.customerId !== customerId) changes.push("customer");
  if (changes.length > 0) {
    await recordWorkdeskEvent({
      kind: "NOTE",
      summary: `${staff.name} updated the ${changes.join(", ")}`,
      ticketId,
      actorStaffId: staff.id,
    });
    await recordTicketAudit({
      action: "ticket.updated",
      ticketId,
      ticketReference: ticket.reference,
      summary: `${staff.name} updated ${ticket.reference} ${changes.join(", ")}`,
      actor: { kind: "staff", id: staff.id, name: staff.name },
      details: { fields: changes },
    });
  }

  await revalidateWorkdesk({ ticketId });
  redirect(`/admin/tickets/${ticketId}`);
}

export async function deleteTicketAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const ticketId = String(formData.get("ticketId") ?? "");
  if (!ticketId) return;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      reference: true,
      subject: true,
      status: true,
      priority: true,
    },
  });
  if (!ticket) return;

  await recordTicketAudit({
    action: "ticket.deleted",
    ticketId: ticket.id,
    ticketReference: ticket.reference,
    summary: `${staff.name} deleted ${ticket.reference}`,
    actor: { kind: "staff", id: staff.id, name: staff.name },
    details: {
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
    },
  });

  await prisma.workdeskNotification.deleteMany({ where: { ticketId } });
  await prisma.ticket.delete({ where: { id: ticketId } });

  await revalidateWorkdesk({ ticketId, flash: "deleted" });
  redirect("/admin/tickets");
}

export async function notifyTicketStaffAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();
  const ticketId = String(formData.get("ticketId") ?? "");
  if (!ticketId) return;

  const result = await sendWorkdeskReminder({ actor: staff, ticketId });
  if (result.status === "missing") return;
  if (result.status === "none") {
    redirect(`/admin/tickets/${ticketId}?notify=none`);
  }

  await recordWorkdeskEvent({
    kind: "NOTE",
    summary: `${staff.name} emailed a reminder to ${joinStaffNames(result.names)}`,
    ticketId,
    actorStaffId: staff.id,
  });
  await recordTicketAudit({
    action: "ticket.notified",
    ticketId,
    ticketReference: result.reference,
    summary: `${staff.name} emailed a reminder on ${result.reference} to ${joinStaffNames(result.names)}`,
    actor: { kind: "staff", id: staff.id, name: staff.name },
    details: { channel: "email", recipients: result.names },
  });

  await revalidateWorkdesk({ ticketId, flash: "notified" });
  redirect(`/admin/tickets/${ticketId}`);
}

export async function markNotificationsReadAction(): Promise<void> {
  const staff = await workdeskAdminOrRedirect();
  await prisma.workdeskNotification.updateMany({
    where: { userId: staff.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin/notifications");
}
