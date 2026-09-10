import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { unreadNotificationCount } from "@/lib/workdesk/notify";
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
  if (!user) redirect("/login");

  // VIEWER has no admin UI. Technicians are confined to /tech.
  if (user.role === "VIEWER") redirect("/");
  if (user.role === "TECHNICIAN") redirect("/tech");

  const [newSubmissions, settings, unreadNotifications] = await Promise.all([
    prisma.formSubmission.count({ where: { status: "NEW" } }).catch(() => 0),
    getSettings(),
    unreadNotificationCount(user.id).catch(() => 0),
  ]);

  return (
    <AdminShell
      user={user}
      newSubmissions={newSubmissions}
      unreadNotifications={unreadNotifications}
      logoUrl={settings.logoInverseUrl}
    >
      {children}
    </AdminShell>
  );
}
