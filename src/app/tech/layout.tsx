import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TechShell } from "@/components/tech/tech-shell";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { unreadNotificationCount } from "@/lib/workdesk/notify";
import { technicianTaskWhere, technicianTicketWhere } from "@/lib/workdesk/access";
import { prisma } from "@/lib/prisma";
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

  const [settings, unread, openTickets, openTasks] = await Promise.all([
    getSettings(),
    unreadNotificationCount(user.id).catch(() => 0),
    prisma.ticket
      .count({
        where: {
          ...technicianTicketWhere(user.id),
          status: { notIn: ["RESOLVED", "CLOSED"] },
        },
      })
      .catch(() => 0),
    prisma.internalTask
      .count({
        where: {
          ...technicianTaskWhere(user.id),
          status: { notIn: ["COMPLETED", "CLOSED"] },
        },
      })
      .catch(() => 0),
  ]);

  return (
    <TechShell
      user={user}
      unreadNotifications={unread}
      openTickets={openTickets}
      openTasks={openTasks}
      logoUrl={settings.logoInverseUrl}
    >
      {children}
    </TechShell>
  );
}
