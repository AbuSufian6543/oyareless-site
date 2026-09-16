"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { requireAllowed } from "@/lib/auth";
import { hashToken, randomToken } from "@/lib/crypto";
import { portalInviteEmail, sendMail } from "@/lib/mail";
import { hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { publicUrl } from "@/lib/public-url";
import { canAccessPortalUsers } from "@/lib/staff-access";

const NEW_CUSTOMER_VALUE = "__new__";
const INVITE_DAYS = 7;

const personSchema = z.object({
  name: z.string().trim().min(2, "Enter the person's name.").max(120),
  email: z.email("Enter a valid email address.").max(200),
});

export type InvitePortalUserState = {
  ok?: boolean;
  resent?: boolean;
  emailed?: boolean;
  inviteUrl?: string;
  message?: string;
  error?: string;
};

type PortalUserRow = {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  customerId: string;
};

export async function invitePortalUserAction(
  _prev: InvitePortalUserState,
  formData: FormData,
): Promise<InvitePortalUserState> {
  const actor = await requireAllowed(canAccessPortalUsers);

  const parsed = personSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the name and email." };
  }

  const { name, email } = parsed.data;
  const customerIdRaw = String(formData.get("customerId") ?? "").trim();
  const newCustomerName = String(formData.get("newCustomerName") ?? "").trim();
  const creatingNew =
    customerIdRaw === NEW_CUSTOMER_VALUE || (!customerIdRaw && Boolean(newCustomerName));

  const existing = await prisma.customerUser.findUnique({
    where: { email },
    include: { customer: { select: { name: true } } },
  });

  if (existing) {
    if (!existing.inviteTokenHash) {
      return {
        error: `${email} already has portal access for ${existing.customer.name}.`,
      };
    }
    if (creatingNew) {
      return {
        error: `${email} already has a pending invite for ${existing.customer.name}. Use Resend invite on that row.`,
      };
    }
    if (customerIdRaw && customerIdRaw !== existing.customerId) {
      return {
        error: `${email} already belongs to ${existing.customer.name}. Pick that customer, or use a different email.`,
      };
    }
    return finishInvite(actor.id, existing, "resent");
  }

  let customerId: string;
  if (creatingNew) {
    if (newCustomerName.length < 2) {
      return { error: "Enter the customer (company) name, or choose an existing customer." };
    }
    const customer = await prisma.customer.create({
      data: {
        name: newCustomerName.slice(0, 200),
        email,
      },
    });
    customerId = customer.id;
    await recordAudit({
      action: "collection.created",
      userId: actor.id,
      entityType: "Customer",
      entityId: customer.id,
      summary: customer.name,
    });
  } else {
    if (!customerIdRaw) {
      return { error: "Choose a customer, or create a new one." };
    }
    const customer = await prisma.customer.findUnique({ where: { id: customerIdRaw } });
    if (!customer) {
      return { error: "That customer was not found. Refresh the page and try again." };
    }
    if (!customer.isActive) {
      return {
        error: `${customer.name} is inactive. Reactivate them under Customers, then send the invite.`,
      };
    }
    customerId = customer.id;
  }

  let user;
  try {
    user = await prisma.customerUser.create({
      data: {
        email,
        name,
        customerId,
        passwordHash: await hashPassword(randomToken(24)),
        mustChangePassword: true,
      },
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") {
      return { error: "That email already has a portal account." };
    }
    if (code === "P2003") {
      return { error: "That customer was not found. Refresh the page and try again." };
    }
    throw error;
  }

  return finishInvite(actor.id, user, "created");
}

export async function resendPortalInviteAction(
  _prev: InvitePortalUserState,
  formData: FormData,
): Promise<InvitePortalUserState> {
  const actor = await requireAllowed(canAccessPortalUsers);
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "That portal user was not found." };

  const user = await prisma.customerUser.findUnique({
    where: { id },
    include: { customer: { select: { name: true } } },
  });
  if (!user) return { error: "That portal user was not found." };

  return finishInvite(actor.id, user, "resent");
}

async function finishInvite(
  actorId: string,
  user: PortalUserRow,
  kind: "created" | "resent",
): Promise<InvitePortalUserState> {
  if (!user.isActive) {
    return { error: "That portal account is disabled. Reactivate it before sending another invite." };
  }

  const customer = await prisma.customer.findUnique({ where: { id: user.customerId } });
  if (!customer) {
    return { error: "That customer was not found. Refresh the page and try again." };
  }
  if (!customer.isActive) {
    return {
      error: `${customer.name} is inactive. Reactivate them under Customers, then send the invite.`,
    };
  }

  const token = randomToken(24);
  await prisma.customerUser.update({
    where: { id: user.id },
    data: {
      inviteTokenHash: hashToken(token),
      inviteExpiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
      mustChangePassword: true,
    },
  });

  const inviteUrl = publicUrl(`/portal/accept?token=${encodeURIComponent(token)}`);
  const message = portalInviteEmail({
    name: user.name,
    inviteUrl,
    days: INVITE_DAYS,
  });
  const mailed = await sendMail({
    to: user.email,
    subject: message.subject,
    html: message.html,
  });

  await recordAudit({
    action: kind === "created" ? "portal_user.invited" : "portal_user.invite_resent",
    userId: actorId,
    entityType: "CustomerUser",
    entityId: user.id,
    summary: `${user.email} (${customer.name})`,
  });

  revalidatePath("/admin/portal-users");

  if (mailed.ok) {
    return {
      ok: true,
      resent: kind === "resent",
      emailed: true,
      inviteUrl,
      message:
        kind === "resent"
          ? `A new invite was emailed to ${user.email}.`
          : `Invite emailed to ${user.email}.`,
    };
  }

  const why =
    mailed.reason === "not_configured"
      ? "Email (SMTP) is not configured under Site Settings."
      : "The email could not be sent.";

  return {
    ok: true,
    resent: kind === "resent",
    emailed: false,
    inviteUrl,
    message: `The invite was saved, but ${why} Copy the link below and send it to ${user.email}.`,
  };
}
