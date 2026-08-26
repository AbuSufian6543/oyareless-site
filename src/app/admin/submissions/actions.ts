"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "RESOLVED",
  "ARCHIVED",
  "SPAM",
] as const;

type Status = (typeof STATUSES)[number];

export async function updateSubmissionAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const internalNotes = String(formData.get("internalNotes") ?? "").slice(0, 4000);
  const assignedToId = String(formData.get("assignedToId") ?? "");

  if (!STATUSES.includes(status as Status)) redirect(`/admin/submissions/${id}`);

  await prisma.formSubmission.update({
    where: { id },
    data: {
      status: status as Status,
      internalNotes: internalNotes || null,
      assignedToId: assignedToId || null,
    },
  });

  await recordAudit({
    action: "submission.updated",
    userId: user.id,
    entityType: "FormSubmission",
    entityId: id,
    summary: `Status set to ${status}`,
  });

  revalidatePath("/admin/submissions");
  redirect(`/admin/submissions/${id}?saved=1`);
}

export async function bulkSubmissionAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");

  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const status = String(formData.get("status") ?? "");

  if (ids.length === 0 || !STATUSES.includes(status as Status)) {
    redirect("/admin/submissions");
  }

  await prisma.formSubmission.updateMany({
    where: { id: { in: ids } },
    data: { status: status as Status },
  });

  await recordAudit({
    action: "submission.updated",
    userId: user.id,
    entityType: "FormSubmission",
    summary: `${ids.length} marked ${status}`,
  });

  revalidatePath("/admin/submissions");
  redirect("/admin/submissions?updated=1");
}
