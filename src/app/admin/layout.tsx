import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  // VIEWER exists for future read-only reporting access; it has no admin UI yet.
  if (user.role === "VIEWER") redirect("/");

  const newSubmissions = await prisma.formSubmission
    .count({ where: { status: "NEW" } })
    .catch(() => 0);

  return (
    <AdminShell user={user} newSubmissions={newSubmissions}>
      {children}
    </AdminShell>
  );
}
