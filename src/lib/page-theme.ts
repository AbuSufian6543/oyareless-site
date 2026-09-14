/** Cookie listing CMS slugs the visitor asked to see in the light look. */

export const PAGE_THEME_COOKIE = "wc_page_light";

const SLUG_PATTERN = /^[a-z0-9-]{1,80}$/;
const MAX_SLUGS = 40;

export function parsePageLightSlugs(raw: string | undefined | null): string[] {
  if (!raw) return [];
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const part of decoded.split(",")) {
    const slug = part.trim().toLowerCase();
    if (!SLUG_PATTERN.test(slug) || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
    if (slugs.length >= MAX_SLUGS) break;
  }
  return slugs;
}

export function slugWantsLight(raw: string | undefined | null, slug: string): boolean {
  const key = slug.trim().toLowerCase();
  if (!SLUG_PATTERN.test(key)) return false;
  return parsePageLightSlugs(raw).includes(key);
}

export function withPageLightSlug(
  raw: string | undefined | null,
  slug: string,
  light: boolean,
): string {
  const key = slug.trim().toLowerCase();
  if (!SLUG_PATTERN.test(key)) return parsePageLightSlugs(raw).join(",");
  const set = new Set(parsePageLightSlugs(raw));
  if (light) set.add(key);
  else set.delete(key);
  return [...set].join(",");
}

export function pageThemeCookieString(value: string): string {
  const maxAge = 60 * 60 * 24 * 365;
  if (!value) {
    return `${PAGE_THEME_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
  return `${PAGE_THEME_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
