"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { TaskStatus, TicketStatus } from "@/generated/prisma/client";
import { saveWorkdeskUploads } from "@/lib/workdesk/attachments";
import {
  assertTaskAccess,
  assertTicketAccess,
  handleWorkdeskAuth,
  technicianOrRedirect,
} from "@/lib/workdesk/access";
import { recordWorkdeskEvent } from "@/lib/workdesk/events";
import { recordTicketAudit } from "@/lib/workdesk/ticket-audit";
import { notifyWorkdeskUpdate } from "@/lib/workdesk/notify";
import { revalidateWorkdesk } from "@/lib/workdesk/revalidate";
import {
  technicianMaySetTaskStatus,
  technicianMaySetTicketStatus,
} from "@/lib/workdesk/rules";
import { TASK_STATUS_LABELS, TICKET_STATUS_LABELS } from "@/lib/workdesk/labels";

export async function techReplyTicketAction(formData: FormData): Promise<void> {
  const tech = await technicianOrRedirect();

  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const isInternal = formData.get("isInternal") === "on";
  if (!ticketId || body.length < 2) return;

  try {
    await assertTicketAccess(tech, ticketId);
  } catch (error) {
    handleWorkdeskAuth(error, "/tech");
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status === "CLOSED") return;

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId,
      body: body.slice(0, 8000),
      authorStaffId: tech.id,
      authorStaffName: tech.name,
      isInternal,
    },
  });

  const files = await saveWorkdeskUploads(formData);
  if (files.length > 0) {
    await prisma.ticketAttachment.createMany({
      data: files.map((file) => ({
        messageId: message.id,
        filename: file.filename.split("/").pop() ?? file.filename,
        url: file.url,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      })),
    });
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: isInternal
      ? {}
      : {
          status: ticket.status === "NEW" ? "IN_PROGRESS" : ticket.status,
          firstResponseAt: ticket.firstResponseAt ?? new Date(),
        },
  });

  await recordWorkdeskEvent({
    kind: isInternal ? "NOTE" : "MESSAGE",
    summary: isInternal
      ? `${tech.name} added an internal note`
      : `${tech.name} replied to the customer`,
    ticketId,
    actorStaffId: tech.id,
  });
  if (files.length > 0) {
    await recordWorkdeskEvent({
      kind: "ATTACHMENT",
      summary: `${tech.name} attached ${files.length} file${files.length === 1 ? "" : "s"}`,
      ticketId,
      actorStaffId: tech.id,
    });
  }
  await recordTicketAudit({
    action: isInternal ? "ticket.noted" : "ticket.replied",
    ticketId,
    ticketReference: ticket.reference,
    summary: isInternal
      ? `${tech.name} added an internal note on ${ticket.reference}`
      : `${tech.name} replied on ${ticket.reference}`,
    actor: { kind: "staff", id: tech.id, name: tech.name },
    details: { internal: isInternal, attachments: files.length },
  });

  await notifyWorkdeskUpdate({
    actorId: tech.id,
    title: `${ticket.reference} updated`,
    body: `${tech.name} ${isInternal ? "added a note" : "replied"} on ${ticket.subject}`,
    kind: "UPDATE",
    ticketId,
  });

  await revalidateWorkdesk({ ticketId });
  redirect(`/tech/tickets/${ticketId}`);
}

export async function techUpdateTicketStatusAction(formData: FormData): Promise<void> {
  const tech = await technicianOrRedirect();

  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "") as TicketStatus;
  if (!ticketId || !technicianMaySetTicketStatus(status)) return;

  try {
    await assertTicketAccess(tech, ticketId);
  } catch (error) {
    handleWorkdeskAuth(error, "/tech");
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket || ticket.status === "CLOSED") return;

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status,
      resolvedAt: status === "RESOLVED" ? new Date() : ticket.resolvedAt,
    },
  });

  await recordWorkdeskEvent({
    kind: status === "RESOLVED" ? "COMPLETED" : "STATUS_CHANGED",
    summary: `${tech.name} set status to ${TICKET_STATUS_LABELS[status] ?? status}`,
    ticketId,
    actorStaffId: tech.id,
  });
  await recordTicketAudit({
    action: "ticket.status_changed",
    ticketId,
    ticketReference: ticket.reference,
    summary: `${tech.name} set ${ticket.reference} to ${TICKET_STATUS_LABELS[status] ?? status}`,
    actor: { kind: "staff", id: tech.id, name: tech.name },
    details: { from: ticket.status, to: status },
  });

  await notifyWorkdeskUpdate({
    actorId: tech.id,
    title:
      status === "RESOLVED"
        ? `${ticket.reference} marked resolved`
        : `${ticket.reference} status updated`,
    body: `${tech.name} set ${ticket.reference} to ${TICKET_STATUS_LABELS[status] ?? status}`,
    kind: status === "RESOLVED" ? "RESOLVED" : "UPDATE",
    ticketId,
  });

  await revalidateWorkdesk({ ticketId });
  redirect(`/tech/tickets/${ticketId}`);
}

export async function techAddTaskNoteAction(formData: FormData): Promise<void> {
  const tech = await technicianOrRedirect();

  const taskId = String(formData.get("taskId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!taskId || body.length < 2) return;

  try {
    await assertTaskAccess(tech, taskId);
  } catch (error) {
    handleWorkdeskAuth(error, "/tech");
  }

  const task = await prisma.internalTask.findUnique({ where: { id: taskId } });
  if (!task || task.status === "CLOSED") return;

  const note = await prisma.internalTaskNote.create({
    data: {
      taskId,
      authorStaffId: tech.id,
      authorName: tech.name,
      body: body.slice(0, 8000),
    },
  });

  const files = await saveWorkdeskUploads(formData);
  if (files.length > 0) {
    await prisma.internalTaskAttachment.createMany({
      data: files.map((file) => ({
        taskId,
        noteId: note.id,
        uploadedById: tech.id,
        filename: file.filename.split("/").pop() ?? file.filename,
        url: file.url,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      })),
    });
  }

  await recordWorkdeskEvent({
    kind: "NOTE",
    summary: `${tech.name} added a note`,
    taskId,
    actorStaffId: tech.id,
  });

  await notifyWorkdeskUpdate({
    actorId: tech.id,
    title: `${task.reference} updated`,
    body: `${tech.name} added a note on ${task.title}`,
    kind: "UPDATE",
    taskId,
  });

  await revalidateWorkdesk({ taskId });
  redirect(`/tech/tasks/${taskId}`);
}

export async function techUpdateTaskStatusAction(formData: FormData): Promise<void> {
  const tech = await technicianOrRedirect();

  const taskId = String(formData.get("taskId") ?? "");
  const status = String(formData.get("status") ?? "") as TaskStatus;
  if (!taskId || !technicianMaySetTaskStatus(status)) return;

  try {
    await assertTaskAccess(tech, taskId);
  } catch (error) {
    handleWorkdeskAuth(error, "/tech");
  }

  const task = await prisma.internalTask.findUnique({ where: { id: taskId } });
  if (!task || task.status === "CLOSED") return;

  await prisma.internalTask.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : task.completedAt,
    },
  });

  await recordWorkdeskEvent({
    kind: status === "COMPLETED" ? "COMPLETED" : "STATUS_CHANGED",
    summary: `${tech.name} set status to ${TASK_STATUS_LABELS[status] ?? status}`,
    taskId,
    actorStaffId: tech.id,
  });

  await notifyWorkdeskUpdate({
    actorId: tech.id,
    title:
      status === "COMPLETED"
        ? `${task.reference} marked completed`
        : `${task.reference} status updated`,
    body: `${tech.name} set ${task.reference} to ${TASK_STATUS_LABELS[status] ?? status}`,
    kind: status === "COMPLETED" ? "RESOLVED" : "UPDATE",
    taskId,
  });

  await revalidateWorkdesk({ taskId });
  redirect(`/tech/tasks/${taskId}`);
}

export async function techMarkNotificationsReadAction(): Promise<void> {
  const tech = await technicianOrRedirect();
  await prisma.workdeskNotification.updateMany({
    where: { userId: tech.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/tech/notifications");
}
