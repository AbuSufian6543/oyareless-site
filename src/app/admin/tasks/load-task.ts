import "server-only";

import { requireAdminRole } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { listAssignableStaff } from "@/lib/workdesk/staff";
import { WORK_LOG_INCLUDE } from "@/lib/workdesk/work-log-query";

export async function loadAdminTask(id: string) {
  const user = await requireAdminRole("EMPLOYEE");
  const [task, staff, catalog] = await Promise.all([
    prisma.internalTask.findUnique({
      where: { id },
      include: {
        assignees: { include: { user: { select: { id: true, name: true } } } },
        notes: {
          orderBy: { createdAt: "asc" },
          include: { attachments: true },
        },
        attachments: true,
        events: { orderBy: { createdAt: "asc" } },
        createdBy: { select: { name: true } },
        ...WORK_LOG_INCLUDE,
      },
    }),
    listAssignableStaff(),
    prisma.workProduct.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sku: true, unit: true, category: true },
    }),
  ]);
  if (!task) return null;
  return { user, task, staff, catalog };
}
