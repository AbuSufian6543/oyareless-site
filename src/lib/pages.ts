import "server-only";

import { cache } from "react";
import type { Metadata } from "next";

import { env } from "@/lib/env";
import { parseBlocks, type Block } from "@/lib/blocks";
import { parseSlideshow, type SlideshowItem } from "@/lib/slideshow";
import { prisma, withTimeout } from "@/lib/prisma";
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
    if (block.type === "hero" && block.data.subheadline) {
      return truncate(block.data.subheadline, 300);
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

  return {
    title: page.metaTitle || page.title,
    description: description || undefined,
    alternates: { canonical: path },
    robots: page.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: page.metaTitle || page.title,
      description: description || undefined,
      url: `${env.siteUrl}${path}`,
      type: "website",
      images: page.ogImageUrl ? [{ url: page.ogImageUrl }] : undefined,
    },
  };
}
