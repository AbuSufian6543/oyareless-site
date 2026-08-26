"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const jobSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().max(160).optional(),
  department: z.string().trim().max(120).optional(),
  location: z.string().trim().max(160).default("Sault Ste. Marie, ON"),
  employmentType: z.string().trim().max(60).default("Full-time"),
  summary: z.string().trim().max(600).optional(),
  description: z.string().trim().max(20000).default(""),
  requirements: z.string().trim().max(20000).default(""),
  salaryRange: z.string().trim().max(120).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  closesAt: z.string().trim().optional(),
});

function readForm(formData: FormData) {
  return jobSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug") ?? "",
    department: formData.get("department") ?? "",
    location: formData.get("location") || "Sault Ste. Marie, ON",
    employmentType: formData.get("employmentType") || "Full-time",
    summary: formData.get("summary") ?? "",
    description: formData.get("description") ?? "",
    requirements: formData.get("requirements") ?? "",
    salaryRange: formData.get("salaryRange") ?? "",
    status: formData.get("status"),
    closesAt: formData.get("closesAt") ?? "",
  });
}

export async function saveJobAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");
  const id = String(formData.get("id") ?? "");
  const parsed = readForm(formData);

  if (!parsed.success) {
    redirect(id ? `/admin/jobs/${id}?error=invalid` : "/admin/jobs/new?error=invalid");
  }

  const data = parsed.data;
  const closesAt = data.closesAt ? new Date(data.closesAt) : null;

  const values = {
    title: data.title,
    department: data.department || null,
    location: data.location,
    employmentType: data.employmentType,
    summary: data.summary || null,
    description: data.description,
    requirements: data.requirements,
    salaryRange: data.salaryRange || null,
    status: data.status,
    closesAt: closesAt && !Number.isNaN(closesAt.getTime()) ? closesAt : null,
  };

  if (id) {
    const existing = await prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) redirect("/admin/jobs");

    let slug = slugify(data.slug || data.title) || existing.slug;
    if (slug !== existing.slug) {
      const clash = await prisma.jobPosting.findUnique({ where: { slug } });
      if (clash) slug = existing.slug;
    }

    await prisma.jobPosting.update({ where: { id }, data: { ...values, slug } });
    await recordAudit({
      action: "job.updated",
      userId: user.id,
      entityType: "JobPosting",
      entityId: id,
      summary: data.title,
    });

    revalidatePath("/careers");
    revalidatePath(`/careers/${slug}`);
    redirect(`/admin/jobs/${id}?saved=1`);
  }

  let slug = slugify(data.slug || data.title) || `role-${Date.now()}`;
  let attempt = 2;
  while (await prisma.jobPosting.findUnique({ where: { slug } })) {
    slug = `${slug}-${attempt}`;
    attempt += 1;
  }

  const job = await prisma.jobPosting.create({ data: { ...values, slug } });
  await recordAudit({
    action: "job.created",
    userId: user.id,
    entityType: "JobPosting",
    entityId: job.id,
    summary: data.title,
  });

  revalidatePath("/careers");
  redirect(`/admin/jobs/${job.id}?created=1`);
}

export async function deleteJobAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const job = await prisma.jobPosting.findUnique({ where: { id } });
  if (!job) redirect("/admin/jobs");

  await prisma.jobPosting.delete({ where: { id } });
  await recordAudit({
    action: "job.deleted",
    userId: user.id,
    entityType: "JobPosting",
    entityId: id,
    summary: job.title,
  });

  revalidatePath("/careers");
  redirect("/admin/jobs?deleted=1");
}
