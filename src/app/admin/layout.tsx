import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { cookies, headers } from "next/headers";
import { Suspense } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { NavCountProvider } from "@/components/admin/nav-counts";
import { NavCountsLoader } from "@/components/admin/nav-counts-loader";
import { getCurrentUser } from "@/lib/auth";
import { FLASH_COOKIE } from "@/lib/flash-client";
import { destinationAfterLogin, loginUrlFor } from "@/lib/safe-return";
import { getSettings } from "@/lib/settings";
import "../globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    const path = (await headers()).get("x-wc-path") || "/admin";
    redirect(loginUrlFor(path));
  }

  // VIEWER has no admin UI. Technicians stay on /tech. Employee, manager, and above use this workdesk.
  if (user.role === "VIEWER") redirect("/");
  if (user.role === "TECHNICIAN") {
    const path = (await headers()).get("x-wc-path") || "/tech";
    redirect(destinationAfterLogin(user, path));
  }

  const [settings, flashCookie] = await Promise.all([
    getSettings(),
    cookies(),
  ]);
  const flash = flashCookie.get(FLASH_COOKIE)?.value ?? null;

  return (
    <NavCountProvider>
      <AdminShell user={user} logoUrl={settings.logoInverseUrl} flash={flash}>
        {children}
      </AdminShell>
      <Suspense fallback={null}>
        <NavCountsLoader user={user} />
      </Suspense>
    </NavCountProvider>
  );
}
