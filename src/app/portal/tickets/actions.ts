"use server";

import { redirect } from "next/navigation";

import { sendMail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { requirePortalUser } from "@/lib/portal-auth";
import { scopeToCustomer } from "@/lib/portal-scope";
import { env } from "@/lib/env";

export async function createTicketAction(formData: FormData): Promise<void> {
  const user = await requirePortalUser();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (subject.length < 3 || body.length < 5) redirect("/portal/tickets");

  const count = await prisma.ticket.count();
  const ticket = await prisma.ticket.create({
    data: {
      reference: `WC-${String(count + 1).padStart(4, "0")}`,
      subject: subject.slice(0, 200),
      customerId: user.customerId,
      createdById: user.id,
      messages: {
        create: { body: body.slice(0, 8000), authorCustomerUserId: user.id },
      },
    },
  });

  await sendMail({
    subject: `New ticket ${ticket.reference}: ${ticket.subject}`,
    html: `<p>${user.name} (${user.email}) opened ${ticket.reference}.</p><p>${body}</p><p><a href="${env.siteUrl}/admin/tickets/${ticket.id}">Open in admin</a></p>`,
  }).catch(() => undefined);

  redirect(`/portal/tickets/${ticket.id}`);
}

export async function replyTicketAction(formData: FormData): Promise<void> {
  const user = await requirePortalUser();
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  scopeToCustomer(ticket, user.customerId);
  if (body.length < 2) redirect(`/portal/tickets/${ticketId}`);

  await prisma.ticketMessage.create({
    data: { ticketId, body: body.slice(0, 8000), authorCustomerUserId: user.id },
  });
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "OPEN" },
  });
  redirect(`/portal/tickets/${ticketId}`);
}
