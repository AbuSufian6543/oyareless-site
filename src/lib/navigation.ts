import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { NavLocation } from "@/generated/prisma/client";

export type NavNode = {
  id: string;
  label: string;
  href: string;
  openInNewTab: boolean;
  children: NavNode[];
};

/**
 * Navigation is admin-managed via NavItem. If an admin has not configured it
 * yet, published pages flagged `showInHeaderNav` are used instead so the site
 * is never left without a menu.
 */
async function loadNav(location: NavLocation): Promise<NavNode[]> {
  const items = await prisma.navItem.findMany({
    where: { location, isVisible: true, parentId: null },
    orderBy: { order: "asc" },
    include: {
      children: {
        where: { isVisible: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (items.length > 0) {
    return items.map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      openInNewTab: item.openInNewTab,
      children: item.children.map((child) => ({
        id: child.id,
        label: child.label,
        href: child.href,
        openInNewTab: child.openInNewTab,
        children: [],
      })),
    }));
  }

  const pages = await prisma.page.findMany({
    where: {
      status: "PUBLISHED",
      ...(location === "FOOTER"
        ? { showInFooterNav: true }
        : { showInHeaderNav: true }),
    },
    orderBy: { navOrder: "asc" },
    select: { id: true, slug: true, title: true, navLabel: true },
  });

  return pages.map((page) => ({
    id: page.id,
    label: page.navLabel ?? page.title,
    href: page.slug === "home" ? "/" : `/${page.slug}`,
    openInNewTab: false,
    children: [],
  }));
}

export const getHeaderNav = cache(async (): Promise<NavNode[]> => {
  try {
    return await loadNav("HEADER");
  } catch {
    return [];
  }
});

export const getFooterNav = cache(async (): Promise<NavNode[]> => {
  try {
    return await loadNav("FOOTER");
  } catch {
    return [];
  }
});
