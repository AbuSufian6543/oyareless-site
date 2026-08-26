"use server";

import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import {
  createTotpSecret,
  getCurrentUser,
  generateRecoveryCodes,
  hashPassword,
  hashRecoveryCodes,
  revokeAllSessions,
  storeTotpSecret,
  validatePasswordStrength,
  verifyPassword,
  verifyTotpToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export async function updateProfileAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  await prisma.user.update({
    where: { id: user.id },
    data: { name: name || user.name, phone: phone || null },
  });

  redirect("/admin/account?saved=1");
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) redirect("/login");

  if (!(await verifyPassword(current, record.passwordHash))) {
    redirect("/admin/account?error=wrongpassword");
  }
  if (next !== confirm) redirect("/admin/account?error=mismatch");
  if (validatePasswordStrength(next)) redirect("/admin/account?error=weak");

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(next),
      mustChangePassword: false,
    },
  });

  await recordAudit({
    action: "user.password_changed",
    userId: user.id,
    entityType: "User",
    entityId: user.id,
    summary: "Changed their own password",
  });

  // Force a fresh sign-in everywhere, including this browser.
  await revokeAllSessions(user.id);
  redirect("/login?passwordChanged=1");
}

/**
 * Generates a fresh TOTP secret and stashes it (encrypted) on the user until
 * they confirm a code, at which point two-factor is switched on.
 */
export async function beginTwoFactorSetupAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const secret = createTotpSecret();

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: storeTotpSecret(secret), twoFactorEnabled: false },
  });

  redirect(`/admin/account?setup=${encodeURIComponent(secret)}`);
}

export async function confirmTwoFactorAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const token = String(formData.get("token") ?? "").replace(/\s/g, "");

  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { twoFactorSecret: true },
  });
  if (!record?.twoFactorSecret) redirect("/admin/account?error=nosetup");

  if (!(await verifyTotpToken(record.twoFactorSecret, token))) {
    redirect("/admin/account?error=badcode");
  }

  const codes = generateRecoveryCodes();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: true,
      recoveryCodes: (await hashRecoveryCodes(codes)) as never,
    },
  });

  await recordAudit({
    action: "user.2fa_enabled",
    userId: user.id,
    entityType: "User",
    entityId: user.id,
  });

  redirect(`/admin/account?codes=${encodeURIComponent(codes.join(","))}`);
}

export async function disableOwnTwoFactorAction(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const password = String(formData.get("password") ?? "");
  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) redirect("/login");

  if (!(await verifyPassword(password, record.passwordHash))) {
    redirect("/admin/account?error=wrongpassword");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      recoveryCodes: Prisma.DbNull,
    },
  });

  await recordAudit({
    action: "user.2fa_disabled",
    userId: user.id,
    entityType: "User",
    entityId: user.id,
    summary: "Disabled their own two-factor",
  });

  redirect("/admin/account?twooff=1");
}
