/**
 * Pure authorization rules for the workdesk. Safe to import from Node scripts
 * and from server modules — this file has no database or cookie access.
 */

/** Must stay aligned with `Role` in the Prisma schema. */
export const STAFF_ROLE_RANK = {
  TECHNICIAN: 0,
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
} as const;

export function roleMeetsMinimum(role: string, minimum: string): boolean {
  const left = STAFF_ROLE_RANK[role as keyof typeof STAFF_ROLE_RANK];
  const right = STAFF_ROLE_RANK[minimum as keyof typeof STAFF_ROLE_RANK];
  if (left === undefined || right === undefined) return false;
  return left >= right;
}

export const TECHNICIAN_TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING",
  "RESOLVED",
] as const;

export const ADMIN_TICKET_STATUSES = [
  "NEW",
  "OPEN",
  "IN_PROGRESS",
  "WAITING",
  "RESOLVED",
  "CLOSED",
] as const;

export const TECHNICIAN_TASK_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING",
  "COMPLETED",
] as const;

export const ADMIN_TASK_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING",
  "COMPLETED",
  "CLOSED",
] as const;

export const CUSTOMER_VISIBLE_EVENT_KINDS = [
  "CREATED",
  "STATUS_CHANGED",
  "MESSAGE",
  "ATTACHMENT",
  "CLOSED",
  "REOPENED",
] as const;

export function technicianCanSeeTicket(input: {
  userId: string;
  assignedToId: string | null;
  assigneeIds?: string[];
  grantUserIds: string[];
}): boolean {
  return (
    input.assignedToId === input.userId ||
    (input.assigneeIds ?? []).includes(input.userId) ||
    input.grantUserIds.includes(input.userId)
  );
}

export function technicianCanSeeTask(input: {
  userId: string;
  assigneeIds: string[];
}): boolean {
  return input.assigneeIds.includes(input.userId);
}

export function technicianMaySetTicketStatus(status: string): boolean {
  return (TECHNICIAN_TICKET_STATUSES as readonly string[]).includes(status);
}

export function technicianMaySetTaskStatus(status: string): boolean {
  return (TECHNICIAN_TASK_STATUSES as readonly string[]).includes(status);
}

export function workdeskAdminMaySetTicketStatus(status: string): boolean {
  return (ADMIN_TICKET_STATUSES as readonly string[]).includes(status);
}

export function workdeskAdminMaySetTaskStatus(status: string): boolean {
  return (ADMIN_TASK_STATUSES as readonly string[]).includes(status);
}
