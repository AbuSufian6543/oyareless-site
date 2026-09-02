import "server-only";

import { cache } from "react";
import type { Metadata } from "next";

import { parseBlocks, type Block } from "@/lib/blocks";
import { parseSlideshow, type SlideshowItem } from "@/lib/slideshow";
import { prisma, withTimeout } from "@/lib/prisma";
import {
  absoluteUrl,
  isServiceSlug,
  ogImage,
  serviceJsonLd,
  webPageJsonLd,
} from "@/lib/seo";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";
import { stripHtml, truncate } from "@/lib/utils";

export type RenderablePage = {
  id: string;
  slug: string;
  title: string;
  blocks: Block[];
  slideshow: SlideshowItem[];
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
  noIndex: boolean;
  updatedAt: Date;
};

export const getPublishedPage = cache(
  async (slug: string): Promise<RenderablePage | null> => {
    const page = await withTimeout(
      prisma.page.findFirst({ where: { slug, status: "PUBLISHED" } }),
    ).catch(() => null);

    if (!page) return null;

    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      blocks: parseBlocks(page.blocks),
      slideshow: parseSlideshow(page.slideshow),
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription,
      ogImageUrl: page.ogImageUrl,
      noIndex: page.noIndex,
      updatedAt: page.updatedAt,
    };
  },
);

/** Derives a description from page content when the editor left it blank. */
function inferDescription(page: RenderablePage): string {
  for (const block of page.blocks) {
    if (
      (block.type === "hero" || block.type === "techHero") &&
      "subheadline" in block.data &&
      block.data.subheadline
    ) {
      return truncate(String(block.data.subheadline), 300);
    }
    if (block.type === "richText") {
      const text = stripHtml(block.data.html);
      if (text.length > 60) return truncate(text, 300);
    }
    if (block.type === "imageText" && block.data.html) {
      const text = stripHtml(block.data.html);
      if (text.length > 60) return truncate(text, 300);
    }
    if (block.type === "heading" && block.data.description) {
      return truncate(block.data.description, 300);
    }
  }
  return "";
}

export function pageMetadata(page: RenderablePage): Metadata {
  const path = page.slug === "home" ? "/" : `/${page.slug}`;
  const description = page.metaDescription || inferDescription(page);
  const title = page.metaTitle || page.title;
  const image = ogImage(
    page.ogImageUrl,
    DEFAULT_SETTINGS.ogImageUrl,
    `${DEFAULT_SETTINGS.companyName} — ${title}`,
  );

  return {
    title,
    description: description || undefined,
    alternates: {
      canonical: page.slug === "live-video-broadcasting" ? "/live" : path,
    },
    robots: page.noIndex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description: description || undefined,
      url: absoluteUrl(
        page.slug === "live-video-broadcasting" ? "/live" : path,
      ),
      type: "website",
      locale: "en_CA",
      siteName: DEFAULT_SETTINGS.companyName,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || undefined,
      images: [image.url],
    },
  };
}

export function pageJsonLd(page: RenderablePage) {
  const path = page.slug === "home" ? "/" : `/${page.slug}`;
  const description = page.metaDescription || inferDescription(page);
  const name = page.metaTitle || page.title;

  if (page.slug === "contact") {
    return webPageJsonLd({
      name,
      description,
      path,
      type: "ContactPage",
    });
  }

  if (isServiceSlug(page.slug) && description) {
    return serviceJsonLd({
      name: page.title,
      description,
      path,
      brand: page.slug === "two-way-radios" ? "Hytera" : undefined,
    });
  }

  return webPageJsonLd({ name, description, path });
}
