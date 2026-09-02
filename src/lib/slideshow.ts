import { z } from "zod";

import { toEmbedUrl } from "@/lib/utils";

const imageSlide = z.object({
  kind: z.literal("image"),
  url: z.string().default(""),
  alt: z.string().default(""),
  caption: z.string().default(""),
});

const videoSlide = z.object({
  kind: z.literal("video"),
  url: z.string().default(""),
  title: z.string().default(""),
});

export const slideshowItemSchema = z.discriminatedUnion("kind", [
  imageSlide,
  videoSlide,
]);

export const slideshowSchema = z.array(slideshowItemSchema);

export type SlideshowItem = z.infer<typeof slideshowItemSchema>;
export type ImageSlide = z.infer<typeof imageSlide>;
export type VideoSlide = z.infer<typeof videoSlide>;

/** True when the URL is a YouTube or Vimeo link we can embed. */
export function isPromoVideoUrl(url: string): boolean {
  const embed = toEmbedUrl(url.trim());
  return (
    /youtube(?:-nocookie)?\.com\/embed\/[\w-]{11}/.test(embed) ||
    /player\.vimeo\.com\/video\/\d+/.test(embed)
  );
}

/**
 * Parses stored JSON, dropping items that no longer match so a single bad
 * slide cannot take a page down.
 */
export function parseSlideshow(value: unknown): SlideshowItem[] {
  if (!Array.isArray(value)) return [];
  const result: SlideshowItem[] = [];
  for (const candidate of value) {
    const parsed = slideshowItemSchema.safeParse(candidate);
    if (parsed.success) result.push(parsed.data);
  }
  return result;
}

/** Items that have enough data to show on the public site. */
export function visibleSlideshow(items: SlideshowItem[]): SlideshowItem[] {
  return items.filter((item) => {
    if (item.kind === "image") return item.url.trim().length > 0;
    return isPromoVideoUrl(item.url);
  });
}

export function normaliseSlideshow(
  value: unknown,
): { ok: true; items: SlideshowItem[] } | { ok: false; error: string } {
  const parsed = slideshowSchema.safeParse(value ?? []);
  if (!parsed.success) {
    return { ok: false, error: "The photo and video list is invalid." };
  }

  const items: SlideshowItem[] = [];
  for (const item of parsed.data) {
    if (item.kind === "image") {
      const url = item.url.trim();
      if (!url) continue;
      items.push({ ...item, url, alt: item.alt.trim(), caption: item.caption.trim() });
      continue;
    }

    const url = item.url.trim();
    if (!url) continue;
    if (!isPromoVideoUrl(url)) {
      return {
        ok: false,
        error: "Promo videos must be a YouTube or Vimeo link.",
      };
    }
    items.push({ ...item, url, title: item.title.trim() });
  }

  return { ok: true, items };
}
