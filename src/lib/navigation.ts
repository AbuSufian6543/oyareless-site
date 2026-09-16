import "server-only";

import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";

import { isTransientDbError, prisma, withTimeout } from "@/lib/prisma";
import {
  defaultNavNodes,
  filterVisibleNav,
  mergeNavWithDefaults,
} from "@/lib/nav-defaults";
import type { NavLocation } from "@/generated/prisma/client";

export type NavNode = {
  id: string;
  label: string;
  href: string;
  openInNewTab: boolean;
  children: NavNode[];
  isVisible?: boolean;
};

const FALLBACK_HEADER = defaultNavNodes("HEADER");
const FALLBACK_FOOTER = defaultNavNodes("FOOTER");

/**
 * Navigation is admin-managed via NavItem. Hidden rows are kept so they are
 * not treated as missing and re-inserted from the shipped menu. Missing
 * shipped links are still filled. If Postgres does not answer, the same full
 * menu is used and the response is not cached.
 */
async function loadNav(location: NavLocation): Promise<NavNode[]> {
  const items = await withTimeout(
    prisma.navItem.findMany({
      where: { location, parentId: null },
      orderBy: { order: "asc" },
      include: {
        children: {
          orderBy: { order: "asc" },
        },
      },
    }),
  );

  if (items.length > 0) {
    return items.map((item) => ({
      id: item.id,
      label: item.label,
      href: item.href,
      openInNewTab: item.openInNewTab,
      isVisible: item.isVisible,
      children: item.children.map((child) => ({
        id: child.id,
        label: child.label,
        href: child.href,
        openInNewTab: child.openInNewTab,
        isVisible: child.isVisible,
        children: [],
      })),
    }));
  }

  const pages = await withTimeout(
    prisma.page.findMany({
      where: {
        status: "PUBLISHED",
        ...(location === "FOOTER"
          ? { showInFooterNav: true }
          : { showInHeaderNav: true }),
      },
      orderBy: { navOrder: "asc" },
      select: { id: true, slug: true, title: true, navLabel: true },
    }),
  );

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
    const nav = await loadNav("HEADER");
    return filterVisibleNav(mergeNavWithDefaults(nav, FALLBACK_HEADER));
  } catch (error) {
    if (isTransientDbError(error)) noStore();
    return FALLBACK_HEADER;
  }
});

export const getFooterNav = cache(async (): Promise<NavNode[]> => {
  try {
    const nav = await loadNav("FOOTER");
    return filterVisibleNav(mergeNavWithDefaults(nav, FALLBACK_FOOTER));
  } catch (error) {
    if (isTransientDbError(error)) noStore();
    return FALLBACK_FOOTER;
  }
});
