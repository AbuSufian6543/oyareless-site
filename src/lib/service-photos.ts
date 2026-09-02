import type { SlideshowItem } from "@/lib/slideshow";
import generated from "./service-photos.generated.json";

export type ServicePhoto = {
  url: string;
  alt: string;
  originalName: string;
};

export const SERVICE_PHOTOS = generated as Record<string, ServicePhoto[]>;

export const SERVICE_PHOTO_COUNT = Object.values(SERVICE_PHOTOS).reduce(
  (count, photos) => count + photos.length,
  0,
);

const OLD_STEM_TO_SLUG: Record<string, string> = {
  "server-rack": "it-services",
  cybersecurity: "cybersecurity",
  firewall: "firewalls",
  surveillance: "security-services",
  "ai-camera": "ai-services",
  "ai-phone": "telephone-services",
  voip: "telephone-services",
  wifi: "internet-services",
  "access-control": "access-control",
  "cabling-install": "data-cabling-fiber-optic",
  "ev-charging": "ev-charging-solutions",
  "two-way-radio": "two-way-radios",
  "fleet-tracking": "fleet-vehicle-tracking",
  "digital-signage": "digital-marketing",
  "web-development": "web-development",
  "alarm-system": "alarm-systems",
  "door-intercom": "door-intercom",
  "panic-button": "panic-buttons",
};

const OLD_CATALOG_URL = new RegExp(
  `^/images/(${Object.keys(OLD_STEM_TO_SLUG).join("|")})-(?:560|900|1400|960|2000|2800|3600)\\.(?:avif|webp)$`,
);

const URL_ALT_PAIRS = [
  ["url", "alt"],
  ["imageUrl", "imageAlt"],
  ["backgroundImageUrl", "backgroundImageAlt"],
] as const;

export function serviceHeroPhoto(slug: string): ServicePhoto | undefined {
  return SERVICE_PHOTOS[slug]?.[0];
}

export function slideshowForSlug(slug: string): SlideshowItem[] {
  return (SERVICE_PHOTOS[slug] ?? []).map((photo) => ({
    kind: "image" as const,
    url: photo.url,
    alt: photo.alt,
    caption: "",
  }));
}

const MOVED_SERVICE_PHOTOS: Record<string, string> = {
  "/images/services/digital-marketing/02.webp":
    "/images/services/digital-marketing/02.jpg",
};

/** Pages saved before the file was renamed still point at the old URL. */
export function canonicalServicePhotoUrl(url: string): string {
  return MOVED_SERVICE_PHOTOS[url] ?? url;
}

export function usesShippedServicePhotos(items: SlideshowItem[]): boolean {
  return items.some(
    (item) => item.kind === "image" && item.url.startsWith("/images/services/"),
  );
}

export function photoForOldCatalogUrl(url: string): ServicePhoto | undefined {
  const match = OLD_CATALOG_URL.exec(url);
  if (!match) return undefined;
  const slug = OLD_STEM_TO_SLUG[match[1]];
  return slug ? serviceHeroPhoto(slug) : undefined;
}

/**
 * Replaces generated service stock photos with the first owned picture for
 * that service. Office, support, video, and generic cabling shots are left
 * alone.
 */
export function rewriteOldServiceImages(value: unknown): {
  next: unknown;
  changed: boolean;
} {
  const encoded = JSON.stringify(value);
  const next = rewriteNode(value);
  const rewritten = JSON.stringify(next);
  return { next, changed: encoded !== rewritten };
}

function rewriteNode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(rewriteNode);
  if (!value || typeof value !== "object") {
    if (typeof value === "string") return photoForOldCatalogUrl(value)?.url ?? value;
    return value;
  }

  const current = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  const handled = new Set<string>();

  for (const [urlKey, altKey] of URL_ALT_PAIRS) {
    const url = current[urlKey];
    if (typeof url !== "string") continue;
    const photo = photoForOldCatalogUrl(url);
    if (!photo) continue;
    next[urlKey] = photo.url;
    handled.add(urlKey);
    if (typeof current[altKey] === "string") {
      next[altKey] = photo.alt;
      handled.add(altKey);
    }
  }

  for (const [key, child] of Object.entries(current)) {
    if (handled.has(key)) continue;
    next[key] = rewriteNode(child);
  }

  return next;
}

export function catalogServicePictures(): Array<{
  url: string;
  name: string;
  alt: string;
  folder: string;
}> {
  return Object.values(SERVICE_PHOTOS).flatMap((photos) =>
    photos.map((photo) => ({
      url: photo.url,
      name: photo.originalName.replace(/\.[^.]+$/, ""),
      alt: photo.alt,
      folder: "services",
    })),
  );
}
