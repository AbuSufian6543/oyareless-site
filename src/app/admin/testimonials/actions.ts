"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveTestimonialAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");

  const id = String(formData.get("id") ?? "");
  const quote = String(formData.get("quote") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim();

  if (!quote || !authorName) redirect("/admin/testimonials?error=invalid");

  const data = {
    quote: quote.slice(0, 1200),
    authorName: authorName.slice(0, 120),
    authorRole: String(formData.get("authorRole") ?? "").trim() || null,
    company: String(formData.get("company") ?? "").trim() || null,
    avatarUrl: String(formData.get("avatarUrl") ?? "").trim() || null,
    rating: Math.min(
      5,
      Math.max(1, Number.parseInt(String(formData.get("rating") ?? "5"), 10) || 5),
    ),
    order: Math.max(
      0,
      Number.parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    ),
    featured: formData.get("featured") === "on",
    status: (formData.get("status") === "DRAFT"
      ? "DRAFT"
      : "PUBLISHED") as "DRAFT" | "PUBLISHED",
  };

  if (id) {
    await prisma.testimonial.update({ where: { id }, data });
  } else {
    await prisma.testimonial.create({ data });
  }

  await recordAudit({
    action: "testimonial.updated",
    userId: user.id,
    entityType: "Testimonial",
    entityId: id || undefined,
    summary: authorName,
  });

  revalidatePath("/");
  redirect("/admin/testimonials?saved=1");
}

export async function deleteTestimonialAction(
  formData: FormData,
): Promise<void> {
  const user = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  await prisma.testimonial.delete({ where: { id } }).catch(() => undefined);

  await recordAudit({
    action: "testimonial.updated",
    userId: user.id,
    entityType: "Testimonial",
    entityId: id,
    summary: "Deleted",
  });

  revalidatePath("/");
  redirect("/admin/testimonials?deleted=1");
}
