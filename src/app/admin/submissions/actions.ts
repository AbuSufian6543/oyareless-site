"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { requireAllowed } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessEnquiries, canDeleteEnquiries } from "@/lib/staff-access";
import { createOrOpenEnquiryTask } from "@/lib/workdesk/enquiry-task";
import { activeAssigneeIds, assigneeIdsFrom } from "@/lib/workdesk/staff";

const STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "RESOLVED",
  "ARCHIVED",
  "SPAM",
] as const;

const RETURN_FILTERS = ["all", ...STATUSES] as const;

function inboxHref(status: string, flag: "updated" | "deleted"): string {
  const params = new URLSearchParams();
  if ((RETURN_FILTERS as readonly string[]).includes(status)) {
    params.set("status", status);
  }
  params.set(flag, "1");
  return `/admin/submissions?${params.toString()}`;
}

/** Drop the inbox link on any task opened from these messages, then delete them. */
async function deleteInboxMessages(
  userId: string,
  ids: string[],
): Promise<number> {
  const unique = [...new Set(ids.filter(Boolean))].slice(0, 200);
  if (unique.length === 0) return 0;

  const rows = await prisma.formSubmission.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true, email: true },
  });
  if (rows.length === 0) return 0;

  const foundIds = rows.map((row) => row.id);
  await prisma.$transaction([
    prisma.internalTask.updateMany({
      where: { enquiryKind: "submission", enquiryId: { in: foundIds } },
      data: { enquiryKind: null, enquiryId: null },
    }),
    prisma.formSubmission.deleteMany({ where: { id: { in: foundIds } } }),
  ]);

  const summary =
    rows.length === 1
      ? `${rows[0].name} <${rows[0].email}>`
      : `${rows.length} inbox messages`;

  await recordAudit({
    action: "submission.deleted",
    userId,
    entityType: "FormSubmission",
    entityId: rows.length === 1 ? rows[0].id : undefined,
    summary,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/submissions");
  return rows.length;
}

type Status = (typeof STATUSES)[number];

export async function updateSubmissionAction(formData: FormData): Promise<void> {
  const user = await requireAllowed(canAccessEnquiries);

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const internalNotes = String(formData.get("internalNotes") ?? "").slice(0, 4000);

  if (!STATUSES.includes(status as Status)) redirect(`/admin/submissions/${id}`);

  await prisma.formSubmission.update({
    where: { id },
    data: {
      status: status as Status,
      internalNotes: internalNotes || null,
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

export async function createTaskFromSubmissionAction(
  formData: FormData,
): Promise<void> {
  const staff = await requireAllowed(canAccessEnquiries);
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/submissions");

  const submission = await prisma.formSubmission.findUnique({ where: { id } });
  if (!submission) redirect("/admin/submissions");

  const assignees = await activeAssigneeIds(assigneeIdsFrom(formData));
  const title =
    submission.subject?.trim() ||
    `${submission.type.toLowerCase()} from ${submission.name}`;
  const extra = Object.entries(
    (submission.payload ?? {}) as Record<string, unknown>,
  )
    .filter(([, value]) => value !== null && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n");

  const description = [
    `From inbox (${submission.type.toLowerCase()})`,
    `${submission.name} <${submission.email}>`,
    submission.phone ? `Phone: ${submission.phone}` : "",
    submission.company ? `Company: ${submission.company}` : "",
    "",
    submission.message,
    extra ? `\n${extra}` : "",
    "",
    `Inbox: /admin/submissions/${submission.id}`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  const result = await createOrOpenEnquiryTask({
    staff,
    kind: "submission",
    sourceId: submission.id,
    title,
    description,
    assigneeIds: assignees,
  });

  if (result.created) {
    await prisma.formSubmission.update({
      where: { id: submission.id },
      data: {
        assignedToId: assignees[0] ?? submission.assignedToId,
        status: submission.status === "NEW" ? "IN_PROGRESS" : submission.status,
      },
    });
  }

  revalidatePath("/admin/submissions");
  redirect(`/admin/tasks/${result.id}`);
}

export async function bulkSubmissionAction(formData: FormData): Promise<void> {
  const user = await requireAllowed(canAccessEnquiries);

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

export async function deleteSubmissionAction(formData: FormData): Promise<void> {
  const user = await requireAllowed(canDeleteEnquiries);
  const id = String(formData.get("id") ?? "");
  await deleteInboxMessages(user.id, id ? [id] : []);
  redirect("/admin/submissions?deleted=1");
}

export async function deleteSubmissionsAction(formData: FormData): Promise<void> {
  const user = await requireAllowed(canDeleteEnquiries);
  const ids = formData.getAll("ids").map(String);
  const status = String(formData.get("returnStatus") ?? "");
  await deleteInboxMessages(user.id, ids);
  redirect(inboxHref(status, "deleted"));
}
