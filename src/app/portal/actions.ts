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

export type PortalLoginState = { error?: string };

export async function portalLoginAction(
  _prev: PortalLoginState,
  formData: FormData,
): Promise<PortalLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ip = "portal";

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
    return { error: "Those details were not recognised." };
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
  await createPortalSession(user.id);
  redirect("/portal");
}
