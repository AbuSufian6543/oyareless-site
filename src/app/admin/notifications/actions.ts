"use server";

import { revalidatePath } from "next/cache";

import { requireWorkdeskStaff } from "@/lib/workdesk/access";
import { prisma } from "@/lib/prisma";

function revalidateNotificationSurfaces() {
  revalidatePath("/admin", "layout");
  revalidatePath("/tech", "layout");
}

export async function markWorkdeskNotificationsReadAction(): Promise<void> {
  const staff = await requireWorkdeskStaff();
  await prisma.workdeskNotification.updateMany({
    where: { userId: staff.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidateNotificationSurfaces();
}

export async function clearWorkdeskNotificationAction(id: string): Promise<void> {
  const staff = await requireWorkdeskStaff();
  if (!/^[a-z0-9]{8,40}$/i.test(id)) return;
  await prisma.workdeskNotification.deleteMany({
    where: { id, userId: staff.id },
  });
  revalidateNotificationSurfaces();
}

export async function clearWorkdeskNotificationsAction(): Promise<void> {
  const staff = await requireWorkdeskStaff();
  await prisma.workdeskNotification.deleteMany({
    where: { userId: staff.id },
  });
  revalidateNotificationSurfaces();
}
