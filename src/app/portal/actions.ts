"use server";

import { redirect } from "next/navigation";

import {
  isLoginThrottled,
  recordLoginAttempt,
  verifyPassword,
} from "@/lib/auth";
import { hashToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import {
  createPortalSession,
  destroyPortalSession,
} from "@/lib/portal-auth";
import { hashPassword, validatePasswordStrength } from "@/lib/passwords";
import { rateLimit } from "@/lib/rate-limit";
import { requestClientIp } from "@/lib/request-ip";
import { TURNSTILE_ACTIONS } from "@/lib/turnstile-constants";
import { verifyAuthHumanCheck } from "@/lib/turnstile";

export type PortalLoginState = { error?: string };

export async function portalLoginAction(
  _prev: PortalLoginState,
  formData: FormData,
): Promise<PortalLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = await requestClientIp();

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const human = await verifyAuthHumanCheck(
    formData,
    ip,
    TURNSTILE_ACTIONS.portalLogin,
  );
  if (!human.ok) return { error: human.message };

  if (await isLoginThrottled(email, ip)) {
    return { error: "Too many attempts. Please wait 15 minutes." };
  }

  const user = await prisma.customerUser.findUnique({
    where: { email },
    include: { customer: true },
  });

  if (
    !user ||
    !user.isActive ||
    !user.customer.isActive ||
    !(await verifyPassword(password, user.passwordHash))
  ) {
    await recordLoginAttempt(email, ip, false, "portal");
    return { error: "Those details were not recognized." };
  }

  await recordLoginAttempt(email, ip, true, "portal");
  await prisma.customerUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await createPortalSession(user.id);
  redirect("/portal");
}

export async function portalLogoutAction(): Promise<void> {
  await destroyPortalSession();
  redirect("/portal/login");
}

export async function acceptInviteAction(
  _prev: PortalLoginState,
  formData: FormData,
): Promise<PortalLoginState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const ip = await requestClientIp();

  const human = await verifyAuthHumanCheck(
    formData,
    ip,
    TURNSTILE_ACTIONS.portalInvite,
  );
  if (!human.ok) return { error: human.message };

  const inviteLimit = rateLimit(`portal-invite:${ip}`, 8, 3600);
  if (!inviteLimit.allowed) {
    return { error: "Too many attempts. Please wait before trying again." };
  }

  const weak = validatePasswordStrength(password);
  if (weak) return { error: weak };

  const user = await prisma.customerUser.findFirst({
    where: {
      inviteTokenHash: hashToken(token),
      inviteExpiresAt: { gt: new Date() },
    },
  });
  if (!user) return { error: "That invite is invalid or has expired." };

  await prisma.customerUser.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      inviteTokenHash: null,
      inviteExpiresAt: null,
      mustChangePassword: false,
    },
  });
  await recordLoginAttempt(user.email, ip, true, "portal-invite");
  await createPortalSession(user.id);
  redirect("/portal");
}
