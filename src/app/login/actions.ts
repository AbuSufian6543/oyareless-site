"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import {
  beginTwoFactorChallenge,
  clearTwoFactorChallenge,
  createSession,
  destroySession,
  isLoginThrottled,
  readTwoFactorChallenge,
  recordLoginAttempt,
  verifyPassword,
  verifyTotpToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LoginState = {
  error?: string;
  stage?: "credentials" | "twoFactor";
};

async function requestIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown"
  );
}

export async function loginAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await requestIp();

  if (!email || !password) {
    return { error: "Enter your email and password.", stage: "credentials" };
  }

  if (await isLoginThrottled(email, ip)) {
    await recordAudit({
      action: "user.login_failed",
      summary: `Throttled login attempt for ${email}`,
    });
    return {
      error:
        "Too many failed attempts. Please wait 15 minutes before trying again.",
      stage: "credentials",
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Identical response for unknown accounts and wrong passwords so the form
  // cannot be used to enumerate valid staff addresses.
  if (!user || !user.isActive) {
    await recordLoginAttempt(email, ip, false, "unknown_or_inactive");
    return { error: "Invalid email or password.", stage: "credentials" };
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    await recordLoginAttempt(email, ip, false, "bad_password");
    return { error: "Invalid email or password.", stage: "credentials" };
  }

  if (user.twoFactorEnabled && user.twoFactorSecret) {
    await beginTwoFactorChallenge(user.id);
    return { stage: "twoFactor" };
  }

  await recordLoginAttempt(email, ip, true);
  await createSession(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await recordAudit({
    action: "user.login",
    userId: user.id,
    summary: `${user.email} signed in`,
  });

  redirect(user.mustChangePassword ? "/admin/account?change=1" : "/admin");
}

export async function verifyTwoFactorAction(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const token = String(formData.get("token") ?? "").trim();
  const ip = await requestIp();

  const userId = await readTwoFactorChallenge();
  if (!userId) {
    return {
      error: "Your sign-in session expired. Please start again.",
      stage: "credentials",
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive || !user.twoFactorSecret) {
    await clearTwoFactorChallenge();
    return { error: "Unable to verify this account.", stage: "credentials" };
  }

  if (!(await verifyTotpToken(user.twoFactorSecret, token))) {
    await recordLoginAttempt(user.email, ip, false, "bad_totp");
    return { error: "That code is not valid. Try again.", stage: "twoFactor" };
  }

  await clearTwoFactorChallenge();
  await recordLoginAttempt(user.email, ip, true);
  await createSession(user.id);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await recordAudit({
    action: "user.login",
    userId: user.id,
    summary: `${user.email} signed in with 2FA`,
  });

  redirect(user.mustChangePassword ? "/admin/account?change=1" : "/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
