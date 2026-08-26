import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser, hasRole, type SessionUser } from "@/lib/auth";
import type { Role } from "@/generated/prisma/client";

/**
 * Page-level guard for admin routes. The sidebar already hides links the user
 * cannot use; this stops someone reaching the same screen by typing the URL.
 */
export async function requireAdminRole(minimum: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user, minimum)) redirect("/admin?denied=1");
  return user;
}
