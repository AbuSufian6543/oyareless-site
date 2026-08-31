"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { sendMail, verifySmtp } from "@/lib/mail";
import { updateMailSettings } from "@/lib/mail-settings";
import { DEFAULT_SETTINGS, updateSettings } from "@/lib/settings";

const BOOLEAN_KEYS = new Set([
  "announcementEnabled",
  "cookieBannerEnabled",
  "showLiveChatCta",
  "remoteSupportEnabled",
]);

/**
 * Settings are split across more than one admin screen, so each form says where
 * to land afterwards. Restricted to an allowlist rather than trusting the value.
 */
const RETURN_PATHS = new Set([
  "/admin/settings",
  "/admin/branding",
  "/admin/remote-support",
]);

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const requested = String(formData.get("returnTo") ?? "");
  const returnTo = RETURN_PATHS.has(requested) ? requested : "/admin/settings";

  const values: Record<string, string | boolean> = {};

  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (BOOLEAN_KEYS.has(key)) {
      // Checkboxes only appear on the screen that owns them; a form that does
      // not render the box must not silently switch it off.
      if (!formData.has(`present:${key}`)) continue;
      values[key] = formData.get(key) === "on";
      continue;
    }
    const raw = formData.get(key);
    if (raw === null) continue;
    values[key] = String(raw).trim();
  }

  await updateSettings(values as never);

  if (formData.has("smtpHost")) {
    const portRaw = String(formData.get("smtpPort") ?? "587").trim();
    const port = Number.parseInt(portRaw, 10);
    const mail: Parameters<typeof updateMailSettings>[0] = {
      smtpHost: String(formData.get("smtpHost") ?? "").trim(),
      smtpPort: Number.isFinite(port) && port > 0 ? String(port) : "587",
      smtpSecure: formData.get("smtpSecure") === "on",
      smtpUser: String(formData.get("smtpUser") ?? "").trim(),
      smtpFrom: String(formData.get("smtpFrom") ?? "").trim(),
      notifyEmails: String(formData.get("notifyEmails") ?? "").trim(),
    };
    const nextPassword = String(formData.get("smtpPassword") ?? "");
    if (nextPassword.trim()) {
      mail.smtpPassword = nextPassword.trim();
    }
    await updateMailSettings(mail);
  }

  await recordAudit({
    action: "settings.updated",
    userId: user.id,
    entityType: "SiteSetting",
    summary: "Site settings updated",
  });

  revalidatePath("/", "layout");
  redirect(`${returnTo}?saved=1`);
}

export async function testSmtpAction(): Promise<void> {
  const user = await requireRole("ADMIN");

  const verified = await verifySmtp();
  if (!verified.ok) {
    redirect("/admin/settings?mailerror=1");
  }

  const sent = await sendMail({
    to: user.email,
    subject: "SMTP test — WirelessCom.Ca Inc.",
    html: `<p>This is a test from the WirelessCom.Ca website. If you received it, SMTP is working.</p>
           <p>Office notifications will also use the addresses listed under Site Settings → Email.</p>`,
  });

  if (!sent.ok) {
    redirect("/admin/settings?mailerror=1");
  }

  await recordAudit({
    action: "settings.smtp_tested",
    userId: user.id,
    entityType: "SiteSetting",
    summary: `SMTP test sent to ${user.email}`,
  });

  redirect("/admin/settings?tested=1");
}
