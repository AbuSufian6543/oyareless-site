"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BookOpen,
  Boxes,
  Briefcase,
  Building2,
  CalendarClock,
  CircleHelp,
  Code,
  ExternalLink,
  FileText,
  FolderTree,
  Gauge,
  Headset,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MessageSquare,
  Newspaper,
  Palette,
  Quote,
  Radio,
  Settings,
  ShieldAlert,
  TriangleAlert,
  Users,
  UserCircle,
  Wrench,
  X,
} from "lucide-react";

import { logoutAction } from "@/app/login/actions";
import {
  collectionsInGroup,
  type CollectionGroup,
} from "@/lib/admin-collections";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Icons referenced by the collection registry. Named explicitly rather than
 * resolved from a namespace import so the admin bundle only carries the icons
 * it actually renders.
 */
const COLLECTION_ICONS: Record<string, typeof LayoutDashboard> = {
  Activity,
  BookOpen,
  Boxes,
  Building2,
  CalendarClock,
  CircleHelp,
  Code,
  FileText,
  FolderTree,
  MessageSquare,
  TriangleAlert,
  Wrench,
};

type NavEntry = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  /** Minimum role rank required to see the item. */
  minRank?: number;
  badge?: number;
};

const ROLE_RANK: Record<string, number> = {
  VIEWER: 1,
  EDITOR: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
};

function collectionEntries(group: CollectionGroup): NavEntry[] {
  return collectionsInGroup(group).map((collection) => ({
    href: `/admin/collections/${collection.key}`,
    label: collection.plural,
    Icon: COLLECTION_ICONS[collection.icon] ?? FileText,
    minRank: ROLE_RANK[collection.writeRole],
  }));
}

export function AdminShell({
  user,
  newSubmissions,
  children,
}: {
  user: SessionUser;
  newSubmissions: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const rank = ROLE_RANK[user.role] ?? 1;

  const groups: Array<{ title: string; items: NavEntry[] }> = [
    {
      title: "Content",
      items: [
        { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
        { href: "/admin/pages", label: "Pages", Icon: FileText },
        { href: "/admin/streams", label: "Live Streams", Icon: Radio },
        { href: "/admin/posts", label: "News & Blog", Icon: Newspaper },
        { href: "/admin/jobs", label: "Careers", Icon: Briefcase },
        { href: "/admin/testimonials", label: "Testimonials", Icon: Quote },
        { href: "/admin/media", label: "Media Library", Icon: ImageIcon },
      ],
    },
    {
      title: "Catalogue",
      items: collectionEntries("Catalogue"),
    },
    {
      title: "Knowledge",
      items: collectionEntries("Knowledge"),
    },
    {
      title: "Enquiries",
      items: [
        {
          href: "/admin/submissions",
          label: "Inbox",
          Icon: Inbox,
          badge: newSubmissions,
        },
        { href: "/admin/subscribers", label: "Subscribers", Icon: Users },
        { href: "/admin/tickets", label: "Tickets", Icon: Headset },
        { href: "/admin/quotes", label: "Quotes", Icon: FileText },
        { href: "/admin/portal-users", label: "Portal users", Icon: Building2, minRank: 3 },
      ],
    },
    {
      title: "Operations",
      items: collectionEntries("Operations"),
    },
    {
      title: "Configuration",
      items: [
        { href: "/admin/navigation", label: "Navigation", Icon: Link2, minRank: 3 },
        { href: "/admin/branding", label: "Branding & Theme", Icon: Palette, minRank: 3 },
        {
          href: "/admin/remote-support",
          label: "Remote Support",
          Icon: Headset,
          minRank: 3,
        },
        { href: "/admin/redirects", label: "Redirects", Icon: ExternalLink, minRank: 3 },
        { href: "/admin/settings", label: "Site Settings", Icon: Settings, minRank: 3 },
        { href: "/admin/users", label: "Users & Access", Icon: Users, minRank: 4 },
        { href: "/admin/audit", label: "Audit Log", Icon: ShieldAlert, minRank: 4 },
      ],
    },
  ];

  // /admin/collections/services must not also light up /admin/collections/service-categories.
  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-navy-800 px-4">
        <Link href="/admin" className="flex items-center">
          <Image
            src="/brand/logo-inverse.png"
            alt="WirelessCom.Ca Inc."
            width={190}
            height={36}
            className="h-7 w-auto"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded p-1.5 text-navy-300 hover:bg-navy-800 lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {groups.map((group) => {
          const visible = group.items.filter(
            (item) => !item.minRank || rank >= item.minRank,
          );
          if (visible.length === 0) return null;

          return (
            <div key={group.title} className="mb-5">
              <p className="mb-1.5 px-3 text-[0.6875rem] font-bold uppercase tracking-wider text-navy-500">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {visible.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-brand-600 text-white"
                          : "text-navy-200 hover:bg-navy-800 hover:text-white",
                      )}
                    >
                      <item.Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-accent-500 px-1.5 py-0.5 text-[0.6875rem] font-bold text-navy-950">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-navy-800 p-3">
        <Link
          href="/admin/account"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-navy-800"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">
              {user.name}
            </span>
            <span className="block truncate text-xs text-navy-400">
              {user.role === "SUPERADMIN"
                ? "Super Admin"
                : user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </span>
          </span>
          <UserCircle className="size-4 text-navy-500" aria-hidden="true" />
        </Link>

        <div className="mt-1 flex gap-1">
          <Link
            href="/"
            target="_blank"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-navy-300 transition-colors hover:bg-navy-800 hover:text-white"
          >
            <Gauge className="size-3.5" aria-hidden="true" />
            View site
          </Link>
          <form action={logoutAction} className="flex-1">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-navy-300 transition-colors hover:bg-red-600/20 hover:text-red-300"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-60 lg:block">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-100 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-navy-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-navy-700 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <span className="font-bold text-navy-900">Admin</span>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
