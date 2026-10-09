import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  sendMail,
  submissionAckEmail,
  submissionNotificationEmail,
} from "@/lib/mail";

const schema = z
  .object({
    type: z.enum(["CONTACT", "SUPPORT", "QUOTE", "CALLBACK"]).default("CONTACT"),
    name: z.string().trim().min(2, "Please enter your name.").max(120),
    email: z.string().trim().max(200).optional().or(z.literal("")),
    phone: z.string().trim().max(50).optional().or(z.literal("")),
    company: z.string().trim().max(160).optional().or(z.literal("")),
    subject: z.string().trim().max(200).optional().or(z.literal("")),
    message: z.string().trim().min(5, "Please include a message.").max(5000),
    sourcePage: z.string().trim().max(300).optional().or(z.literal("")),

    addressLine1: z.string().trim().max(300).optional().or(z.literal("")),
    city: z.string().trim().max(120).optional().or(z.literal("")),
    postalCode: z.string().trim().max(30).optional().or(z.literal("")),
    serviceInterest: z.string().trim().max(160).optional().or(z.literal("")),

    /** Honeypot: must stay empty. */
    website_url: z.string().max(0).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const email = data.email?.trim() ?? "";
    if (email && !z.string().email().safeParse(email).success) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Please enter a valid email address.",
      });
    }
    if (data.type !== "CALLBACK" && !email) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Please enter a valid email address.",
      });
    }
    if (data.type === "CALLBACK") {
      const digits = (data.phone ?? "").replace(/\D/g, "");
      if (digits.length < 10) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Please enter a phone number we can call.",
        });
      }
    }
  });

export async function POST(request: Request) {
  const ip = clientIp(request);

  const limit = rateLimit(`forms:${ip}`, 5, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        message:
          "Too many submissions from this connection. Please try again shortly or call 1-800-705-3189.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          parsed.error.issues[0]?.message ??
          "Please check the form and try again.",
      },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // Silently accept honeypot hits so bots do not learn they were caught.
  if (data.website_url) {
    return NextResponse.json({ message: "Thank you." }, { status: 200 });
  }

  const email = data.email?.trim().toLowerCase() ?? "";
  const extra: Record<string, string> = {};
  if (data.addressLine1) extra.address = data.addressLine1;
  if (data.city) extra.city = data.city;
  if (data.postalCode) extra.postalCode = data.postalCode;
  if (data.serviceInterest) extra.serviceInterest = data.serviceInterest;

  let submissionId: string;
  try {
    const submission = await prisma.formSubmission.create({
      data: {
        type: data.type,
        name: data.name,
        email,
        phone: data.phone || null,
        company: data.company || null,
        subject: data.subject || null,
        message: data.message,
        payload: extra,
        sourcePage: data.sourcePage || null,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });
    submissionId = submission.id;
  } catch (error) {
    console.error("[forms] failed to persist submission:", error);
    return NextResponse.json(
      {
        message:
          "We could not save your message. Please call 1-800-705-3189 and we will help right away.",
      },
      { status: 500 },
    );
  }

  // The inquiry is already stored, so email problems must not fail the request.
  const notification = submissionNotificationEmail({
    type: data.type,
    name: data.name,
    email,
    phone: data.phone,
    company: data.company,
    subject: data.subject,
    message: data.message,
    sourcePage: data.sourcePage,
    extra,
    submissionId,
  });

  const sent = await sendMail({
    subject: notification.subject,
    html: notification.html,
    replyTo: email || undefined,
  });

  if (sent.ok) {
    await prisma.formSubmission
      .update({ where: { id: submissionId }, data: { emailSentAt: new Date() } })
      .catch(() => undefined);

    if (email) {
      const ack = submissionAckEmail({
        name: data.name,
        type: data.type,
        message: data.message,
      });
      await sendMail({ to: email, subject: ack.subject, html: ack.html });
    }
  }

  return NextResponse.json({ message: "Thank you — your message was sent." });
}
