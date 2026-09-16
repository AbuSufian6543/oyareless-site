"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { DEFAULT_NAV } from "@/lib/nav-defaults";
import { prisma } from "@/lib/prisma";

const LOCATIONS = ["HEADER", "FOOTER", "UTILITY"] as const;
type Location = (typeof LOCATIONS)[number];

function revalidateMenus() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/navigation");
}

export async function saveNavItemAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");

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

  revalidateMenus();
  redirect("/admin/navigation?saved=1");
}

export async function deleteNavItemAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");
  const id = String(formData.get("id") ?? "");

  await prisma.navItem.delete({ where: { id } }).catch(() => undefined);

  await recordAudit({
    action: "nav.updated",
    userId: user.id,
    entityType: "NavItem",
    entityId: id,
    summary: "Deleted",
  });

  revalidateMenus();
  redirect("/admin/navigation?deleted=1");
}

export async function reorderNavItemsAction(
  updates: Array<{ id: string; order: number; parentId: string | null }>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole("EDITOR").catch(() => null);
  if (!user) return { ok: false, error: "You are not signed in." };
  if (updates.length === 0) return { ok: true };
  if (updates.length > 200) return { ok: false, error: "Too many menu items." };

  try {
    await prisma.$transaction(
      updates.map((item) =>
        prisma.navItem.update({
          where: { id: item.id },
          data: {
            order: Math.max(0, Math.trunc(item.order)),
            parentId: item.parentId,
          },
        }),
      ),
    );
  } catch {
    return { ok: false, error: "The menu could not be reordered." };
  }

  await recordAudit({
    action: "nav.updated",
    userId: user.id,
    entityType: "NavItem",
    summary: `Reordered ${updates.length} menu items`,
  });

  revalidateMenus();
  return { ok: true };
}

export async function setNavItemVisibleAction(
  id: string,
  isVisible: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole("EDITOR").catch(() => null);
  if (!user) return { ok: false, error: "You are not signed in." };
  if (!id) return { ok: false, error: "Missing menu item." };

  try {
    await prisma.navItem.update({ where: { id }, data: { isVisible } });
  } catch {
    return { ok: false, error: "The menu item could not be updated." };
  }

  await recordAudit({
    action: "nav.updated",
    userId: user.id,
    entityType: "NavItem",
    entityId: id,
    summary: isVisible ? "Shown in menu" : "Hidden from menu",
  });

  revalidateMenus();
  return { ok: true };
}

/**
 * Loads the shipped Services / Tools / Support / Company menus when the
 * navigation table is still empty.
 */
export async function seedShippedNavAction(): Promise<void> {
  const user = await requireRole("EDITOR");

  const existing = await prisma.navItem.count();
  if (existing > 0) redirect("/admin/navigation?error=exists");

  for (const item of DEFAULT_NAV) {
    const parent = await prisma.navItem.create({
      data: {
        label: item.label,
        href: item.href,
        location: item.location,
        order: item.order,
      },
    });

    if (!item.children) continue;

    for (const [index, child] of item.children.entries()) {
      await prisma.navItem.create({
        data: {
          label: child.label,
          href: child.href,
          location: item.location,
          order: index,
          openInNewTab: child.openInNewTab ?? false,
          parentId: parent.id,
        },
      });
    }
  }

  await recordAudit({
    action: "nav.updated",
    userId: user.id,
    entityType: "NavItem",
    summary: "Loaded the shipped header and footer menus",
  });

  revalidateMenus();
  redirect("/admin/navigation?saved=1");
}
