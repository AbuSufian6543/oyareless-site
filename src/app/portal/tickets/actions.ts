"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requirePortalUser } from "@/lib/portal-auth";
import { scopeToCustomer } from "@/lib/portal-scope";
import { saveWorkdeskUploads } from "@/lib/workdesk/attachments";
import { recordWorkdeskEvent } from "@/lib/workdesk/events";
import {
  emailAdminInbox,
  notifyStaff,
  notifyWorkdeskUpdate,
} from "@/lib/workdesk/notify";
import { nextTicketReference } from "@/lib/workdesk/references";
import { revalidateWorkdesk } from "@/lib/workdesk/revalidate";
import { TICKET_CATEGORIES } from "@/lib/workdesk/labels";

async function attachFiles(messageId: string, formData: FormData) {
  const files = await saveWorkdeskUploads(formData);
  if (files.length === 0) return 0;
  await prisma.ticketAttachment.createMany({
    data: files.map((file) => ({
      messageId,
      filename: file.filename.split("/").pop() ?? file.filename,
      url: file.url,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    })),
  });
  return files.length;
}

export async function createTicketAction(formData: FormData): Promise<void> {
  const user = await requirePortalUser();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "General");
  const category = (TICKET_CATEGORIES as readonly string[]).includes(categoryRaw)
    ? categoryRaw
    : "General";
  if (subject.length < 3 || body.length < 5) redirect("/portal/tickets");

  const ticket = await prisma.ticket.create({
    data: {
      reference: await nextTicketReference(),
      subject: subject.slice(0, 200),
      category,
      customerId: user.customerId,
      createdById: user.id,
      messages: {
        create: { body: body.slice(0, 8000), authorCustomerUserId: user.id },
      },
    },
    include: { messages: true },
  });

  const first = ticket.messages[0];
  const fileCount = first ? await attachFiles(first.id, formData) : 0;

  await recordWorkdeskEvent({
    kind: "CREATED",
    summary: `${user.name} opened ${ticket.reference}`,
    ticketId: ticket.id,
    actorCustomerUserId: user.id,
  });
  if (fileCount > 0) {
    await recordWorkdeskEvent({
      kind: "ATTACHMENT",
      summary: `${user.name} attached ${fileCount} file${fileCount === 1 ? "" : "s"}`,
      ticketId: ticket.id,
      actorCustomerUserId: user.id,
    });
  }

  const admins = await prisma.user.findMany({
    where: { isActive: true, role: { in: ["EDITOR", "ADMIN", "SUPERADMIN"] } },
    select: { id: true },
  });
  await notifyStaff({
    userIds: admins.map((admin) => admin.id),
    title: `New ticket ${ticket.reference}`,
    body: `${user.name} opened ${ticket.subject}`,
    kind: "MESSAGE",
    ticketId: ticket.id,
  });
  await emailAdminInbox({
    title: `New ticket ${ticket.reference}: ${ticket.subject}`,
    detail: `${user.name} (${user.email}) opened ${ticket.reference}. ${body}`,
    href: `/admin/tickets/${ticket.id}`,
  });

  await revalidateWorkdesk({ ticketId: ticket.id, flash: false });
  redirect(`/portal/tickets/${ticket.id}`);
}

export async function replyTicketAction(formData: FormData): Promise<void> {
  const user = await requirePortalUser();
  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  scopeToCustomer(ticket, user.customerId);
  if (!ticket || body.length < 2) redirect(`/portal/tickets/${ticketId}`);
  if (ticket.status === "CLOSED") redirect(`/portal/tickets/${ticketId}`);

  const message = await prisma.ticketMessage.create({
    data: { ticketId, body: body.slice(0, 8000), authorCustomerUserId: user.id },
  });
  const fileCount = await attachFiles(message.id, formData);

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "OPEN" },
  });

  await recordWorkdeskEvent({
    kind: "MESSAGE",
    summary: `${user.name} replied`,
    ticketId,
    actorCustomerUserId: user.id,
  });
  if (fileCount > 0) {
    await recordWorkdeskEvent({
      kind: "ATTACHMENT",
      summary: `${user.name} attached files`,
      ticketId,
      actorCustomerUserId: user.id,
    });
  }

  await notifyWorkdeskUpdate({
    title: `${ticket.reference}: customer reply`,
    body: `${user.name} replied on ${ticket.subject}`,
    kind: "MESSAGE",
    ticketId,
  });

  await revalidateWorkdesk({ ticketId, flash: false });
  redirect(`/portal/tickets/${ticketId}`);
}
