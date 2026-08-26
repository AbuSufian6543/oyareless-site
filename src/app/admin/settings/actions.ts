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
]);

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");

  const values: Record<string, string | boolean> = {};

  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (BOOLEAN_KEYS.has(key)) {
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
  redirect("/admin/settings?saved=1");
}
