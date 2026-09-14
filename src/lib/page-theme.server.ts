import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { PAGE_THEME_COOKIE, slugWantsLight } from "@/lib/page-theme";

const appearance = cache((): { light: boolean } => ({ light: false }));

export function visitorPageIsLight(): boolean {
  return appearance().light;
}

/**
 * Only reads the cookie when this page has the visitor toggle on, so other
 * CMS pages stay statically cached.
 */
export async function applyVisitorPageTheme(input: {
  slug: string;
  enabled: boolean;
}): Promise<boolean> {
  if (!input.enabled) return false;
  const jar = await cookies();
  const light = slugWantsLight(jar.get(PAGE_THEME_COOKIE)?.value, input.slug);
  appearance().light = light;
  return light;
}
