/**
 * Prisma filters for the admin workdesk board: mine, team, and unassigned.
 */

import type { TaskStatus, TicketStatus } from "@/generated/prisma/client";

const CLOSED_TASKS: TaskStatus[] = ["COMPLETED", "CLOSED"];
const CLOSED_TICKETS: TicketStatus[] = ["RESOLVED", "CLOSED"];

export const OPEN_TASK = {
  status: { notIn: CLOSED_TASKS },
};

export const OPEN_TICKET = {
  status: { notIn: CLOSED_TICKETS },
};

export function taskAssignedTo(userId: string) {
  return { assignees: { some: { userId } } };
}

export function taskAssignedToOthers(userId: string) {
  return {
    AND: [{ assignees: { some: {} } }, { assignees: { none: { userId } } }],
  };
}

export function taskUnassigned() {
  return { assignees: { none: {} } };
}

export function ticketAssignedTo(userId: string) {
  return {
    OR: [{ assignedToId: userId }, { assignees: { some: { userId } } }],
  };
}

export function ticketAssignedToOthers(userId: string) {
  return {
    AND: [
      {
        OR: [{ assignedToId: { not: null } }, { assignees: { some: {} } }],
      },
      { assignedToId: { not: userId } },
      { assignees: { none: { userId } } },
    ],
  };
}

export function ticketUnassigned() {
  return {
    assignedToId: null,
    assignees: { none: {} },
  };
}

export function ticketAssigneeNames(ticket: {
  assignedTo?: { name: string } | null;
  assignees?: { user: { name: string } }[];
}): string[] {
  const names = ticket.assignees?.map((row) => row.user.name) ?? [];
  if (names.length > 0) return names;
  return ticket.assignedTo?.name ? [ticket.assignedTo.name] : [];
}
