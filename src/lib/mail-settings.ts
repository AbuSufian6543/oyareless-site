import "server-only";

import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { env } from "@/lib/env";
import { prisma, withTimeout } from "@/lib/prisma";

/**
 * SMTP and notification inboxes live in SiteSetting so an admin can set them
 * from the dashboard. They are deliberately kept out of getSettings() — that
 * object is rendered into public pages, and the SMTP password must not travel
 * with it.
 */

export const MAIL_SETTING_KEYS = [
  "smtpHost",
  "smtpPort",
  "smtpSecure",
  "smtpUser",
  "smtpPassword",
  "smtpFrom",
  "notifyEmails",
] as const;

export type MailSettingKey = (typeof MAIL_SETTING_KEYS)[number];

export type MailSettings = {
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  smtpFrom: string;
  notifyEmails: string;
};

export type ResolvedMail = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  notifyEmails: string[];
  isConfigured: boolean;
  passwordIsSet: boolean;
};

const MAIL_DEFAULTS: MailSettings = {
  smtpHost: "",
  smtpPort: "587",
  smtpSecure: false,
  smtpUser: "",
  smtpPassword: "",
  smtpFrom: "WirelessCom.Ca Inc. <no-reply@wirelesscom.ca>",
  notifyEmails: "service@wirelesscom.ca",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseNotifyEmails(raw: string): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const part of raw.split(/[,;\n]+/)) {
    const email = part.trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    list.push(email);
  }
  return list;
}

function asString(value: unknown, fallback: string): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true" || lower === "1" || lower === "yes") return true;
    if (lower === "false" || lower === "0" || lower === "no") return false;
  }
  return fallback;
}

export async function getMailSettings(): Promise<MailSettings> {
  const merged: MailSettings = { ...MAIL_DEFAULTS };

  try {
    const rows = await withTimeout(
      prisma.siteSetting.findMany({
        where: { key: { in: [...MAIL_SETTING_KEYS] } },
      }),
    );
    for (const row of rows) {
      if (row.key === "smtpSecure") {
        merged.smtpSecure = asBoolean(row.value, false);
        continue;
      }
      if (row.key === "smtpPassword") {
        const stored = asString(row.value, "");
        merged.smtpPassword = stored ? decryptSecret(stored) ?? "" : "";
        continue;
      }
      if (row.key in merged) {
        (merged as Record<string, string | boolean>)[row.key] = asString(
          row.value,
          "",
        );
      }
    }
  } catch {
    // Public mail still falls back to environment variables.
  }

  return merged;
}

/**
 * Admin form values overlay environment variables so an existing .env still
 * works until someone saves SMTP in the dashboard.
 */
export async function getResolvedMail(): Promise<ResolvedMail> {
  const stored = await getMailSettings();

  const host = stored.smtpHost.trim() || env.smtp.host;
  const port = Number.parseInt(stored.smtpPort, 10) || env.smtp.port || 587;
  const user = stored.smtpUser.trim() || env.smtp.user;
  const password = stored.smtpPassword || env.smtp.password;
  const from =
    stored.smtpFrom.trim() ||
    env.smtp.from ||
    "WirelessCom.Ca Inc. <no-reply@wirelesscom.ca>";
  const secure = stored.smtpHost.trim()
    ? stored.smtpSecure || port === 465
    : env.smtp.secure || port === 465;

  const notifyFromStore = parseNotifyEmails(stored.notifyEmails);
  const notifyEmails =
    notifyFromStore.length > 0
      ? notifyFromStore
      : parseNotifyEmails(env.smtp.to);

  return {
    host,
    port,
    secure,
    user,
    password,
    from,
    notifyEmails: notifyEmails.length > 0 ? notifyEmails : ["service@wirelesscom.ca"],
    isConfigured: Boolean(host),
    passwordIsSet: Boolean(password),
  };
}

export async function updateMailSettings(
  values: Partial<MailSettings>,
): Promise<void> {
  const entries = Object.entries(values).filter(([key]) =>
    (MAIL_SETTING_KEYS as readonly string[]).includes(key),
  );

  await prisma.$transaction(
    entries.map(([key, value]) => {
      let stored: string | boolean = value as string | boolean;
      if (key === "smtpPassword") {
        const secret = String(value ?? "").trim();
        stored = secret ? encryptSecret(secret) : "";
      }
      return prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: stored as never, group: "mail" },
        update: { value: stored as never, group: "mail" },
      });
    }),
  );
}
