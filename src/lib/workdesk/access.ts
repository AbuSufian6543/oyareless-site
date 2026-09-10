import "server-only";

import { redirect } from "next/navigation";

import type { Role } from "@/generated/prisma/client";
import {
  AuthError,
  getCurrentUser,
  hasRole,
  type SessionUser,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  technicianCanSeeTask,
  technicianCanSeeTicket,
} from "@/lib/workdesk/rules";

export {
  ADMIN_TASK_STATUSES,
  ADMIN_TICKET_STATUSES,
  TECHNICIAN_TASK_STATUSES,
  TECHNICIAN_TICKET_STATUSES,
  technicianCanSeeTask,
  technicianCanSeeTicket,
  technicianMaySetTaskStatus,
  technicianMaySetTicketStatus,
  workdeskAdminMaySetTaskStatus,
  workdeskAdminMaySetTicketStatus,
} from "@/lib/workdesk/rules";

export function isTechnician(user: SessionUser | null): boolean {
  return user?.role === "TECHNICIAN";
}

export function isWorkdeskAdmin(user: SessionUser | null): boolean {
  return hasRole(user, "EDITOR");
}

export function canManageWorkdesk(user: SessionUser | null): boolean {
  return isWorkdeskAdmin(user) || isTechnician(user);
}

export function staffHomePath(user: {
  role: Role;
  mustChangePassword?: boolean;
}): string {
  if (user.role === "TECHNICIAN") {
    return user.mustChangePassword ? "/tech/account?change=1" : "/tech";
  }
  if (user.role === "VIEWER") return "/";
  return user.mustChangePassword ? "/admin/account?change=1" : "/admin";
}

export function staffAccountPath(role: Role): string {
  return role === "TECHNICIAN" ? "/tech/account" : "/admin/account";
}

export function workdeskHref(
  role: Role,
  resource: { ticketId?: string | null; taskId?: string | null },
): string {
  const root = role === "TECHNICIAN" ? "/tech" : "/admin";
  if (resource.taskId) return `${root}/tasks/${resource.taskId}`;
  if (resource.ticketId) return `${root}/tickets/${resource.ticketId}`;
  return root;
}

export async function requireWorkdeskAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHENTICATED");
  if (!isWorkdeskAdmin(user)) throw new AuthError("FORBIDDEN");
  return user;
}

export async function requireTechnician(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHENTICATED");
  if (!isTechnician(user)) throw new AuthError("FORBIDDEN");
  return user;
}

export function technicianTicketWhere(userId: string) {
  return {
    OR: [
      { assignedToId: userId },
      { assignees: { some: { userId } } },
      { accessGrants: { some: { userId } } },
    ],
  };
}

export function technicianTaskWhere(userId: string) {
  return { assignees: { some: { userId } } };
}

export async function requireWorkdeskStaff(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("UNAUTHENTICATED");
  if (!canManageWorkdesk(user)) throw new AuthError("FORBIDDEN");
  return user;
}

export async function assertTicketAccess(
  user: SessionUser,
  ticketId: string,
): Promise<{
  id: string;
  assignedToId: string | null;
  customerId: string;
  status: string;
  reference: string;
  subject: string;
}> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      assignedToId: true,
      customerId: true,
      status: true,
      reference: true,
      subject: true,
      assignees: { select: { userId: true } },
      accessGrants: { select: { userId: true } },
    },
  });
  if (!ticket) throw new AuthError("FORBIDDEN");
  if (isWorkdeskAdmin(user)) return ticket;
  if (
    isTechnician(user) &&
    technicianCanSeeTicket({
      userId: user.id,
      assignedToId: ticket.assignedToId,
      assigneeIds: ticket.assignees.map((row) => row.userId),
      grantUserIds: ticket.accessGrants.map((grant) => grant.userId),
    })
  ) {
    return ticket;
  }
  throw new AuthError("FORBIDDEN");
}

export async function assertTaskAccess(
  user: SessionUser,
  taskId: string,
): Promise<{
  id: string;
  reference: string;
  title: string;
  status: string;
}> {
  const task = await prisma.internalTask.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      reference: true,
      title: true,
      status: true,
      assignees: { select: { userId: true } },
    },
  });
  if (!task) throw new AuthError("FORBIDDEN");
  if (isWorkdeskAdmin(user)) return task;
  if (
    isTechnician(user) &&
    technicianCanSeeTask({
      userId: user.id,
      assigneeIds: task.assignees.map((row) => row.userId),
    })
  ) {
    return task;
  }
  throw new AuthError("FORBIDDEN");
}

export function handleWorkdeskAuth(error: unknown, forbiddenPath = "/tech"): never {
  if (error instanceof AuthError && error.code === "UNAUTHENTICATED") {
    redirect("/login");
  }
  redirect(forbiddenPath);
}

export async function workdeskAdminOrRedirect(): Promise<SessionUser> {
  try {
    return await requireWorkdeskAdmin();
  } catch (error) {
    handleWorkdeskAuth(error, "/admin");
  }
}

export async function technicianOrRedirect(fallback = "/tech"): Promise<SessionUser> {
  try {
    return await requireTechnician();
  } catch (error) {
    handleWorkdeskAuth(error, fallback);
  }
}
