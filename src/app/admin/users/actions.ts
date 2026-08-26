"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import {
  hashPassword,
  requireRole,
  revokeAllSessions,
  validatePasswordStrength,
} from "@/lib/auth";
import { newUserInviteEmail, sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

const ROLES = ["SUPERADMIN", "ADMIN", "EDITOR", "VIEWER"] as const;
type RoleName = (typeof ROLES)[number];

const createSchema = z.object({
  name: z.string().trim().min(2, "Enter the person's name.").max(120),
  email: z.email("Enter a valid email address.").max(200),
  role: z.enum(ROLES),
  phone: z.string().trim().max(40).optional(),
  password: z.string().min(1),
});

export async function createUserAction(formData: FormData): Promise<void> {
  const actor = await requireRole("SUPERADMIN");

  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").toLowerCase(),
    role: formData.get("role"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
  });

  if (!parsed.success) redirect("/admin/users?error=invalid");

  if (validatePasswordStrength(parsed.data.password)) {
    redirect("/admin/users?error=weak");
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) redirect("/admin/users?error=duplicate");

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: formData.get("mustChangePassword") === "on",
      createdById: actor.id,
    },
  });

  await recordAudit({
    action: "user.created",
    userId: actor.id,
    entityType: "User",
    entityId: user.id,
    summary: `${user.email} as ${user.role}`,
  });

  if (formData.get("sendInvite") === "on") {
    const message = newUserInviteEmail({
      name: user.name,
      email: user.email,
      temporaryPassword: parsed.data.password,
      role: user.role,
    });
    await sendMail({
      to: user.email,
      subject: message.subject,
      html: message.html,
    }).catch(() => undefined);
  }

  redirect("/admin/users?created=1");
}

export async function updateUserAction(formData: FormData): Promise<void> {
  const actor = await requireRole("SUPERADMIN");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "");
  const role = (ROLES.includes(roleRaw as RoleName) ? roleRaw : "VIEWER") as RoleName;
  const isActive = formData.get("isActive") === "on";

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) redirect("/admin/users");

  // Never let the last super admin be demoted or disabled — that would lock
  // everyone out of user management.
  if (target.role === "SUPERADMIN" && (role !== "SUPERADMIN" || !isActive)) {
    const others = await prisma.user.count({
      where: { role: "SUPERADMIN", isActive: true, id: { not: id } },
    });
    if (others === 0) redirect("/admin/users?error=lastadmin");
  }

  await prisma.user.update({
    where: { id },
    data: {
      name: name || target.name,
      role,
      isActive,
      phone: String(formData.get("phone") ?? "").trim() || null,
      mustChangePassword: formData.get("mustChangePassword") === "on",
    },
  });

  // A demoted or disabled account should lose its live sessions immediately.
  if (!isActive || role !== target.role) {
    await revokeAllSessions(id);
  }

  await recordAudit({
    action: "user.updated",
    userId: actor.id,
    entityType: "User",
    entityId: id,
    summary: `${target.email} → ${role}${isActive ? "" : " (disabled)"}`,
  });

  redirect("/admin/users?saved=1");
}

export async function resetUserPasswordAction(
  formData: FormData,
): Promise<void> {
  const actor = await requireRole("SUPERADMIN");

  const id = String(formData.get("id") ?? "");
  const password = String(formData.get("password") ?? "");

  if (validatePasswordStrength(password)) redirect("/admin/users?error=weak");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) redirect("/admin/users");

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await hashPassword(password),
      mustChangePassword: formData.get("mustChangePassword") === "on",
    },
  });

  await revokeAllSessions(id);

  await recordAudit({
    action: "user.password_changed",
    userId: actor.id,
    entityType: "User",
    entityId: id,
    summary: `Password reset for ${target.email}`,
  });

  redirect("/admin/users?reset=1");
}

export async function disableTwoFactorAction(
  formData: FormData,
): Promise<void> {
  const actor = await requireRole("SUPERADMIN");
  const id = String(formData.get("id") ?? "");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) redirect("/admin/users");

  await prisma.user.update({
    where: { id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      recoveryCodes: Prisma.DbNull,
    },
  });

  await recordAudit({
    action: "user.2fa_disabled",
    userId: actor.id,
    entityType: "User",
    entityId: id,
    summary: `Reset by ${actor.email} for ${target.email}`,
  });

  redirect("/admin/users?tworeset=1");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const actor = await requireRole("SUPERADMIN");
  const id = String(formData.get("id") ?? "");

  if (id === actor.id) redirect("/admin/users?error=self");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) redirect("/admin/users");

  if (target.role === "SUPERADMIN") {
    const others = await prisma.user.count({
      where: { role: "SUPERADMIN", isActive: true, id: { not: id } },
    });
    if (others === 0) redirect("/admin/users?error=lastadmin");
  }

  await prisma.user.delete({ where: { id } });

  await recordAudit({
    action: "user.deleted",
    userId: actor.id,
    entityType: "User",
    entityId: id,
    summary: target.email,
  });

  redirect("/admin/users?deleted=1");
}
