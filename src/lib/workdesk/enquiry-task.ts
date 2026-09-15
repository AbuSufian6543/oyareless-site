import "server-only";

import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { recordWorkdeskEvent } from "@/lib/workdesk/events";
import { recordTaskAudit } from "@/lib/workdesk/audit";
import { notifyNewWork } from "@/lib/workdesk/notify";
import { joinStaffNames } from "@/lib/workdesk/notice";
import { nextTaskReference } from "@/lib/workdesk/references";
import { revalidateWorkdesk } from "@/lib/workdesk/revalidate";
import { staffNamesFor } from "@/lib/workdesk/staff";

export type EnquiryKind = "submission" | "quote";

export async function findEnquiryTask(kind: EnquiryKind, sourceId: string) {
  return prisma.internalTask.findFirst({
    where: { enquiryKind: kind, enquiryId: sourceId },
    select: {
      id: true,
      reference: true,
      title: true,
      status: true,
      assignees: { include: { user: { select: { id: true, name: true } } } },
    },
  });
}

/**
 * Opens a workdesk task from an inbox message or quote so office staff can
 * assign employees and managers the same way as any other task.
 */
export async function createOrOpenEnquiryTask(input: {
  staff: SessionUser;
  kind: EnquiryKind;
  sourceId: string;
  title: string;
  description: string;
  assigneeIds: string[];
}): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.internalTask.findFirst({
    where: { enquiryKind: input.kind, enquiryId: input.sourceId },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };

  const task = await prisma.internalTask.create({
    data: {
      reference: await nextTaskReference(),
      title: input.title.slice(0, 200),
      description: input.description.slice(0, 8000),
      createdById: input.staff.id,
      enquiryKind: input.kind,
      enquiryId: input.sourceId,
      assignees: {
        create: input.assigneeIds.map((userId) => ({ userId })),
      },
    },
  });

  await recordWorkdeskEvent({
    kind: "CREATED",
    summary: `${input.staff.name} created ${task.reference} from Enquiries`,
    taskId: task.id,
    actorStaffId: input.staff.id,
  });

  if (input.assigneeIds.length > 0) {
    const names = await staffNamesFor(input.assigneeIds);
    await recordWorkdeskEvent({
      kind: "ASSIGNED",
      summary: `${input.staff.name} assigned ${task.reference} to ${joinStaffNames(names)}`,
      taskId: task.id,
      actorStaffId: input.staff.id,
    });
  }

  await notifyNewWork({
    actorId: input.staff.id,
    actorName: input.staff.name,
    reference: task.reference,
    subject: task.title,
    kind: "task",
    assigneeIds: input.assigneeIds,
    taskId: task.id,
  });

  await recordTaskAudit({
    action: "task.created",
    taskId: task.id,
    taskReference: task.reference,
    summary: `${input.staff.name} created ${task.reference} from Enquiries`,
    actor: input.staff,
    details: {
      title: task.title,
      enquiryKind: input.kind,
      assignees: input.assigneeIds.length,
    },
  });

  await revalidateWorkdesk({ taskId: task.id, flash: "created" });
  return { id: task.id, created: true };
}
