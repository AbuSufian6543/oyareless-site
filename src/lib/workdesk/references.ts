import "server-only";

import { prisma } from "@/lib/prisma";

export async function nextTicketReference(): Promise<string> {
  const last = await prisma.ticket.findFirst({
    orderBy: { createdAt: "desc" },
    select: { reference: true },
  });
  const match = last?.reference.match(/^WC-(\d+)$/);
  const next = match ? Number(match[1]) + 1 : (await prisma.ticket.count()) + 1;
  return `WC-${String(next).padStart(4, "0")}`;
}

export async function nextTaskReference(): Promise<string> {
  const last = await prisma.internalTask.findFirst({
    orderBy: { createdAt: "desc" },
    select: { reference: true },
  });
  const match = last?.reference.match(/^WT-(\d+)$/);
  const next = match ? Number(match[1]) + 1 : (await prisma.internalTask.count()) + 1;
  return `WT-${String(next).padStart(4, "0")}`;
}
