import "server-only";

import { prisma } from "@/lib/prisma";

export async function listAssignableStaff() {
  return prisma.user.findMany({
    where: { isActive: true, role: { not: "VIEWER" } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ name: "asc" }],
  });
}
