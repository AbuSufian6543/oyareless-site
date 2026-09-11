"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import type { TaskStatus, TicketPriority } from "@/generated/prisma/client";
import { saveWorkdeskUploads } from "@/lib/workdesk/attachments";
import { workdeskAdminOrRedirect } from "@/lib/workdesk/access";
import { dateInputValue, parseDateInput } from "@/lib/workdesk/dates";
import { recordWorkdeskEvent } from "@/lib/workdesk/events";
import { recordTaskAudit } from "@/lib/workdesk/audit";
import { emailAdminInbox, notifyAssignees, notifyNewWork, sendWorkdeskReminder } from "@/lib/workdesk/notify";
import { assignmentNotice, joinStaffNames, taskChangeNotice } from "@/lib/workdesk/notice";
import { nextTaskReference } from "@/lib/workdesk/references";
import { revalidateWorkdesk } from "@/lib/workdesk/revalidate";
import { taskReturnPath, withQuery } from "@/lib/workdesk/return-path";
import { workdeskAdminMaySetTaskStatus } from "@/lib/workdesk/rules";
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/workdesk/labels";
import {
  activeAssigneeIds,
  assigneeIdsFrom,
  listTaskAssigneeIds,
  staffNamesFor,
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
    const names = await staffNamesFor(assignees);
    await recordWorkdeskEvent({
      kind: "ASSIGNED",
      summary: `${staff.name} assigned ${task.reference} to ${joinStaffNames(names)}`,
      taskId: task.id,
      actorStaffId: staff.id,
    });
  }

  await notifyNewWork({
    actorId: staff.id,
    actorName: staff.name,
    reference: task.reference,
    subject: task.title,
    kind: "task",
    assigneeIds: assignees,
    taskId: task.id,
  });

  await recordTaskAudit({
    action: "task.created",
    taskId: task.id,
    taskReference: task.reference,
    summary: `${staff.name} created ${task.reference}`,
    actor: staff,
    details: {
      title: task.title,
      priority: task.priority,
      assignees: assignees.length,
      attachments: files.length,
    },
  });

  await revalidateWorkdesk({ taskId: task.id, flash: "created" });
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
    await recordTaskAudit({
      action: "task.updated",
      taskId,
      taskReference: task.reference,
      summary: `${staff.name} updated details on ${task.reference}`,
      actor: staff,
      details: {
        titleChanged: task.title !== title,
        descriptionChanged: task.description !== description,
      },
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
    await recordTaskAudit({
      action: "task.status_changed",
      taskId,
      taskReference: task.reference,
      summary: `${staff.name} set ${task.reference} from ${TASK_STATUS_LABELS[task.status] ?? task.status} to ${TASK_STATUS_LABELS[status] ?? status}`,
      actor: staff,
      details: { from: task.status, to: status },
    });
  }
  if (task.priority !== priority) {
    await recordWorkdeskEvent({
      kind: "PRIORITY_CHANGED",
      summary: `${staff.name} set priority to ${PRIORITY_LABELS[priority] ?? priority}`,
      taskId,
      actorStaffId: staff.id,
    });
    await recordTaskAudit({
      action: "task.priority_changed",
      taskId,
      taskReference: task.reference,
      summary: `${staff.name} set ${task.reference} priority to ${PRIORITY_LABELS[priority] ?? priority}`,
      actor: staff,
      details: { from: task.priority, to: priority },
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
    await recordTaskAudit({
      action: "task.due_changed",
      taskId,
      taskReference: task.reference,
      summary: nextDueLabel
        ? `${staff.name} set ${task.reference} due date to ${nextDueLabel}`
        : `${staff.name} cleared the due date on ${task.reference}`,
      actor: staff,
      details: { from: previousDue || null, to: nextDueLabel || null },
    });
  }

  const added = [...next].filter((id) => !previous.has(id));
  const removed = [...previous].filter((id) => !next.has(id));
  const allNames = await staffNamesFor(assignees);
  const addedNames = await staffNamesFor(added);
  const nextTitle = title.slice(0, 200);
  const nextDescription = description.slice(0, 8000);
  const titleChanged = task.title !== nextTitle;
  const descriptionChanged = task.description !== nextDescription;
  const statusChanged = task.status !== status;
  const priorityChanged = task.priority !== priority;
  const dueChanged = previousDue !== nextDueLabel;
  const assigneesChanged = added.length > 0 || removed.length > 0;

  if (assigneesChanged) {
    await recordWorkdeskEvent({
      kind: previous.size > 0 ? "REASSIGNED" : "ASSIGNED",
      summary:
        assignees.length > 0
          ? `${staff.name} assigned ${task.reference} to ${joinStaffNames(allNames)}`
          : `${staff.name} unassigned ${task.reference}`,
      taskId,
      actorStaffId: staff.id,
    });
    await recordTaskAudit({
      action: "task.assigned",
      taskId,
      taskReference: task.reference,
      summary:
        assignees.length > 0
          ? `${staff.name} assigned ${task.reference} to ${joinStaffNames(allNames)}`
          : `${staff.name} unassigned ${task.reference}`,
      actor: staff,
      details: {
        assignees: allNames,
        added: added.length,
        removed: removed.length,
      },
    });
  }

  const changes: string[] = [];
  if (titleChanged) changes.push("updated the title");
  if (descriptionChanged) changes.push("updated the description");
  if (statusChanged) changes.push(`set status to ${TASK_STATUS_LABELS[status] ?? status}`);
  if (priorityChanged) changes.push(`set priority to ${PRIORITY_LABELS[priority] ?? priority}`);
  if (dueChanged) {
    changes.push(nextDueLabel ? `set the due date to ${nextDueLabel}` : "cleared the due date");
  }
  if (added.length > 0) changes.push(`assigned ${joinStaffNames(addedNames)}`);
  else if (removed.length > 0 && assignees.length > 0) changes.push("changed who is assigned");
  else if (removed.length > 0) changes.push("removed all assignees");

  if (changes.length > 0) {
    const changeNotice = taskChangeNotice({
      actorName: staff.name,
      reference: task.reference,
      changes,
    });
    const assignNotice =
      added.length > 0
        ? assignmentNotice({
            actorName: staff.name,
            reference: task.reference,
            subject: nextTitle,
            addedNames,
            allNames,
            kind: "task",
            previousCount: previous.size,
          })
        : null;
    const done = status === "COMPLETED" || status === "CLOSED";
    const mailTitle =
      assignNotice?.title ??
      (statusChanged && done
        ? `${task.reference} marked ${TASK_STATUS_LABELS[status] ?? status}`
        : changeNotice.title);
    const kind =
      statusChanged && done ? "RESOLVED" : added.length > 0 ? "ASSIGNMENT" : "UPDATE";
    const recipients = assignees.length > 0 ? assignees : [...previous];
    await notifyAssignees({
      userIds: recipients,
      excludeUserIds: [staff.id],
      title: mailTitle,
      body: changeNotice.body,
      kind,
      taskId,
    });
    if (assignees.length === 0) {
      await emailAdminInbox({
        title: mailTitle,
        detail: changeNotice.body,
        href: `/admin/tasks/${taskId}`,
        taskId,
      });
    }
  }

  await revalidateWorkdesk({ taskId });
  redirect(`/admin/tasks/${taskId}`);
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
    await recordTaskAudit({
      action: "task.noted",
      taskId,
      taskReference: task.reference,
      summary: `${staff.name} added a note on ${task.reference}`,
      actor: staff,
      details: { attachments: files.length },
    });
    await notifyAssignees({
      userIds: await listTaskAssigneeIds(taskId),
      excludeUserIds: [staff.id],
      title: `${task.reference} updated`,
      body: `${staff.name} added a note on ${task.title}`,
      kind: "UPDATE",
      taskId,
    });
  }

  await revalidateWorkdesk({ taskId });
  redirect(`/admin/tasks/${taskId}`);
}

export async function notifyTaskStaffAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;
  const returnTo = taskReturnPath(String(formData.get("returnTo") ?? ""), `/admin/tasks/${taskId}`);

  const result = await sendWorkdeskReminder({ actor: staff, taskId });
  if (result.status === "missing") return;
  if (result.status === "none") {
    redirect(withQuery(returnTo, "notify", "none"));
  }

  await recordWorkdeskEvent({
    kind: "NOTE",
    summary: `${staff.name} emailed a reminder to ${joinStaffNames(result.names)}`,
    taskId,
    actorStaffId: staff.id,
  });
  await recordTaskAudit({
    action: "task.notified",
    taskId,
    taskReference: result.reference,
    summary: `${staff.name} emailed a reminder on ${result.reference} to ${joinStaffNames(result.names)}`,
    actor: staff,
    details: { channel: "email", recipients: result.names },
  });

  await revalidateWorkdesk({ taskId, flash: "notified" });
  redirect(returnTo);
}

export async function deleteTaskAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();

  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;

  const task = await prisma.internalTask.findUnique({
    where: { id: taskId },
    select: { id: true, reference: true, title: true, status: true, priority: true },
  });
  if (!task) return;

  await recordTaskAudit({
    action: "task.deleted",
    taskId: task.id,
    taskReference: task.reference,
    summary: `${staff.name} deleted ${task.reference}`,
    actor: staff,
    details: {
      title: task.title,
      status: task.status,
      priority: task.priority,
    },
  });

  await prisma.workdeskNotification.deleteMany({ where: { taskId } });
  await prisma.internalTask.delete({ where: { id: taskId } });

  await revalidateWorkdesk({ taskId, flash: "deleted" });
  redirect(taskReturnPath(String(formData.get("returnTo") ?? "")));
}
