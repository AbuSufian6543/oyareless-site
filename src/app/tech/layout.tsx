import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TechShell } from "@/components/tech/tech-shell";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { unreadNotificationCount } from "@/lib/workdesk/notify";
import "../globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Technician",
  robots: { index: false, follow: false },
};

export default async function TechLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "TECHNICIAN") {
    if (hasRole(user, "EDITOR")) redirect("/admin/tickets");
    redirect("/");
  }

  const [settings, unread] = await Promise.all([
    getSettings(),
    unreadNotificationCount(user.id).catch(() => 0),
  ]);

  return (
    <TechShell user={user} unreadNotifications={unread} logoUrl={settings.logoInverseUrl}>
      {children}
    </TechShell>
  );
}
