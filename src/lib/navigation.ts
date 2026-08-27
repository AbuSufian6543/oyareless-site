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

/**
 * Shown when Postgres is unreachable so the public header is never empty.
 * Live navigation still comes from NavItem once the database answers.
 */
const FALLBACK_HEADER: NavNode[] = [
  {
    id: "services",
    label: "Services",
    href: "/it-services",
    openInNewTab: false,
    children: [
      { id: "it", label: "IT Services", href: "/it-services", openInNewTab: false, children: [] },
      { id: "cyber", label: "Cybersecurity", href: "/cybersecurity", openInNewTab: false, children: [] },
      { id: "firewalls", label: "Firewalls", href: "/firewalls", openInNewTab: false, children: [] },
      { id: "ai", label: "AI cameras & phones", href: "/ai-services", openInNewTab: false, children: [] },
      { id: "security", label: "Security Systems", href: "/security-services", openInNewTab: false, children: [] },
      { id: "phone", label: "Telephone (VoIP)", href: "/telephone-services", openInNewTab: false, children: [] },
      { id: "internet", label: "Internet Services", href: "/internet-services", openInNewTab: false, children: [] },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    href: "/speed-test",
    openInNewTab: false,
    children: [
      { id: "speed", label: "Internet Speed Test", href: "/speed-test", openInNewTab: false, children: [] },
      { id: "net-tools", label: "Network Tools", href: "/network-tools", openInNewTab: false, children: [] },
      { id: "sec-tools", label: "Cybersecurity Tools", href: "/cybersecurity-tools", openInNewTab: false, children: [] },
    ],
  },
  {
    id: "support",
    label: "Support",
    href: "/support",
    openInNewTab: false,
    children: [
      { id: "remote", label: "Remote Support", href: "/remote-support", openInNewTab: false, children: [] },
      { id: "faq", label: "FAQ", href: "/faq", openInNewTab: false, children: [] },
      { id: "contact", label: "Contact", href: "/contact", openInNewTab: false, children: [] },
    ],
  },
];

export const getHeaderNav = cache(async (): Promise<NavNode[]> => {
  try {
    const nav = await loadNav("HEADER");
    return nav.length > 0 ? nav : FALLBACK_HEADER;
  } catch {
    return FALLBACK_HEADER;
  }
});

export const getFooterNav = cache(async (): Promise<NavNode[]> => {
  try {
    return await loadNav("FOOTER");
  } catch {
    return [];
  }
});
