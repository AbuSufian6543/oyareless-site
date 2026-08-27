import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { sendMail, submissionAckEmail, submissionNotificationEmail } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  contactName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  siteAddress: z.string().trim().max(300).optional().or(z.literal("")),
  details: z.string().trim().min(10).max(8000),
  timeframe: z.string().trim().max(80).optional().or(z.literal("")),
  budgetRange: z.string().trim().max(80).optional().or(z.literal("")),
  serviceAreas: z.array(z.string().max(80)).max(11).default([]),
  website_url: z.string().max(0).optional().or(z.literal("")),
  sourcePage: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`quotes:${ip}`, 5, 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many quote requests from this connection." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Please check the form." },
      { status: 400 },
    );
  }
  if (parsed.data.website_url) {
    return NextResponse.json({ message: "Thank you." });
  }

  const count = await prisma.quoteRequest.count().catch(() => 0);
  const reference = `Q-${String(count + 1).padStart(4, "0")}`;

  const quote = await prisma.quoteRequest.create({
    data: {
      reference,
      contactName: parsed.data.contactName,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      companyName: parsed.data.companyName || null,
      siteAddress: parsed.data.siteAddress || null,
      details: parsed.data.details,
      timeframe: parsed.data.timeframe || null,
      budgetRange: parsed.data.budgetRange || null,
      serviceAreas: parsed.data.serviceAreas,
      sourcePage: parsed.data.sourcePage ?? "/request-quote",
      ipAddress: ip === "unknown" ? null : ip,
    },
    select: { reference: true, id: true },
  });

  await Promise.all([
    sendMail({
      ...submissionNotificationEmail({
        type: "QUOTE",
        name: parsed.data.contactName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        company: parsed.data.companyName,
        subject: `Quote ${quote.reference}`,
        message: parsed.data.details,
        extra: { areas: parsed.data.serviceAreas.join(", ") },
        submissionId: quote.id,
        adminPath: `/admin/quotes/${quote.id}`,
      }),
      to: undefined,
    }).catch(() => undefined),
    sendMail({
      ...submissionAckEmail({
        name: parsed.data.contactName,
        type: "QUOTE",
        message: parsed.data.details,
      }),
      to: parsed.data.email,
    }).catch(() => undefined),
  ]);

  return NextResponse.json({ reference: quote.reference });
}
