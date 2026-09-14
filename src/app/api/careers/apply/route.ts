import { NextResponse } from "next/server";
import { z } from "zod";

import {
  GENERAL_APPLICATION_TITLE,
  RESUME_MAX_BYTES,
} from "@/lib/careers";
import {
  applicationAckEmail,
  applicationNotificationEmail,
  sendMail,
} from "@/lib/mail";
import { getResolvedMail } from "@/lib/mail-settings";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  deletePrivateResume,
  prepareResumePdf,
  storePrivateResume,
} from "@/lib/resume-pdf";
import { verifyTurnstileToken, isAllowedHumanCheckHost } from "@/lib/turnstile";
import { UploadError } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

function requestLooksSameSite(request: Request): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin" || site === "same-site" || site === "none") {
    return true;
  }
  const origin = request.headers.get("origin");
  if (!origin) return site === null;
  try {
    return isAllowedHumanCheckHost(new URL(origin).hostname);
  } catch {
    return false;
  }
}

const fields = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  phone: z.string().trim().min(7, "Please enter a phone number.").max(50),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
  jobId: z.string().trim().max(40).optional().or(z.literal("")),
  website_url: z.string().max(0).optional().or(z.literal("")),
  cfTurnstileResponse: z.string().max(4000).optional().or(z.literal("")),
});

const MAX_BODY = RESUME_MAX_BYTES + 256 * 1024;

export async function POST(request: Request) {
  if (!requestLooksSameSite(request)) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const lengthHeader = request.headers.get("content-length");
  const claimed = lengthHeader ? Number.parseInt(lengthHeader, 10) : 0;
  if (Number.isFinite(claimed) && claimed > MAX_BODY) {
    return NextResponse.json(
      { message: "That file is too large. Please upload a PDF under 3 MB." },
      { status: 413 },
    );
  }

  const ip = clientIp(request);
  const ipLimit = rateLimit(`careers:${ip}`, 3, 600);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      {
        message:
          "Too many applications from this connection. Please try again later.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
      },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = fields.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    location: String(formData.get("location") ?? ""),
    message: String(formData.get("message") ?? ""),
    jobId: String(formData.get("jobId") ?? ""),
    website_url: String(formData.get("website_url") ?? ""),
    cfTurnstileResponse: String(
      formData.get("cf-turnstile-response") ??
        formData.get("cfTurnstileResponse") ??
        "",
    ),
  });

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

  if (data.website_url) {
    return NextResponse.json({ message: "Thank you." }, { status: 200 });
  }

  const human = await verifyTurnstileToken(data.cfTurnstileResponse ?? "", ip);
  if (!human.ok) {
    return NextResponse.json({ message: human.message }, { status: 400 });
  }

  const emailLimit = rateLimit(
    `careers-email:${data.email.toLowerCase()}`,
    3,
    3600,
  );
  if (!emailLimit.allowed) {
    return NextResponse.json(
      {
        message:
          "Too many applications from this email. Please try again later.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(emailLimit.retryAfterSeconds) },
      },
    );
  }

  const resume = formData.get("resume");
  if (!(resume instanceof File)) {
    return NextResponse.json(
      { message: "Please attach your résumé as a PDF." },
      { status: 400 },
    );
  }

  let prepared;
  try {
    prepared = await prepareResumePdf(resume);
  } catch (error) {
    const message =
      error instanceof UploadError
        ? error.message
        : "That résumé could not be accepted. Please upload a PDF under 3 MB.";
    return NextResponse.json({ message }, { status: 400 });
  }

  let jobTitle = GENERAL_APPLICATION_TITLE;
  let jobId: string | null = null;
  if (data.jobId) {
    const job = await prisma.jobPosting
      .findFirst({
        where: {
          id: data.jobId,
          status: "PUBLISHED",
          OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }],
        },
        select: { id: true, title: true },
      })
      .catch(() => null);
    if (!job) {
      return NextResponse.json(
        { message: "That role is no longer open. Please apply as a general application." },
        { status: 400 },
      );
    }
    jobId = job.id;
    jobTitle = job.title;
  }

  let storagePath: string;
  try {
    storagePath = await storePrivateResume(prepared.buffer);
  } catch (error) {
    console.error("[careers] failed to store résumé:", error);
    return NextResponse.json(
      { message: "We could not save your résumé. Please try again." },
      { status: 500 },
    );
  }

  let applicationId: string;
  try {
    const application = await prisma.jobApplication.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        location: data.location || null,
        message: data.message || "",
        jobId,
        jobTitle,
        originalName: prepared.originalName,
        storagePath,
        sizeBytes: prepared.sizeBytes,
        sha256: prepared.sha256,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") ?? null,
      },
    });
    applicationId = application.id;
  } catch (error) {
    console.error("[careers] failed to persist application:", error);
    await deletePrivateResume(storagePath);
    return NextResponse.json(
      { message: "We could not save your application. Please try again." },
      { status: 500 },
    );
  }

  const mail = await getResolvedMail();
  const notification = applicationNotificationEmail({
    name: data.name,
    email: data.email,
    phone: data.phone,
    location: data.location,
    jobTitle,
    message: data.message || "",
    originalName: prepared.originalName,
    sizeBytes: prepared.sizeBytes,
    applicationId,
  });

  if (mail.hasCareerNotifyList && mail.isConfigured) {
    const recipients = mail.careerNotifyEmails.join(", ");
    const sent = await sendMail({
      to: recipients,
      subject: notification.subject,
      html: notification.html,
      replyTo: data.email,
      attachments: [
        {
          filename: prepared.originalName,
          content: prepared.buffer,
          contentType: "application/pdf",
        },
      ],
    });
    if (sent.ok) {
      await prisma.jobApplication
        .update({
          where: { id: applicationId },
          data: { emailSentAt: new Date() },
        })
        .catch(() => undefined);

      const ack = applicationAckEmail({ name: data.name, jobTitle });
      await sendMail({ to: data.email, subject: ack.subject, html: ack.html });
    }
  }

  return NextResponse.json({
    message: "Thank you — your application was received.",
  });
}
