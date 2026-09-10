"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { setFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import {
  allocateQuoteReference,
  parseQuoteServiceAreas,
  QUOTE_STATUS_VALUES,
  quoteRespondedAt,
} from "@/lib/quotes";

const quoteSchema = z.object({
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  siteAddress: z.string().trim().max(300).optional().or(z.literal("")),
  details: z.string().trim().min(1).max(8000),
  timeframe: z.string().trim().max(80).optional().or(z.literal("")),
  budgetRange: z.string().trim().max(80).optional().or(z.literal("")),
  status: z.enum(QUOTE_STATUS_VALUES),
  customerId: z.string().trim().max(40).optional().or(z.literal("")),
  internalNotes: z.string().trim().max(4000).optional().or(z.literal("")),
});

function readQuote(formData: FormData) {
  return quoteSchema.safeParse({
    contactName: formData.get("contactName"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    companyName: formData.get("companyName") ?? "",
    siteAddress: formData.get("siteAddress") ?? "",
    details: formData.get("details"),
    timeframe: formData.get("timeframe") ?? "",
    budgetRange: formData.get("budgetRange") ?? "",
    status: formData.get("status"),
    customerId: formData.get("customerId") ?? "",
    internalNotes: formData.get("internalNotes") ?? "",
  });
}

function quoteValues(
  data: z.infer<typeof quoteSchema>,
  serviceAreas: string[],
  previousRespondedAt: Date | null,
) {
  return {
    contactName: data.contactName,
    email: data.email.toLowerCase(),
    phone: data.phone || null,
    companyName: data.companyName || null,
    siteAddress: data.siteAddress || null,
    details: data.details,
    timeframe: data.timeframe || null,
    budgetRange: data.budgetRange || null,
    status: data.status,
    customerId: data.customerId || null,
    internalNotes: data.internalNotes || null,
    serviceAreas,
    respondedAt: quoteRespondedAt(data.status, previousRespondedAt),
  };
}

function revalidateQuotes(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/quotes");
  revalidatePath("/portal/quotes");
  if (id) revalidatePath(`/admin/quotes/${id}`);
}

export async function saveQuoteAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");
  const id = String(formData.get("id") ?? "");
  const parsed = readQuote(formData);
  const serviceAreas = parseQuoteServiceAreas(formData);

  if (!parsed.success) {
    redirect(id ? `/admin/quotes/${id}?error=invalid` : "/admin/quotes/new?error=invalid");
  }

  const customerId = parsed.data.customerId || null;
  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });
    if (!customer) {
      redirect(id ? `/admin/quotes/${id}?error=invalid` : "/admin/quotes/new?error=invalid");
    }
  }

  if (id) {
    const existing = await prisma.quoteRequest.findUnique({ where: { id } });
    if (!existing) redirect("/admin/quotes");

    await prisma.quoteRequest.update({
      where: { id },
      data: quoteValues(parsed.data, serviceAreas, existing.respondedAt),
    });

    await recordAudit({
      action: "quote.updated",
      userId: user.id,
      entityType: "QuoteRequest",
      entityId: id,
      summary: `${existing.reference} · ${parsed.data.contactName}`,
    });
    await setFlash("saved");
    revalidateQuotes(id);
    redirect(`/admin/quotes/${id}?saved=1`);
  }

  const reference = await allocateQuoteReference();
  const created = await prisma.quoteRequest.create({
    data: {
      reference,
      sourcePage: "staff",
      ...quoteValues(parsed.data, serviceAreas, null),
    },
    select: { id: true, reference: true },
  });

  await recordAudit({
    action: "quote.created",
    userId: user.id,
    entityType: "QuoteRequest",
    entityId: created.id,
    summary: `${created.reference} · ${parsed.data.contactName}`,
  });
  await setFlash("created");
  revalidateQuotes(created.id);
  redirect(`/admin/quotes/${created.id}?created=1`);
}

export async function deleteQuoteAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");
  const id = String(formData.get("id") ?? "");

  const quote = await prisma.quoteRequest.findUnique({
    where: { id },
    select: { id: true, reference: true, contactName: true },
  });
  if (!quote) redirect("/admin/quotes");

  await prisma.quoteRequest.delete({ where: { id } });

  await recordAudit({
    action: "quote.deleted",
    userId: user.id,
    entityType: "QuoteRequest",
    entityId: id,
    summary: `${quote.reference} · ${quote.contactName}`,
  });
  await setFlash("deleted");
  revalidateQuotes();
  redirect("/admin/quotes?deleted=1");
}
