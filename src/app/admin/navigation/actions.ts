"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const LOCATIONS = ["HEADER", "FOOTER", "UTILITY"] as const;
type Location = (typeof LOCATIONS)[number];

export async function saveNavItemAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const id = String(formData.get("id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();
  const locationRaw = String(formData.get("location") ?? "HEADER");
  const location = (
    LOCATIONS.includes(locationRaw as Location) ? locationRaw : "HEADER"
  ) as Location;
  const parentId = String(formData.get("parentId") ?? "");

  if (!label || !href) redirect("/admin/navigation?error=invalid");

  const data = {
    label: label.slice(0, 80),
    href,
    location,
    order: Math.max(
      0,
      Number.parseInt(String(formData.get("order") ?? "0"), 10) || 0,
    ),
    openInNewTab: formData.get("openInNewTab") === "on",
    isVisible: formData.get("isVisible") === "on",
    parentId: parentId || null,
  };

  if (id) {
    // A menu item cannot be its own parent.
    if (data.parentId === id) data.parentId = null;
    await prisma.navItem.update({ where: { id }, data });
  } else {
    await prisma.navItem.create({ data });
  }

  await recordAudit({
    action: "nav.updated",
    userId: user.id,
    entityType: "NavItem",
    entityId: id || undefined,
    summary: `${label} → ${href}`,
  });

  revalidatePath("/", "layout");
  redirect("/admin/navigation?saved=1");
}

export async function deleteNavItemAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  await prisma.navItem.delete({ where: { id } }).catch(() => undefined);

  await recordAudit({
    action: "nav.updated",
    userId: user.id,
    entityType: "NavItem",
    entityId: id,
    summary: "Deleted",
  });

  revalidatePath("/", "layout");
  redirect("/admin/navigation?deleted=1");
}

/**
 * Seeds the custom menu from published pages so an admin has a starting point
 * instead of an empty screen.
 */
export async function seedNavFromPagesAction(): Promise<void> {
  const user = await requireRole("ADMIN");

  const existing = await prisma.navItem.count({ where: { location: "HEADER" } });
  if (existing > 0) redirect("/admin/navigation?error=exists");

  const pages = await prisma.page.findMany({
    where: { status: "PUBLISHED", showInHeaderNav: true },
    orderBy: { navOrder: "asc" },
    select: { title: true, navLabel: true, slug: true, navOrder: true },
  });

  if (pages.length === 0) redirect("/admin/navigation?error=nopages");

  await prisma.navItem.createMany({
    data: pages.map((page, index) => ({
      label: page.navLabel ?? page.title,
      href: page.slug === "home" ? "/" : `/${page.slug}`,
      location: "HEADER" as const,
      order: page.navOrder || index,
    })),
  });

  await recordAudit({
    action: "nav.updated",
    userId: user.id,
    entityType: "NavItem",
    summary: `Seeded ${pages.length} header items from pages`,
  });

  revalidatePath("/", "layout");
  redirect("/admin/navigation?saved=1");
}
