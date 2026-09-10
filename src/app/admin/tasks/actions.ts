"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { TaskStatus, TicketPriority } from "@/generated/prisma/client";
import { saveWorkdeskUploads } from "@/lib/workdesk/attachments";
import { workdeskAdminOrRedirect } from "@/lib/workdesk/access";
import { dateInputValue, parseDateInput } from "@/lib/workdesk/dates";
import { recordWorkdeskEvent } from "@/lib/workdesk/events";
import { notifyAssignees } from "@/lib/workdesk/notify";
import { nextTaskReference } from "@/lib/workdesk/references";
import { revalidateWorkdesk } from "@/lib/workdesk/revalidate";
import { workdeskAdminMaySetTaskStatus } from "@/lib/workdesk/rules";
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/workdesk/labels";
import {
  activeAssigneeIds,
  assigneeIdsFrom,
  listTaskAssigneeIds,
} from "@/lib/workdesk/staff";

export async function createTaskAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priority = String(formData.get("priority") ?? "NORMAL") as TicketPriority;
  const dueRaw = String(formData.get("dueAt") ?? "").trim();
  const assignees = await activeAssigneeIds(assigneeIdsFrom(formData));
  if (title.length < 3) redirect("/admin/tasks/new?error=invalid");

  const task = await prisma.internalTask.create({
    data: {
      reference: await nextTaskReference(),
      title: title.slice(0, 200),
      description: description.slice(0, 8000),
      priority: ["LOW", "NORMAL", "HIGH", "EMERGENCY"].includes(priority)
        ? priority
        : "NORMAL",
      dueAt: parseDateInput(dueRaw),
      createdById: staff.id,
      assignees: {
        create: assignees.map((userId) => ({ userId })),
      },
    },
  });

  const files = await saveWorkdeskUploads(formData);
  if (files.length > 0) {
    await prisma.internalTaskAttachment.createMany({
      data: files.map((file) => ({
        taskId: task.id,
        uploadedById: staff.id,
        filename: file.filename.split("/").pop() ?? file.filename,
        url: file.url,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      })),
    });
  }

  await recordWorkdeskEvent({
    kind: "CREATED",
    summary: `${staff.name} created ${task.reference}`,
    taskId: task.id,
    actorStaffId: staff.id,
  });

  if (assignees.length > 0) {
    await recordWorkdeskEvent({
      kind: "ASSIGNED",
      summary: `${staff.name} assigned ${task.reference}`,
      taskId: task.id,
      actorStaffId: staff.id,
    });
    await notifyAssignees({
      userIds: assignees,
      excludeUserIds: [staff.id],
      title: `Task ${task.reference} assigned to you`,
      body: task.title,
      taskId: task.id,
    });
  }

  revalidateWorkdesk({ taskId: task.id });
  redirect(`/admin/tasks/${task.id}`);
}

export async function updateTaskAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const taskId = String(formData.get("taskId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "") as TaskStatus;
  const priority = String(formData.get("priority") ?? "") as TicketPriority;
  const dueRaw = String(formData.get("dueAt") ?? "").trim();
  const assignees = await activeAssigneeIds(assigneeIdsFrom(formData));
  if (!taskId || !workdeskAdminMaySetTaskStatus(status)) return;
  if (title.length < 3) return;

  const task = await prisma.internalTask.findUnique({
    where: { id: taskId },
    include: { assignees: true },
  });
  if (!task) return;

  const previous = new Set(task.assignees.map((row) => row.userId));
  const next = new Set(assignees);
  const nextDue = parseDateInput(dueRaw);
  const previousDue = task.dueAt ? dateInputValue(task.dueAt) : "";
  const nextDueLabel = nextDue ? dateInputValue(nextDue) : "";

  await prisma.internalTask.update({
    where: { id: taskId },
    data: {
      title: title.slice(0, 200),
      description: description.slice(0, 8000),
      status,
      priority: ["LOW", "NORMAL", "HIGH", "EMERGENCY"].includes(priority)
        ? priority
        : task.priority,
      dueAt: nextDue,
      completedAt: status === "COMPLETED" ? new Date() : task.completedAt,
      closedAt: status === "CLOSED" ? new Date() : status === "OPEN" ? null : task.closedAt,
    },
  });

  await prisma.internalTaskAssignee.deleteMany({ where: { taskId } });
  if (assignees.length > 0) {
    await prisma.internalTaskAssignee.createMany({
      data: assignees.map((userId) => ({ taskId, userId })),
    });
  }

  if (task.title !== title || task.description !== description) {
    await recordWorkdeskEvent({
      kind: "NOTE",
      summary: `${staff.name} updated the task details`,
      taskId,
      actorStaffId: staff.id,
    });
  }
  if (task.status !== status) {
    await recordWorkdeskEvent({
      kind:
        status === "CLOSED"
          ? "CLOSED"
          : status === "COMPLETED"
            ? "COMPLETED"
            : "STATUS_CHANGED",
      summary: `${staff.name} set status to ${TASK_STATUS_LABELS[status] ?? status}`,
      taskId,
      actorStaffId: staff.id,
    });
  }
  if (task.priority !== priority) {
    await recordWorkdeskEvent({
      kind: "PRIORITY_CHANGED",
      summary: `${staff.name} set priority to ${PRIORITY_LABELS[priority] ?? priority}`,
      taskId,
      actorStaffId: staff.id,
    });
  }
  if (previousDue !== nextDueLabel) {
    await recordWorkdeskEvent({
      kind: "DUE_DATE_CHANGED",
      summary: nextDueLabel
        ? `${staff.name} set the due date to ${nextDueLabel}`
        : `${staff.name} cleared the due date`,
      taskId,
      actorStaffId: staff.id,
    });
  }

  const added = [...next].filter((id) => !previous.has(id));
  await notifyAssignees({
    userIds: added,
    excludeUserIds: [staff.id],
    title: `Task ${task.reference} assigned to you`,
    body: task.title,
    taskId,
  });
  if (added.length > 0 || [...previous].some((id) => !next.has(id))) {
    await recordWorkdeskEvent({
      kind: "REASSIGNED",
      summary: `${staff.name} updated assignees`,
      taskId,
      actorStaffId: staff.id,
    });
  }
  if (task.status !== status) {
    await notifyAssignees({
      userIds: assignees.filter((id) => !added.includes(id)),
      excludeUserIds: [staff.id],
      title:
        status === "COMPLETED" || status === "CLOSED"
          ? `${task.reference} marked ${TASK_STATUS_LABELS[status] ?? status}`
          : `${task.reference} status updated`,
      body: `${staff.name} set ${task.reference} to ${TASK_STATUS_LABELS[status] ?? status}`,
      kind: status === "COMPLETED" || status === "CLOSED" ? "RESOLVED" : "UPDATE",
      taskId,
    });
  }

  revalidateWorkdesk({ taskId });
}

export async function addTaskNoteAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const taskId = String(formData.get("taskId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!taskId || body.length < 2) return;

  const note = await prisma.internalTaskNote.create({
    data: {
      taskId,
      authorStaffId: staff.id,
      authorName: staff.name,
      body: body.slice(0, 8000),
    },
  });

  const files = await saveWorkdeskUploads(formData);
  if (files.length > 0) {
    await prisma.internalTaskAttachment.createMany({
      data: files.map((file) => ({
        taskId,
        noteId: note.id,
        uploadedById: staff.id,
        filename: file.filename.split("/").pop() ?? file.filename,
        url: file.url,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
      })),
    });
  }

  await recordWorkdeskEvent({
    kind: "NOTE",
    summary: `${staff.name} added a note`,
    taskId,
    actorStaffId: staff.id,
  });

  const task = await prisma.internalTask.findUnique({
    where: { id: taskId },
    select: { reference: true, title: true },
  });
  if (task) {
    await notifyAssignees({
      userIds: await listTaskAssigneeIds(taskId),
      excludeUserIds: [staff.id],
      title: `${task.reference} updated`,
      body: `${staff.name} added a note on ${task.title}`,
      kind: "UPDATE",
      taskId,
    });
  }

  revalidateWorkdesk({ taskId });
}

export async function deleteTaskAction(formData: FormData): Promise<void> {
  await workdeskAdminOrRedirect();

  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;

  const task = await prisma.internalTask.findUnique({
    where: { id: taskId },
    select: { id: true },
  });
  if (!task) return;

  await prisma.workdeskNotification.deleteMany({ where: { taskId } });
  await prisma.internalTask.delete({ where: { id: taskId } });

  revalidateWorkdesk({ taskId });
  redirect("/admin/tasks");
}
