import type { MetadataRoute } from "next";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/news`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/live`, changeFrequency: "daily", priority: 0.6 },
  ];

  const [pages, posts, streams, jobs] = await Promise.all([
    prisma.page
      .findMany({
        where: { status: "PUBLISHED", noIndex: false },
        select: { slug: true, updatedAt: true },
      })
      .catch(() => []),
    prisma.post
      .findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      })
      .catch(() => []),
    prisma.stream
      .findMany({
        where: { status: "PUBLISHED", isPublic: true, accessPasswordHash: null },
        select: { slug: true, updatedAt: true },
      })
      .catch(() => []),
    prisma.jobPosting
      .findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      })
      .catch(() => []),
  ]);

  for (const page of pages) {
    if (page.slug === "home") continue;
    entries.push({
      url: `${base}/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }

  for (const post of posts) {
    entries.push({
      url: `${base}/news/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "yearly",
      priority: 0.5,
    });
  }

  for (const stream of streams) {
    entries.push({
      url: `${base}/live/${stream.slug}`,
      lastModified: stream.updatedAt,
      changeFrequency: "daily",
      priority: 0.4,
    });
  }

  for (const job of jobs) {
    entries.push({
      url: `${base}/careers/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return entries;
}
