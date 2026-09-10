"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import {
  Bell,
  ClipboardList,
  Headset,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCircle,
  X,
} from "lucide-react";

import { logoutAction } from "@/app/login/actions";
import { SavedToast } from "@/components/admin/saved-toast";
import type { SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function TechShell({
  user,
  unreadNotifications,
  openTickets = 0,
  openTasks = 0,
  logoUrl,
  flash,
  children,
}: {
  user: SessionUser;
  unreadNotifications: number;
  openTickets?: number;
  openTasks?: number;
  logoUrl?: string;
  flash?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = [
    { href: "/tech", label: "My work", Icon: LayoutDashboard },
    { href: "/tech/tickets", label: "Tickets", Icon: Headset, badge: openTickets },
    { href: "/tech/tasks", label: "Tasks", Icon: ClipboardList, badge: openTasks },
    { href: "/tech/notifications", label: "Notifications", Icon: Bell, badge: unreadNotifications },
  ];

  const isActive = (href: string) =>
    href === "/tech" ? pathname === "/tech" : pathname === href || pathname.startsWith(`${href}/`);

  const sidebar = (
    <div className="flex h-full flex-col bg-navy-900">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-navy-800 px-4">
        <Link href="/tech" className="flex items-center">
          <Image
            src={logoUrl || "/brand/logo-inverse.png"}
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
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Technician">
        <p className="mb-1.5 px-3 text-[0.6875rem] font-bold uppercase tracking-wider text-navy-500">
          My work
        </p>
        <ul className="space-y-0.5">
          {items.map((item) => (
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
      </nav>
      <div className="shrink-0 border-t border-navy-800 p-3">
        <Link
          href="/tech/account"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-navy-800"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
            <span className="block text-xs text-navy-400">Technician</span>
          </span>
          <UserCircle className="size-4 text-navy-500" />
        </Link>
        <form action={logoutAction} className="mt-1">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-navy-300 hover:bg-red-600/20 hover:text-red-300"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-slate-100">
      <aside className="fixed inset-y-0 left-0 hidden w-60 lg:block">{sidebar}</aside>
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
            <Menu className="size-5" />
          </button>
          <span className="font-bold text-navy-900">My work</span>
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <Suspense fallback={null}>
        <SavedToast flash={flash} />
      </Suspense>
    </div>
  );
}
