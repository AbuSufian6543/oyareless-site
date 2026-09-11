"use server";

import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { workdeskAdminOrRedirect } from "@/lib/workdesk/access";
import { WORK_PRODUCT_CATEGORIES, WORK_PRODUCT_UNITS } from "@/lib/workdesk/labels";
import { revalidatePath } from "next/cache";
import { setFlash } from "@/lib/flash";

const CATEGORIES = new Set<string>(WORK_PRODUCT_CATEGORIES);
const UNITS = new Set<string>(WORK_PRODUCT_UNITS);

function cleanSku(raw: string): string | null {
  const sku = raw.trim().toUpperCase().slice(0, 40);
  return sku.length > 0 ? sku : null;
}

export async function createWorkProductAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const sku = cleanSku(String(formData.get("sku") ?? ""));
  const categoryRaw = String(formData.get("category") ?? "General");
  const unitRaw = String(formData.get("unit") ?? "each");
  const category = CATEGORIES.has(categoryRaw) ? categoryRaw : "General";
  const unit = UNITS.has(unitRaw) ? unitRaw : "each";
  if (name.length < 2) redirect("/admin/products?error=invalid");

  const duplicate = await prisma.workProduct.findFirst({
    where: {
      OR: [
        { name: { equals: name, mode: "insensitive" } },
        ...(sku ? [{ sku }] : []),
      ],
    },
  });
  if (duplicate) redirect("/admin/products?error=exists");

  await prisma.workProduct.create({
    data: { name, sku, category, unit },
  });
  await recordAudit({
    action: "product.created",
    userId: staff.id,
    entityType: "WorkProduct",
    summary: `${staff.name} added product ${name}`,
    details: { name, sku, category, unit },
  });
  await setFlash("created");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateWorkProductAction(formData: FormData): Promise<void> {
  const staff = await workdeskAdminOrRedirect();
  const id = String(formData.get("productId") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const sku = cleanSku(String(formData.get("sku") ?? ""));
  const categoryRaw = String(formData.get("category") ?? "General");
  const unitRaw = String(formData.get("unit") ?? "each");
  const isActive = String(formData.get("isActive") ?? "") === "1";
  if (!id || name.length < 2) return;

  await prisma.workProduct.update({
    where: { id },
    data: {
      name,
      sku,
      category: CATEGORIES.has(categoryRaw) ? categoryRaw : "General",
      unit: UNITS.has(unitRaw) ? unitRaw : "each",
      isActive,
    },
  });
  await recordAudit({
    action: "product.updated",
    userId: staff.id,
    entityType: "WorkProduct",
    entityId: id,
    summary: `${staff.name} updated product ${name}`,
    details: { name, sku, isActive },
  });
  await setFlash("saved");
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
