import type { MetadataRoute } from "next";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;

  const staticRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/request-quote", changeFrequency: "yearly", priority: 0.8 },
    { path: "/speed-test", changeFrequency: "monthly", priority: 0.7 },
    { path: "/remote-support", changeFrequency: "monthly", priority: 0.6 },
    { path: "/network-tools", changeFrequency: "monthly", priority: 0.6 },
    { path: "/cybersecurity-tools", changeFrequency: "monthly", priority: 0.6 },
    { path: "/news", changeFrequency: "weekly", priority: 0.6 },
    { path: "/live", changeFrequency: "daily", priority: 0.6 },
    { path: "/brands", changeFrequency: "monthly", priority: 0.5 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
    { path: "/knowledge-base", changeFrequency: "weekly", priority: 0.5 },
    { path: "/case-studies", changeFrequency: "monthly", priority: 0.5 },
    { path: "/careers", changeFrequency: "weekly", priority: 0.5 },
    { path: "/network-status", changeFrequency: "hourly", priority: 0.4 },
    { path: "/system-status", changeFrequency: "hourly", priority: 0.3 },
  ];

  const [home, pages, posts, streams, jobs, articles, studies] = await Promise.all([
    prisma.page
      .findFirst({
        where: { slug: "home", status: "PUBLISHED", noIndex: false },
        select: { updatedAt: true },
      })
      .catch(() => null),
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
    prisma.kbArticle
      .findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      })
      .catch(() => []),
    prisma.caseStudy
      .findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      })
      .catch(() => []),
  ]);

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${base}${route.path === "/" ? "" : route.path}`,
    lastModified: route.path === "/" ? home?.updatedAt : undefined,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const seen = new Set(entries.map((entry) => entry.url));

  const push = (
    url: string,
    lastModified: Date,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
  ) => {
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({ url, lastModified, changeFrequency, priority });
  };

  for (const page of pages) {
    if (page.slug === "home" || page.slug === "live-video-broadcasting") continue;
    push(`${base}/${page.slug}`, page.updatedAt, "monthly", 0.8);
  }

  for (const post of posts) {
    push(`${base}/news/${post.slug}`, post.updatedAt, "yearly", 0.5);
  }

  for (const stream of streams) {
    push(`${base}/live/${stream.slug}`, stream.updatedAt, "daily", 0.4);
  }

  for (const job of jobs) {
    push(`${base}/careers/${job.slug}`, job.updatedAt, "weekly", 0.5);
  }

  for (const article of articles) {
    push(`${base}/knowledge-base/${article.slug}`, article.updatedAt, "monthly", 0.5);
  }

  for (const study of studies) {
    push(`${base}/case-studies/${study.slug}`, study.updatedAt, "yearly", 0.4);
  }

  return entries;
}
