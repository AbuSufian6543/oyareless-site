"use server";

import { redirect } from "next/navigation";

import type { TaskStatus, TicketStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { recordTaskAudit, recordTicketAudit } from "@/lib/workdesk/audit";
import {
  isTechnician,
  isWorkdeskAdmin,
  workdeskStaffOrRedirect,
} from "@/lib/workdesk/access";
import { recordWorkdeskEvent } from "@/lib/workdesk/events";
import { TASK_STATUS_LABELS, TICKET_STATUS_LABELS } from "@/lib/workdesk/labels";
import { notifyAssignees } from "@/lib/workdesk/notify";
import { revalidateWorkdesk } from "@/lib/workdesk/revalidate";
import { workListReturnPath } from "@/lib/workdesk/return-path";
import {
  bulkTaskStatusesForRole,
  bulkTicketStatusesForRole,
  technicianCanSeeTask,
  technicianCanSeeTicket,
} from "@/lib/workdesk/rules";
import { listTaskAssigneeIds, listTicketAssigneeIds } from "@/lib/workdesk/staff";

const MAX_IDS = 200;

function selectedIds(formData: FormData): string[] {
  const seen = new Set<string>();
  for (const value of formData.getAll("ids")) {
    const id = String(value).trim();
    if (!/^[a-z0-9]{8,40}$/i.test(id)) continue;
    seen.add(id);
    if (seen.size >= MAX_IDS) break;
  }
  return [...seen];
}

export async function bulkSetTaskStatusAction(formData: FormData): Promise<void> {
  const staff = await workdeskStaffOrRedirect();
  const fallback = isTechnician(staff) ? "/tech/tasks" : "/admin/tasks";
  const returnTo = workListReturnPath(String(formData.get("returnTo") ?? ""), fallback);
  const status = String(formData.get("status") ?? "");
  const ids = selectedIds(formData);
  if (!bulkTaskStatusesForRole(staff.role).includes(status) || ids.length === 0) {
    redirect(returnTo);
  }

  const next = status as TaskStatus;
  const tasks = await prisma.internalTask.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      reference: true,
      title: true,
      status: true,
      completedAt: true,
      closedAt: true,
      assignees: { select: { userId: true } },
    },
  });

  let changed = 0;
  for (const task of tasks) {
    const allowed =
      isWorkdeskAdmin(staff) ||
      (isTechnician(staff) &&
        technicianCanSeeTask({
          userId: staff.id,
          assigneeIds: task.assignees.map((row) => row.userId),
        }));
    if (!allowed || task.status === next) continue;

    await prisma.internalTask.update({
      where: { id: task.id },
      data: {
        status: next,
        completedAt: next === "COMPLETED" ? task.completedAt ?? new Date() : task.completedAt,
        closedAt: next === "CLOSED" ? new Date() : task.closedAt,
      },
    });

    const label = TASK_STATUS_LABELS[next] ?? next;
    await recordWorkdeskEvent({
      kind: next === "CLOSED" ? "CLOSED" : next === "COMPLETED" ? "COMPLETED" : "STATUS_CHANGED",
      summary: `${staff.name} set status to ${label}`,
      taskId: task.id,
      actorStaffId: staff.id,
    });
    await recordTaskAudit({
      action: "task.status_changed",
      taskId: task.id,
      taskReference: task.reference,
      summary: `${staff.name} set ${task.reference} from ${TASK_STATUS_LABELS[task.status] ?? task.status} to ${label}`,
      actor: staff,
      details: { from: task.status, to: next, bulk: true },
    });
    await notifyAssignees({
      userIds: await listTaskAssigneeIds(task.id),
      excludeUserIds: [staff.id],
      title: next === "COMPLETED" || next === "CLOSED" ? `${task.reference} marked ${label}` : `${task.reference} status updated`,
      body: `${staff.name} set ${task.reference} to ${label}`,
      kind: next === "COMPLETED" || next === "CLOSED" ? "RESOLVED" : "UPDATE",
      taskId: task.id,
    });
    changed += 1;
  }

  if (changed > 0) await revalidateWorkdesk({ taskId: ids[0], flash: "updated" });
  redirect(returnTo);
}

export async function bulkSetTicketStatusAction(formData: FormData): Promise<void> {
  const staff = await workdeskStaffOrRedirect();
  const fallback = isTechnician(staff) ? "/tech/tickets" : "/admin/tickets";
  const returnTo = workListReturnPath(String(formData.get("returnTo") ?? ""), fallback);
  const status = String(formData.get("status") ?? "");
  const ids = selectedIds(formData);
  if (!bulkTicketStatusesForRole(staff.role).includes(status) || ids.length === 0) {
    redirect(returnTo);
  }

  const next = status as TicketStatus;
  const tickets = await prisma.ticket.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      reference: true,
      subject: true,
      status: true,
      resolvedAt: true,
      closedAt: true,
      assignedToId: true,
      assignees: { select: { userId: true } },
      accessGrants: { select: { userId: true } },
    },
  });

  let changed = 0;
  for (const ticket of tickets) {
    const allowed =
      isWorkdeskAdmin(staff) ||
      (isTechnician(staff) &&
        technicianCanSeeTicket({
          userId: staff.id,
          assignedToId: ticket.assignedToId,
          assigneeIds: ticket.assignees.map((row) => row.userId),
          grantUserIds: ticket.accessGrants.map((grant) => grant.userId),
        }));
    if (!allowed || ticket.status === next) continue;

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: next,
        resolvedAt: next === "RESOLVED" ? ticket.resolvedAt ?? new Date() : ticket.resolvedAt,
        closedAt: next === "CLOSED" ? new Date() : ticket.closedAt,
      },
    });

    const label = next === "RESOLVED" ? "Completed" : (TICKET_STATUS_LABELS[next] ?? next);
    await recordWorkdeskEvent({
      kind:
        next === "CLOSED"
          ? "CLOSED"
          : next === "RESOLVED"
            ? "COMPLETED"
            : ticket.status === "CLOSED"
              ? "REOPENED"
              : "STATUS_CHANGED",
      summary: `${staff.name} set status to ${TICKET_STATUS_LABELS[next] ?? next}`,
      ticketId: ticket.id,
      actorStaffId: staff.id,
      meta: { from: ticket.status, to: next },
    });
    await recordTicketAudit({
      action: "ticket.status_changed",
      ticketId: ticket.id,
      ticketReference: ticket.reference,
      summary: `${staff.name} set ${ticket.reference} from ${TICKET_STATUS_LABELS[ticket.status] ?? ticket.status} to ${TICKET_STATUS_LABELS[next] ?? next}`,
      actor: { kind: "staff", id: staff.id, name: staff.name, email: staff.email },
      details: { from: ticket.status, to: next, bulk: true },
    });
    await notifyAssignees({
      userIds: await listTicketAssigneeIds(ticket.id),
      excludeUserIds: [staff.id],
      title:
        next === "RESOLVED" || next === "CLOSED"
          ? `${ticket.reference} marked ${label}`
          : `${ticket.reference} status updated`,
      body: `${staff.name} set ${ticket.reference} to ${label}`,
      kind: next === "RESOLVED" || next === "CLOSED" ? "RESOLVED" : "UPDATE",
      ticketId: ticket.id,
    });
    changed += 1;
  }

  if (changed > 0) await revalidateWorkdesk({ ticketId: ids[0], flash: "updated" });
  redirect(returnTo);
}
