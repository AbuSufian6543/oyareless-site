"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { revokeAllSessions } from "@/lib/auth";
import { hashToken, randomToken } from "@/lib/crypto";
import { env } from "@/lib/env";
import { passwordResetEmail, sendMail } from "@/lib/mail";
import { getResolvedMail } from "@/lib/mail-settings";
import { hashPassword, validatePasswordStrength } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const RESET_TTL_MS = 60 * 60 * 1000;

async function requestIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown"
  );
}

export type ResetRequestState = { error?: string; sent?: boolean };
export type ResetCompleteState = { error?: string };

export async function requestPasswordResetAction(
  _previous: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const ip = await requestIp();

  if (!email) {
    return { error: "Enter the email address for your staff account." };
  }

  const ipLimit = rateLimit(`pwreset-ip:${ip}`, 8, 3600);
  const emailLimit = rateLimit(`pwreset-email:${email}`, 4, 3600);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    return {
      error: "Too many reset requests. Please wait before trying again.",
    };
  }

  const mail = await getResolvedMail();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, isActive: true },
  });

  // Same response whether the account exists or not, so this form cannot be
  // used to discover staff addresses.
  if (!user || !user.isActive || !mail.isConfigured) {
    await recordAudit({
      action: "user.password_reset_requested",
      summary: `Password reset requested for ${email}`,
    });
    return { sent: true };
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomToken(32);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const message = passwordResetEmail({
    name: user.name,
    resetUrl: `${env.siteUrl}/login/reset?token=${encodeURIComponent(token)}`,
  });

  await sendMail({
    to: user.email,
    subject: message.subject,
    html: message.html,
  });

  await recordAudit({
    action: "user.password_reset_requested",
    userId: user.id,
    summary: `Password reset email sent to ${user.email}`,
  });

  return { sent: true };
}

export async function completePasswordResetAction(
  _previous: ResetCompleteState,
  formData: FormData,
): Promise<ResetCompleteState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!token) {
    return { error: "This reset link is missing. Request a new one." };
  }
  if (password !== confirm) {
    return { error: "The two passwords do not match." };
  }
  const weak = validatePasswordStrength(password);
  if (weak) return { error: weak };

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, isActive: true } } },
  });

  if (
    !record ||
    record.usedAt ||
    record.expiresAt.getTime() < Date.now() ||
    !record.user.isActive
  ) {
    return {
      error: "This reset link has expired or has already been used. Request a new one.",
    };
  }

  const passwordHash = await hashPassword(password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await revokeAllSessions(record.userId);

  await recordAudit({
    action: "user.password_reset_completed",
    userId: record.userId,
    summary: `${record.user.email} reset their password`,
  });

  redirect("/login?reset=1");
}
