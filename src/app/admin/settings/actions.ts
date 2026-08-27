"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
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

  await recordAudit({
    action: "settings.updated",
    userId: user.id,
    entityType: "SiteSetting",
    summary: "Site settings updated",
  });

  revalidatePath("/", "layout");
  redirect(`${returnTo}?saved=1`);
}
