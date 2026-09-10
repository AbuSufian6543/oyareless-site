import "server-only";

import type { Role, WorkdeskNotificationKind } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { workdeskHref } from "@/lib/workdesk/access";

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
  }).catch(() => undefined);
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
  }).catch(() => undefined);
}

export async function notifyAdminsOfTechnicianUpdate(input: {
  actorId: string;
  title: string;
  body: string;
  kind: WorkdeskNotificationKind;
  ticketId?: string;
  taskId?: string;
}): Promise<void> {
  const admins = await prisma.user.findMany({
    where: {
      isActive: true,
      id: { not: input.actorId },
      role: { in: ["EDITOR", "ADMIN", "SUPERADMIN"] },
    },
    select: { id: true },
  });
  await createWorkdeskNotifications({
    userIds: admins.map((admin) => admin.id),
    kind: input.kind,
    title: input.title,
    body: input.body,
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
}

export async function notifyAssignee(input: {
  userId: string;
  title: string;
  body: string;
  ticketId?: string;
  taskId?: string;
  kind?: "ASSIGNMENT" | "UPDATE" | "RESOLVED" | "MESSAGE";
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });
  if (!user?.isActive) return;
  await createWorkdeskNotifications({
    userIds: [user.id],
    kind: input.kind ?? "ASSIGNMENT",
    title: input.title,
    body: input.body,
    ticketId: input.ticketId,
    taskId: input.taskId,
  });
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

export async function unreadNotificationCount(userId: string): Promise<number> {
  return prisma.workdeskNotification.count({
    where: { userId, readAt: null },
  });
}
