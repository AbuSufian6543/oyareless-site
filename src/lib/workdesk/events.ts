import "server-only";

import type { Prisma, WorkdeskEventKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { CUSTOMER_VISIBLE_EVENT_KINDS } from "@/lib/workdesk/rules";

export async function recordWorkdeskEvent(input: {
  kind: WorkdeskEventKind;
  summary: string;
  ticketId?: string | null;
  taskId?: string | null;
  actorStaffId?: string | null;
  actorCustomerUserId?: string | null;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  if (!input.ticketId && !input.taskId) return;
  await prisma.workdeskEvent.create({
    data: {
      kind: input.kind,
      summary: input.summary.slice(0, 500),
      ticketId: input.ticketId ?? undefined,
      taskId: input.taskId ?? undefined,
      actorStaffId: input.actorStaffId ?? undefined,
      actorCustomerUserId: input.actorCustomerUserId ?? undefined,
      meta: input.meta,
    },
  });
}

export { CUSTOMER_VISIBLE_EVENT_KINDS };
