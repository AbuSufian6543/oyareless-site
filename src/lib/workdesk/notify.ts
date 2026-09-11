import "server-only";

import type { Role, WorkdeskNotificationKind } from "@/generated/prisma/client";
import { emailActionLink, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { publicUrl } from "@/lib/public-url";
import { workdeskHref } from "@/lib/workdesk/access";
import {
  assignmentNotice,
  reminderNotice,
  unassignedCreateNotice,
} from "@/lib/workdesk/notice";
import { WORKDESK_MANAGER_ROLES } from "@/lib/workdesk/rules";
import {
  listTaskAssigneeIds,
  listTicketAssigneeIds,
  staffNamesFor,
} from "@/lib/workdesk/staff";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailLayout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#0a2a4e;padding:20px 28px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;">WirelessCom<span style="color:#6fc04a;">.Ca</span> Inc.</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 18px;font-size:19px;color:#0a2a4e;">${escapeHtml(title)}</h1>
              ${body}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function createWorkdeskNotifications(input: {
  userIds: string[];
  kind: WorkdeskNotificationKind;
  title: string;
  body: string;
  ticketId?: string;
  taskId?: string;
}): Promise<void> {
  const unique = [...new Set(input.userIds.filter(Boolean))];
  if (unique.length === 0) return;
  await prisma.workdeskNotification.createMany({
    data: unique.map((userId) => ({
      userId,
      kind: input.kind,
      title: input.title.slice(0, 200),
      body: input.body.slice(0, 500),
      ticketId: input.ticketId,
      taskId: input.taskId,
    })),
  });
}

export async function emailStaffAssignment(input: {
  to: string;
  name: string;
  role: Role;
  title: string;
  detail: string;
  ticketId?: string;
  taskId?: string;
}): Promise<void> {
  const href = publicUrl(workdeskHref(input.role, input));
  const ctaLabel = input.taskId ? "See task" : input.ticketId ? "Open ticket" : "Open admin";
  await sendMail({
    to: input.to,
    subject: input.title,
    html: emailLayout(
      input.title,
      `<p style="margin:0 0 16px;font-size:14px;color:#3c4e63;line-height:1.6;">Hello ${escapeHtml(input.name)},</p>
       <p style="margin:0 0 16px;font-size:14px;color:#3c4e63;line-height:1.6;">${escapeHtml(input.detail)}</p>
       ${emailActionLink(href, ctaLabel)}`,
    ),
  }).catch((error) => {
    console.error("[workdesk] assignment email failed:", error);
  });
}

export async function emailAdminInbox(input: {
  title: string;
  detail: string;
  href: string;
}): Promise<void> {
  await sendMail({
    subject: input.title,
    html: emailLayout(
      input.title,
      `<p style="margin:0 0 16px;font-size:14px;color:#3c4e63;line-height:1.6;">${escapeHtml(input.detail)}</p>
       ${emailActionLink(publicUrl(input.href), "Open admin")}`,
    ),
  }).catch((error) => {
    console.error("[workdesk] admin inbox email failed:", error);
  });
}

export async function notifyStaff(input: {
  userIds: string[];
  excludeUserIds?: string[];
  title: string;
  body: string;
  kind?: WorkdeskNotificationKind;
  ticketId?: string;
  taskId?: string;
}): Promise<void> {
  try {
    const excluded = new Set((input.excludeUserIds ?? []).filter(Boolean));
    const requested = [...new Set(input.userIds.filter((id) => id && !excluded.has(id)))];
    if (requested.length === 0) return;

    const users = await prisma.user.findMany({
      where: { id: { in: requested }, isActive: true },
      select: { id: true, email: true, name: true, role: true },
    });
    if (users.length === 0) return;

    try {
      await createWorkdeskNotifications({
        userIds: users.map((user) => user.id),
        kind: input.kind ?? "ASSIGNMENT",
        title: input.title,
        body: input.body,
        ticketId: input.ticketId,
        taskId: input.taskId,
      });
    } catch (error) {
      console.error("[workdesk] in-site notification failed:", error);
    }

    for (const user of users) {
      await emailStaffAssignment({
        to: user.email,
        name: user.name,
        role: user.role,
        title: input.title,
        detail: input.body,
        ticketId: input.ticketId,
        taskId: input.taskId,
      });
    }
  } catch (error) {
    console.error("[workdesk] staff notification failed:", error);
  }
}

export async function notifyAssignee(input: {
  userId: string;
  title: string;
  body: string;
  ticketId?: string;
  taskId?: string;
  kind?: WorkdeskNotificationKind;
}): Promise<void> {
  await notifyStaff({
    userIds: [input.userId],
    title: input.title,
    body: input.body,
    kind: input.kind ?? "ASSIGNMENT",
    ticketId: input.ticketId,
    taskId: input.taskId,
  });
}

export async function notifyAssignees(input: {
  userIds: string[];
  excludeUserIds?: string[];
  title: string;
  body: string;
  ticketId?: string;
  taskId?: string;
  kind?: WorkdeskNotificationKind;
}): Promise<void> {
  await notifyStaff({
    ...input,
    kind: input.kind ?? "ASSIGNMENT",
  });
}

function adminHref(input: { ticketId?: string; taskId?: string }): string {
  if (input.taskId) return `/admin/tasks/${input.taskId}`;
  if (input.ticketId) return `/admin/tickets/${input.ticketId}`;
  return "/admin";
}

/**
 * Email + in-site notice when a ticket or task is created.
 * Assignees always get mail (including the person who created it).
 * If nobody is assigned, other employees/admins are pinged so the item is not silent.
 * The office inbox also gets a copy, same as a customer opening a portal ticket.
 */
export async function notifyNewWork(input: {
  actorId: string;
  actorName: string;
  reference: string;
  subject: string;
  kind: "ticket" | "task";
  assigneeIds: string[];
  ticketId?: string;
  taskId?: string;
}): Promise<void> {
  const href = adminHref(input);

  if (input.assigneeIds.length > 0) {
    const names = await staffNamesFor(input.assigneeIds);
    const notice = assignmentNotice({
      actorName: input.actorName,
      reference: input.reference,
      subject: input.subject,
      addedNames: names,
      allNames: names,
      kind: input.kind,
      previousCount: 0,
    });
    await notifyStaff({
      userIds: input.assigneeIds,
      title: notice.title,
      body: notice.body,
      kind: "ASSIGNMENT",
      ticketId: input.ticketId,
      taskId: input.taskId,
    });
    await emailAdminInbox({
      title: notice.title,
      detail: notice.body,
      href,
    });
    return;
  }

  const notice = unassignedCreateNotice({
    actorName: input.actorName,
    reference: input.reference,
    subject: input.subject,
    kind: input.kind,
  });
  const managerIds = await listWorkdeskManagerIds(input.actorId);
  await notifyStaff({
    userIds: managerIds,
    title: notice.title,
    body: notice.body,
    kind: "ASSIGNMENT",
    ticketId: input.ticketId,
    taskId: input.taskId,
  });
  await emailAdminInbox({
    title: notice.title,
    detail: notice.body,
    href,
  });
}

async function listWorkdeskManagerIds(excludeUserId?: string): Promise<string[]> {
  const managers = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: [...WORKDESK_MANAGER_ROLES] },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { id: true },
  });
  return managers.map((manager) => manager.id);
}

/** In-site + personal email for managers and other assignees, plus the site notify inbox. */
export async function notifyWorkdeskUpdate(input: {
  actorId?: string;
  title: string;
  body: string;
  kind: WorkdeskNotificationKind;
  ticketId?: string;
  taskId?: string;
}): Promise<void> {
  try {
    const [managerIds, assigneeIds] = await Promise.all([
      listWorkdeskManagerIds(input.actorId),
      input.ticketId
        ? listTicketAssigneeIds(input.ticketId)
        : input.taskId
          ? listTaskAssigneeIds(input.taskId)
          : Promise.resolve([] as string[]),
    ]);

    await notifyStaff({
      userIds: [...managerIds, ...assigneeIds],
      excludeUserIds: input.actorId ? [input.actorId] : [],
      title: input.title,
      body: input.body,
      kind: input.kind,
      ticketId: input.ticketId,
      taskId: input.taskId,
    });

    await emailAdminInbox({
      title: input.title,
      detail: input.body,
      href: input.taskId
        ? `/admin/tasks/${input.taskId}`
        : `/admin/tickets/${input.ticketId ?? ""}`,
    });
  } catch (error) {
    console.error("[workdesk] update notification failed:", error);
  }
}

/** @deprecated Use notifyWorkdeskUpdate — kept so older imports keep working. */
export async function notifyAdminsOfTechnicianUpdate(input: {
  actorId: string;
  title: string;
  body: string;
  kind: WorkdeskNotificationKind;
  ticketId?: string;
  taskId?: string;
}): Promise<void> {
  await notifyWorkdeskUpdate(input);
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  return prisma.workdeskNotification.count({
    where: { userId, readAt: null },
  });
}

export type WorkdeskReminderResult =
  | { status: "sent"; names: string[]; reference: string }
  | { status: "none" }
  | { status: "missing" };

/** Manual ping of everyone currently on a ticket or task (in-site + email). */
export async function sendWorkdeskReminder(input: {
  actor: { id: string; name: string };
  ticketId?: string;
  taskId?: string;
}): Promise<WorkdeskReminderResult> {
  if (input.ticketId) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: input.ticketId },
      select: { id: true, reference: true, subject: true },
    });
    if (!ticket) return { status: "missing" };
    const userIds = await listTicketAssigneeIds(ticket.id);
    const names = await staffNamesFor(userIds);
    if (userIds.length === 0) return { status: "none" };
    const notice = reminderNotice({
      actorName: input.actor.name,
      reference: ticket.reference,
      subject: ticket.subject,
      assigneeNames: names,
      kind: "ticket",
    });
    await notifyStaff({
      userIds,
      title: notice.title,
      body: notice.body,
      kind: "UPDATE",
      ticketId: ticket.id,
    });
    return { status: "sent", names, reference: ticket.reference };
  }

  if (input.taskId) {
    const task = await prisma.internalTask.findUnique({
      where: { id: input.taskId },
      select: { id: true, reference: true, title: true },
    });
    if (!task) return { status: "missing" };
    const userIds = await listTaskAssigneeIds(task.id);
    const names = await staffNamesFor(userIds);
    if (userIds.length === 0) return { status: "none" };
    const notice = reminderNotice({
      actorName: input.actor.name,
      reference: task.reference,
      subject: task.title,
      assigneeNames: names,
      kind: "task",
    });
    await notifyStaff({
      userIds,
      title: notice.title,
      body: notice.body,
      kind: "UPDATE",
      taskId: task.id,
    });
    return { status: "sent", names, reference: task.reference };
  }

  return { status: "missing" };
}
