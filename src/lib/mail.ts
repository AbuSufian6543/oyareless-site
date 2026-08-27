import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.smtp.isConfigured) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    // Port 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: env.smtp.secure || env.smtp.port === 465,
    auth: env.smtp.user
      ? { user: env.smtp.user, pass: env.smtp.password }
      : undefined,
    pool: true,
    maxConnections: 3,
  });

  return transporter;
}

export type MailResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "send_failed"; error?: string };

export async function sendMail(input: {
  to?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<MailResult> {
  const client = getTransporter();
  if (!client) {
    console.warn(
      `[mail] SMTP not configured — skipped sending "${input.subject}".`,
    );
    return { ok: false, reason: "not_configured" };
  }

  try {
    await client.sendMail({
      from: env.smtp.from,
      to: input.to ?? env.smtp.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? htmlToText(input.html),
      replyTo: input.replyTo,
    });
    return { ok: true };
  } catch (error) {
    console.error("[mail] send failed:", error);
    return {
      ok: false,
      reason: "send_failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function verifySmtp(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const client = getTransporter();
  if (!client) return { ok: false, error: "SMTP is not configured." };
  try {
    await client.verify();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(15,42,73,.08);">
          <tr>
            <td style="background:#0a2a4e;padding:20px 28px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-.2px;">WirelessCom<span style="color:#6fc04a;">.Ca</span> Inc.</span>
              <div style="color:#9dbadb;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;margin-top:3px;">Technology Service Provider</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 18px;font-size:19px;color:#0a2a4e;">${escapeHtml(title)}</h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="background:#f5f7fa;padding:18px 28px;color:#5a6b80;font-size:12px;line-height:1.6;border-top:1px solid #e3e9f0;">
              WirelessCom.Ca Inc. &middot; 97 White Oak Drive East, Sault Ste. Marie, ON P6B 4J7<br />
              Phone: 1-800-705-3189 &middot; <a href="${env.siteUrl}" style="color:#0a5fae;">${env.siteUrl.replace(/^https?:\/\//, "")}</a>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function detailRows(fields: Array<[string, string | undefined | null]>): string {
  return fields
    .filter(([, value]) => value && String(value).trim() !== "")
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:9px 12px;background:#f7f9fc;border:1px solid #e3e9f0;font-size:13px;color:#5a6b80;width:150px;vertical-align:top;">${escapeHtml(label)}</td>
          <td style="padding:9px 12px;border:1px solid #e3e9f0;font-size:14px;color:#12263f;white-space:pre-wrap;">${escapeHtml(String(value))}</td>
        </tr>`,
    )
    .join("");
}

const TYPE_LABEL: Record<string, string> = {
  CONTACT: "Contact enquiry",
  SUPPORT: "Technical support request",
  QUOTE: "Quote request",
  CALLBACK: "Callback request",
  APPLICATION: "Job application",
  OTHER: "Website enquiry",
};

/** Internal notification sent to staff. */
export function submissionNotificationEmail(input: {
  type: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  subject?: string | null;
  message: string;
  sourcePage?: string | null;
  extra?: Record<string, unknown>;
  submissionId: string;
  adminPath?: string;
}): { subject: string; html: string } {
  const label = TYPE_LABEL[input.type] ?? "Website enquiry";

  const extraRows = Object.entries(input.extra ?? {})
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(
      ([key, value]) =>
        [
          key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
          Array.isArray(value) ? value.join(", ") : String(value),
        ] as [string, string],
    );

  const body = `
    <p style="margin:0 0 16px;font-size:14px;color:#3c4e63;line-height:1.6;">
      A new ${escapeHtml(label.toLowerCase())} was submitted on the website.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${detailRows([
        ["Name", input.name],
        ["Email", input.email],
        ["Phone", input.phone],
        ["Company", input.company],
        ["Subject", input.subject],
        ["Submitted from", input.sourcePage],
        ...extraRows,
        ["Message", input.message],
      ])}
    </table>
    <p style="margin:20px 0 0;">
      <a href="${env.siteUrl}${input.adminPath ?? `/admin/submissions/${input.submissionId}`}"
         style="display:inline-block;background:#0a5fae;color:#ffffff;padding:11px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
        Open in admin
      </a>
    </p>`;

  return {
    subject: `[${label}] ${input.name}${input.company ? ` — ${input.company}` : ""}`,
    html: layout(label, body),
  };
}

/** Acknowledgement sent to the person who filled in the form. */
export function submissionAckEmail(input: {
  name: string;
  type: string;
  message: string;
}): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 14px;font-size:15px;color:#3c4e63;line-height:1.65;">
      Hello ${escapeHtml(input.name.split(" ")[0] || input.name)},
    </p>
    <p style="margin:0 0 14px;font-size:15px;color:#3c4e63;line-height:1.65;">
      Thank you for contacting WirelessCom.Ca Inc. We have received your message and a
      member of our team will respond shortly. For urgent service issues, please call
      <strong>1-800-705-3189</strong>.
    </p>
    <div style="margin:18px 0;padding:14px 16px;background:#f7f9fc;border-left:3px solid #6fc04a;border-radius:4px;">
      <div style="font-size:12px;color:#5a6b80;text-transform:uppercase;letter-spacing:.7px;margin-bottom:6px;">Your message</div>
      <div style="font-size:14px;color:#12263f;white-space:pre-wrap;">${escapeHtml(input.message)}</div>
    </div>
    <p style="margin:0;font-size:14px;color:#5a6b80;">— The WirelessCom.Ca team</p>`;

  return {
    subject: "We received your message — WirelessCom.Ca Inc.",
    html: layout("Thanks for getting in touch", body),
  };
}

export function subscriberConfirmEmail(input: {
  confirmUrl: string;
}): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#3c4e63;line-height:1.65;">
      Please confirm your email address to join the WirelessCom.Ca mailing list for
      service updates, technology news, and promotions.
    </p>
    <p style="margin:0 0 20px;">
      <a href="${input.confirmUrl}"
         style="display:inline-block;background:#6fc04a;color:#08331a;padding:12px 22px;border-radius:6px;text-decoration:none;font-size:15px;font-weight:700;">
        Confirm subscription
      </a>
    </p>
    <p style="margin:0;font-size:12px;color:#8194ab;">
      If you did not request this, you can safely ignore this email.
    </p>`;

  return {
    subject: "Confirm your subscription — WirelessCom.Ca Inc.",
    html: layout("Confirm your subscription", body),
  };
}

export function newUserInviteEmail(input: {
  name: string;
  email: string;
  temporaryPassword: string;
  role: string;
}): { subject: string; html: string } {
  const body = `
    <p style="margin:0 0 16px;font-size:15px;color:#3c4e63;line-height:1.65;">
      An administrator account has been created for you on the WirelessCom.Ca website.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${detailRows([
        ["Sign-in email", input.email],
        ["Temporary password", input.temporaryPassword],
        ["Role", input.role],
      ])}
    </table>
    <p style="margin:18px 0 0;font-size:14px;color:#b3261e;">
      You will be asked to choose a new password the first time you sign in.
    </p>
    <p style="margin:18px 0 0;">
      <a href="${env.siteUrl}/login"
         style="display:inline-block;background:#0a5fae;color:#ffffff;padding:11px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
        Sign in
      </a>
    </p>`;

  return {
    subject: "Your WirelessCom.Ca admin account",
    html: layout(`Welcome, ${input.name}`, body),
  };
}
