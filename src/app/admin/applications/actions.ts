"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import {
  JOB_APPLICATION_STATUSES,
  type JobApplicationStatusValue,
} from "@/lib/careers";
import { prisma } from "@/lib/prisma";
import { deletePrivateResume } from "@/lib/resume-pdf";

const STATUSES = new Set(
  JOB_APPLICATION_STATUSES.map((item) => item.value),
);

export async function updateApplicationAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/applications");

  const statusRaw = String(formData.get("status") ?? "");
  const status = STATUSES.has(statusRaw as JobApplicationStatusValue)
    ? (statusRaw as JobApplicationStatusValue)
    : undefined;
  const internalNotes = String(formData.get("internalNotes") ?? "");

  await prisma.jobApplication.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      internalNotes: internalNotes.trim() || null,
    },
  });

  await recordAudit({
    action: "application.updated",
    userId: user.id,
    entityType: "JobApplication",
    entityId: id,
    summary: `Application updated${status ? ` (${status})` : ""}`,
  });

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
  redirect(`/admin/applications/${id}?saved=1`);
}

export async function deleteApplicationAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/applications");

  const application = await prisma.jobApplication.findUnique({
    where: { id },
    select: { storagePath: true, name: true },
  });
  if (!application) redirect("/admin/applications");

  await prisma.jobApplication.delete({ where: { id } });
  await deletePrivateResume(application.storagePath);

  await recordAudit({
    action: "application.deleted",
    userId: user.id,
    entityType: "JobApplication",
    entityId: id,
    summary: `Deleted application from ${application.name}`,
  });

  revalidatePath("/admin/applications");
  redirect("/admin/applications?deleted=1");
}
