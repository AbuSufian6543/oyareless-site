"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth";
import { hashToken, randomToken } from "@/lib/crypto";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/mail";
import { hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

export async function invitePortalUserAction(formData: FormData): Promise<void> {
  await requireRole("ADMIN");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const customerId = String(formData.get("customerId") ?? "");
  if (!email || !name || !customerId) return;

  const token = randomToken(24);
  const placeholder = await hashPassword(randomToken(24));

  try {
    await prisma.customerUser.create({
      data: {
        email,
        name,
        customerId,
        passwordHash: placeholder,
        mustChangePassword: true,
        inviteTokenHash: hashToken(token),
        inviteExpiresAt: new Date(Date.now() + 7 * 86_400_000),
      },
    });
  } catch {
    return;
  }

  const url = `${env.siteUrl}/portal/accept?token=${token}`;
  await sendMail({
    to: email,
    subject: "Your WirelessCom customer portal invite",
    html: `<p>Hello ${name},</p><p>An account was created for you on the WirelessCom.Ca customer portal.</p><p><a href="${url}">Choose a password</a></p><p>This link expires in 7 days.</p>`,
  });

  revalidatePath("/admin/portal-users");
}

export async function replyStaffTicketAction(formData: FormData): Promise<void> {
  const staff = await requireRole("EDITOR");
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const isInternal = formData.get("isInternal") === "on";
  if (!ticketId || body.length < 2) return;

  await prisma.ticketMessage.create({
    data: {
      ticketId,
      body: body.slice(0, 8000),
      authorStaffId: staff.id,
      authorStaffName: staff.name,
      isInternal,
    },
  });
  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...(isInternal ? {} : { status: "IN_PROGRESS" as const, firstResponseAt: new Date() }),
    },
  });
  revalidatePath(`/admin/tickets/${ticketId}`);
}
