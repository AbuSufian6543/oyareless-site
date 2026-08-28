import "server-only";

import { cache } from "react";
import { prisma, withTimeout } from "@/lib/prisma";
import {
  DEFAULT_SETTINGS,
  type SettingKey,
  type SiteSettings,
} from "@/lib/settings-defaults";

export {
  DEFAULT_SETTINGS,
  formattedAddress,
  type SettingKey,
  type SiteSettings,
} from "@/lib/settings-defaults";

/**
 * Memoised per request so a page rendering ten blocks does not issue ten
 * settings queries.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const rows = await withTimeout(prisma.siteSetting.findMany());
    const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      if (row.key in DEFAULT_SETTINGS && row.value !== null) {
        merged[row.key] = row.value;
      }
    }
    return merged as SiteSettings;
  } catch {
    // The public site should still render if the database is briefly
    // unavailable (e.g. during a rolling restart).
    return { ...DEFAULT_SETTINGS };
  }
});

export async function updateSettings(
  values: Partial<SiteSettings>,
): Promise<void> {
  const entries = Object.entries(values).filter(
    ([key]) => key in DEFAULT_SETTINGS,
  );

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: value as never, group: groupFor(key as SettingKey) },
        update: { value: value as never },
      }),
    ),
  );
}

function groupFor(key: SettingKey): string {
  if (key.startsWith("social")) return "social";
  if (key.startsWith("announcement")) return "announcement";
  if (key.startsWith("theme")) return "theme";
  if (
    key === "logoUrl" ||
    key === "logoInverseUrl" ||
    key === "faviconUrl" ||
    key === "ogImageUrl" ||
    key === "iconPngUrl" ||
    key === "appleIconUrl" ||
    key.startsWith("homeHero")
  ) {
    return "branding";
  }
  if (key === "headEmbedCode" || key === "bodyEndEmbedCode") return "embed";
  if (key.startsWith("rustdesk") || key.startsWith("remoteSupport")) {
    return "remote-support";
  }
  if (key.startsWith("verification")) return "seo";
  if (key === "analyticsSnippet" || key === "cookieBannerEnabled") return "privacy";
  if (
    key === "phone" ||
    key === "localPhone" ||
    key === "email" ||
    key === "supportEmail" ||
    key.startsWith("address") ||
    key === "city" ||
    key === "province" ||
    key === "postalCode" ||
    key === "country" ||
    key === "mapEmbedUrl"
  ) {
    return "contact";
  }
  return "general";
}
