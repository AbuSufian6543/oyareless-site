import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { randomToken } from "@/lib/crypto";
import { sendMail, subscriberConfirmEmail } from "@/lib/mail";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  const ip = clientIp(request);

  const limit = rateLimit(`subscribe:${ip}`, 5, 900);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many attempts. Please try again later." },
      { status: 429 },
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
      { message: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const confirmToken = randomToken(24);

  try {
    const existing = await prisma.subscriber.findUnique({ where: { email } });

    if (existing?.status === "CONFIRMED") {
      return NextResponse.json({
        message: "You are already subscribed. Thank you!",
      });
    }

    await prisma.subscriber.upsert({
      where: { email },
      create: {
        email,
        name: parsed.data.name,
        confirmToken,
        ipAddress: ip,
        status: "PENDING",
      },
      update: { confirmToken, status: "PENDING", ipAddress: ip },
    });
  } catch (error) {
    console.error("[subscribe] failed:", error);
    return NextResponse.json(
      { message: "We could not process that. Please try again." },
      { status: 500 },
    );
  }

  const confirmUrl = `${env.siteUrl}/api/subscribe/confirm?token=${confirmToken}`;
  const mail = subscriberConfirmEmail({ confirmUrl });
  const sent = await sendMail({
    to: email,
    subject: mail.subject,
    html: mail.html,
  });

  // Double opt-in is only possible once SMTP is configured; before that we
  // record the address and confirm immediately so no sign-up is lost.
  if (!sent.ok && sent.reason === "not_configured") {
    await prisma.subscriber
      .update({
        where: { email },
        data: { status: "CONFIRMED", confirmedAt: new Date(), confirmToken: null },
      })
      .catch(() => undefined);
    return NextResponse.json({
      message: "Thank you — you have been added to our mailing list.",
    });
  }

  return NextResponse.json({
    message: "Almost done! Check your inbox to confirm your subscription.",
  });
}
