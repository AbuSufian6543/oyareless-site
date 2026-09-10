"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { hashToken, randomToken } from "@/lib/crypto";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import { hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import type { TicketPriority, TicketStatus } from "@/generated/prisma/client";
import { saveWorkdeskUploads } from "@/lib/workdesk/attachments";
import { workdeskAdminOrRedirect } from "@/lib/workdesk/access";
import { recordWorkdeskEvent } from "@/lib/workdesk/events";
import { notifyAssignee } from "@/lib/workdesk/notify";
import { nextTicketReference } from "@/lib/workdesk/references";
import { workdeskAdminMaySetTicketStatus } from "@/lib/workdesk/rules";
import { PRIORITY_LABELS, TICKET_CATEGORIES, TICKET_STATUS_LABELS } from "@/lib/workdesk/labels";

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

  const url = `${env.siteUrl}/portal/accept?token=${token}`;
  await sendMail({
    to: email,
    subject: "Your WirelessCom customer portal invite",
    html: `<p>Hello ${name},</p><p>An account was created for you on the WirelessCom.Ca customer portal.</p><p><a href="${url}">Choose a password</a></p><p>This link expires in 7 days.</p>`,
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
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
  if (!customerId || subject.length < 3 || body.length < 5) {
    redirect("/admin/tickets?error=invalid");
  }

  let assigneeId = assignedToId;
  if (assigneeId) {
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { isActive: true, role: true },
    });
    if (!assignee?.isActive || assignee.role === "VIEWER") assigneeId = null;
  }

  const ticket = await prisma.ticket.create({
    data: {
      reference: await nextTicketReference(),
      subject: subject.slice(0, 200),
      customerId,
      priority: ["LOW", "NORMAL", "HIGH", "EMERGENCY"].includes(priority)
        ? priority
        : "NORMAL",
      assignedToId: assigneeId,
      status: assigneeId ? "OPEN" : "NEW",
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

  if (assigneeId) {
    await recordWorkdeskEvent({
      kind: "ASSIGNED",
      summary: `${staff.name} assigned ${ticket.reference}`,
      ticketId: ticket.id,
      actorStaffId: staff.id,
    });
    await notifyAssignee({
      userId: assigneeId,
      title: `Ticket ${ticket.reference} assigned to you`,
      body: ticket.subject,
      ticketId: ticket.id,
    });
  }

  revalidatePath("/admin/tickets");
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

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/portal/tickets");
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

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
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
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
}

export async function assignTicketAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const ticketId = String(formData.get("ticketId") ?? "");
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
  if (!ticketId) return;

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return;
  if (ticket.assignedToId === assignedToId) return;

  if (assignedToId) {
    const assignee = await prisma.user.findUnique({
      where: { id: assignedToId },
      select: { isActive: true, role: true },
    });
    if (!assignee?.isActive || assignee.role === "VIEWER") return;
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      assignedToId,
      status: assignedToId && ticket.status === "NEW" ? "OPEN" : ticket.status,
    },
  });

  const assignee = assignedToId
    ? await prisma.user.findUnique({ where: { id: assignedToId }, select: { name: true } })
    : null;

  await recordWorkdeskEvent({
    kind: ticket.assignedToId ? "REASSIGNED" : "ASSIGNED",
    summary: assignedToId
      ? `${staff.name} assigned the ticket to ${assignee?.name ?? "a technician"}`
      : `${staff.name} unassigned the ticket`,
    ticketId,
    actorStaffId: staff.id,
  });

  if (assignedToId) {
    await notifyAssignee({
      userId: assignedToId,
      title: `Ticket ${ticket.reference} assigned to you`,
      body: ticket.subject,
      ticketId,
    });
  }

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
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
  await notifyAssignee({
    userId,
    title: `You can now work on ticket ${ticket.reference}`,
    body: ticket.subject,
    ticketId,
  });
  revalidatePath(`/admin/tickets/${ticketId}`);
}

export async function revokeTicketAccessAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const grantId = String(formData.get("grantId") ?? "");
  const ticketId = String(formData.get("ticketId") ?? "");
  if (!grantId || !ticketId) return;

  const grant = await prisma.ticketAccessGrant.findUnique({
    where: { id: grantId },
    include: { user: { select: { name: true } } },
  });
  if (!grant) return;
  await prisma.ticketAccessGrant.delete({ where: { id: grantId } });
  await recordWorkdeskEvent({
    kind: "GRANT_REMOVED",
    summary: `${staff.name} removed extra access for ${grant.user.name}`,
    ticketId,
    actorStaffId: staff.id,
  });
  revalidatePath(`/admin/tickets/${ticketId}`);
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
  }

  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath("/admin/tickets");
  revalidatePath("/portal/tickets");
}

export async function deleteTicketAction(formData: FormData): Promise<void> {
  await workdeskAdminOrRedirect();

  const ticketId = String(formData.get("ticketId") ?? "");
  if (!ticketId) return;

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) return;

  await prisma.workdeskNotification.deleteMany({ where: { ticketId } });
  await prisma.ticket.delete({ where: { id: ticketId } });

  revalidatePath("/admin/tickets");
  revalidatePath("/admin");
  revalidatePath("/tech");
  revalidatePath("/portal/tickets");
  redirect("/admin/tickets");
}

export async function markNotificationsReadAction(): Promise<void> {
  const staff = await workdeskAdminOrRedirect();
  await prisma.workdeskNotification.updateMany({
    where: { userId: staff.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/admin/notifications");
}
