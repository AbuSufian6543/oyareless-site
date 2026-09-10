import "server-only";

import type { Role, WorkdeskNotificationKind } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { workdeskHref } from "@/lib/workdesk/access";
import { listTaskAssigneeIds, listTicketAssigneeIds } from "@/lib/workdesk/staff";

const WORKDESK_MANAGER_ROLES = ["EDITOR", "ADMIN", "SUPERADMIN"] as const;

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
  const href = `${env.siteUrl}${workdeskHref(input.role, input)}`;
  await sendMail({
    to: input.to,
    subject: input.title,
    html: emailLayout(
      input.title,
      `<p style="margin:0 0 16px;font-size:14px;color:#3c4e63;line-height:1.6;">Hello ${escapeHtml(input.name)},</p>
       <p style="margin:0 0 16px;font-size:14px;color:#3c4e63;line-height:1.6;">${escapeHtml(input.detail)}</p>
       <p style="margin:0;"><a href="${escapeHtml(href)}" style="color:#0a5fae;">Open in WirelessCom</a></p>`,
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
       <p style="margin:0;"><a href="${escapeHtml(`${env.siteUrl}${input.href}`)}" style="color:#0a5fae;">Review in admin</a></p>`,
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
