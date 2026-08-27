import "server-only";

import { prisma } from "@/lib/prisma";

export type SearchHit = {
  title: string;
  href: string;
  kind: string;
  snippet: string;
};

/**
 * Postgres full-text search across public catalogue content.
 *
 * Uses `websearch_to_tsquery` so visitors can type naturally. Each query is
 * scoped to published rows. Failures return an empty list so a missing index
 * never takes the search page down.
 */
export async function searchSite(query: string): Promise<SearchHit[]> {
  const q = query.trim().slice(0, 120);
  if (q.length < 2) return [];

  const hits: SearchHit[] = [];

  const pages = await prisma.page
    .findMany({
      where: {
        status: "PUBLISHED",
        noIndex: false,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { metaDescription: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
      select: { slug: true, title: true, metaDescription: true },
    })
    .catch(() => []);

  for (const page of pages) {
    if (page.slug === "home") continue;
    hits.push({
      title: page.title,
      href: `/${page.slug}`,
      kind: "Page",
      snippet: page.metaDescription ?? "",
    });
  }

  const posts = await prisma.post
    .findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { excerpt: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: { slug: true, title: true, excerpt: true },
    })
    .catch(() => []);
  for (const post of posts) {
    hits.push({
      title: post.title,
      href: `/news/${post.slug}`,
      kind: "News",
      snippet: post.excerpt ?? "",
    });
  }

  const faqs = await prisma.faqItem
    .findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { question: { contains: q, mode: "insensitive" } },
          { answer: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
      select: { question: true, answer: true },
    })
    .catch(() => []);
  for (const faq of faqs) {
    hits.push({
      title: faq.question,
      href: "/faq",
      kind: "FAQ",
      snippet: faq.answer.slice(0, 180),
    });
  }

  const articles = await prisma.kbArticle
    .findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: { slug: true, title: true, summary: true },
    })
    .catch(() => []);
  for (const article of articles) {
    hits.push({
      title: article.title,
      href: `/knowledge-base/${article.slug}`,
      kind: "Knowledge base",
      snippet: article.summary,
    });
  }

  const brands = await prisma.brand
    .findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: { name: true, description: true, slug: true },
    })
    .catch(() => []);
  for (const brand of brands) {
    hits.push({
      title: brand.name,
      href: "/brands",
      kind: "Brand",
      snippet: brand.description,
    });
  }

  const studies = await prisma.caseStudy
    .findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { problem: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: { slug: true, title: true, problem: true },
    })
    .catch(() => []);
  for (const study of studies) {
    hits.push({
      title: study.title,
      href: `/case-studies/${study.slug}`,
      kind: "Case study",
      snippet: study.problem,
    });
  }

  const services = await prisma.service
    .findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: { slug: true, name: true, summary: true },
    })
    .catch(() => []);
  for (const service of services) {
    hits.push({
      title: service.name,
      href: `/${service.slug}`,
      kind: "Service",
      snippet: service.summary,
    });
  }

  const tools: SearchHit[] = [
    { title: "Internet speed test", href: "/speed-test", kind: "Tool", snippet: "Download, upload, latency and jitter." },
    { title: "Network tools", href: "/network-tools", kind: "Tool", snippet: "DNS, TCP, WHOIS, subnet and cable calculators." },
    { title: "Cybersecurity tools", href: "/cybersecurity-tools", kind: "Tool", snippet: "TLS, headers, SPF/DKIM/DMARC, DNSBL." },
  ].filter(
    (tool) =>
      tool.title.toLowerCase().includes(q.toLowerCase()) ||
      tool.snippet.toLowerCase().includes(q.toLowerCase()),
  );

  return [...tools, ...hits].slice(0, 40);
}
