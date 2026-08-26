"use server";

import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Normalises a source path to a leading-slash, no-trailing-slash form. */
function normalisePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;
}

export async function saveRedirectAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const id = String(formData.get("id") ?? "");
  const source = normalisePath(String(formData.get("source") ?? ""));
  const destinationRaw = String(formData.get("destination") ?? "").trim();
  const destination = /^https?:\/\//i.test(destinationRaw)
    ? destinationRaw
    : normalisePath(destinationRaw);
  const statusCode = formData.get("statusCode") === "302" ? 302 : 301;
  const isActive = formData.get("isActive") === "on";

  if (!source || !destination) redirect("/admin/redirects?error=invalid");
  if (source === destination) redirect("/admin/redirects?error=loop");

  try {
    if (id) {
      await prisma.redirect.update({
        where: { id },
        data: { source, destination, statusCode, isActive },
      });
    } else {
      await prisma.redirect.create({
        data: { source, destination, statusCode, isActive },
      });
    }
  } catch {
    redirect("/admin/redirects?error=duplicate");
  }

  await recordAudit({
    action: "redirect.updated",
    userId: user.id,
    entityType: "Redirect",
    entityId: id || undefined,
    summary: `${source} → ${destination}`,
  });

  redirect("/admin/redirects?saved=1");
}

export async function deleteRedirectAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  await prisma.redirect.delete({ where: { id } }).catch(() => undefined);

  await recordAudit({
    action: "redirect.updated",
    userId: user.id,
    entityType: "Redirect",
    entityId: id,
    summary: "Deleted",
  });

  redirect("/admin/redirects?deleted=1");
}
