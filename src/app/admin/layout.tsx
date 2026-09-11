import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { cookies, headers } from "next/headers";

import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/lib/auth";
import { FLASH_COOKIE } from "@/lib/flash-client";
import { prisma } from "@/lib/prisma";
import { destinationAfterLogin, loginUrlFor } from "@/lib/safe-return";
import { getSettings } from "@/lib/settings";
import {
  OPEN_TASK,
  OPEN_TICKET,
  taskAssignedTo,
  ticketAssignedTo,
} from "@/lib/workdesk/board";
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
  if (!user) {
    const path = (await headers()).get("x-wc-path") || "/admin";
    redirect(loginUrlFor(path));
  }

  // VIEWER has no admin UI. Technicians stay on /tech. Employee and above use this workdesk.
  if (user.role === "VIEWER") redirect("/");
  if (user.role === "TECHNICIAN") {
    const path = (await headers()).get("x-wc-path") || "/tech";
    redirect(destinationAfterLogin(user, path));
  }

  const [newSubmissions, newQuotes, settings, unreadNotifications, openTickets, openTasks] = await Promise.all([
    prisma.formSubmission.count({ where: { status: "NEW" } }).catch(() => 0),
    prisma.quoteRequest.count({ where: { status: "NEW" } }).catch(() => 0),
    getSettings(),
    unreadNotificationCount(user.id).catch(() => 0),
    prisma.ticket
      .count({ where: { ...OPEN_TICKET, ...ticketAssignedTo(user.id) } })
      .catch(() => 0),
    prisma.internalTask
      .count({ where: { ...OPEN_TASK, ...taskAssignedTo(user.id) } })
      .catch(() => 0),
  ]);

  const flash = (await cookies()).get(FLASH_COOKIE)?.value ?? null;

  return (
    <AdminShell
      user={user}
      newSubmissions={newSubmissions}
      newQuotes={newQuotes}
      unreadNotifications={unreadNotifications}
      openTickets={openTickets}
      openTasks={openTasks}
      logoUrl={settings.logoInverseUrl}
      flash={flash}
    >
      {children}
    </AdminShell>
  );
}
