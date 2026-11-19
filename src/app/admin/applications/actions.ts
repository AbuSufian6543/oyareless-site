"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { applicationListPath, applicationListWhere } from "@/lib/application-list";
import { requireAllowed, requireRole } from "@/lib/auth";
import { canAccessApplications } from "@/lib/staff-access";
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
  await requireAllowed(canAccessApplications);
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

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
  redirect(`/admin/applications/${id}?saved=1`);
}

export async function deleteApplicationAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/applications");

  const application = await prisma.jobApplication.findUnique({
    where: { id },
    select: { storagePath: true, name: true },
  });
  if (!application) redirect("/admin/applications");

  await prisma.jobApplication.delete({ where: { id } });
  await deletePrivateResume(application.storagePath);

  revalidatePath("/admin/applications");
  redirect("/admin/applications?deleted=1");
}

const APPLICATION_ID = /^[a-z0-9]{8,40}$/;

function selectedIds(formData: FormData): string[] {
  const unique = new Set<string>();
  for (const value of formData.getAll("ids")) {
    const id = String(value);
    if (APPLICATION_ID.test(id)) unique.add(id);
    if (unique.size >= 200) break;
  }
  return [...unique];
}

function listReturn(formData: FormData): string {
  const requested = String(formData.get("returnTo") ?? "");
  const fallback = applicationListPath(
    String(formData.get("status") ?? "NEW"),
    String(formData.get("q") ?? ""),
  );
  if (!requested.startsWith("/admin/applications")) return fallback;
  try {
    const url = new URL(requested, "https://wirelesscom.local");
    if (url.pathname !== "/admin/applications") return fallback;
    const listed = applicationListWhere(url.searchParams.get("status") ?? undefined, url.searchParams.get("q") ?? undefined);
    return applicationListPath(listed.filter, listed.query);
  } catch {
    return fallback;
  }
}

function deletedPath(path: string, count: number): string {
  const url = new URL(path, "https://wirelesscom.local");
  url.searchParams.set("deleted", String(count));
  return `${url.pathname}${url.search}`;
}

async function removeApplications(
  rows: Array<{ id: string; storagePath: string }>,
): Promise<number> {
  if (rows.length === 0) return 0;
  await prisma.jobApplication.deleteMany({
    where: { id: { in: rows.map((row) => row.id) } },
  });
  for (let index = 0; index < rows.length; index += 20) {
    await Promise.all(
      rows.slice(index, index + 20).map((row) => deletePrivateResume(row.storagePath)),
    );
  }
  return rows.length;
}

export async function deleteApplicationsAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const returnTo = listReturn(formData);
  const ids = selectedIds(formData);
  if (ids.length === 0) redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}none=1`);

  const rows = await prisma.jobApplication.findMany({
    where: { id: { in: ids } },
    select: { id: true, storagePath: true },
  });
  const removed = await removeApplications(rows);
  revalidatePath("/admin/applications");
  redirect(removed > 0 ? deletedPath(returnTo, removed) : `${returnTo}${returnTo.includes("?") ? "&" : "?"}none=1`);
}

export async function deleteAllApplicationsAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  if (String(formData.get("scope") ?? "") !== "filter") redirect("/admin/applications");
  const listed = applicationListWhere(
    String(formData.get("status") ?? ""),
    String(formData.get("q") ?? ""),
  );
  const returnTo = applicationListPath(listed.filter, listed.query);
  const rows = await prisma.jobApplication.findMany({
    where: listed.where,
    select: { id: true, storagePath: true },
  });
  const removed = await removeApplications(rows);
  revalidatePath("/admin/applications");
  redirect(removed > 0 ? deletedPath(returnTo, removed) : `${returnTo}${returnTo.includes("?") ? "&" : "?"}none=1`);
}
