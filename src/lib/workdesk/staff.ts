import "server-only";

import { prisma } from "@/lib/prisma";

export async function listAssignableStaff() {
  return prisma.user.findMany({
    where: { isActive: true, role: { not: "VIEWER" } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ name: "asc" }],
  });
}

export function assigneeIdsFrom(formData: FormData, name = "assigneeIds"): string[] {
  return formData
    .getAll(name)
    .map((value) => String(value))
    .filter(Boolean);
}

export async function activeAssigneeIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const staff = await prisma.user.findMany({
    where: { id: { in: ids }, isActive: true, role: { not: "VIEWER" } },
    select: { id: true },
  });
  const allowed = new Set(staff.map((row) => row.id));
  return [...new Set(ids.filter((id) => allowed.has(id)))];
}

export async function replaceTicketAssignees(
  ticketId: string,
  requestedIds: string[],
): Promise<string[]> {
  const valid = await activeAssigneeIds(requestedIds);
  await prisma.ticketAssignee.deleteMany({ where: { ticketId } });
  if (valid.length > 0) {
    await prisma.ticketAssignee.createMany({
      data: valid.map((userId) => ({ ticketId, userId })),
    });
  }
  return valid;
}

export async function listTicketAssigneeIds(ticketId: string): Promise<string[]> {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      assignedToId: true,
      assignees: { select: { userId: true } },
      accessGrants: { select: { userId: true } },
    },
  });
  if (!ticket) return [];
  return [
    ...new Set(
      [
        ticket.assignedToId,
        ...ticket.assignees.map((row) => row.userId),
        ...ticket.accessGrants.map((row) => row.userId),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
}

export async function listTaskAssigneeIds(taskId: string): Promise<string[]> {
  const rows = await prisma.internalTaskAssignee.findMany({
    where: { taskId },
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
}

/** Names in the same order as `ids`. Missing users are skipped. */
export async function staffNamesFor(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row.name]));
  return ids
    .map((id) => byId.get(id))
    .filter((name): name is string => Boolean(name));
}
