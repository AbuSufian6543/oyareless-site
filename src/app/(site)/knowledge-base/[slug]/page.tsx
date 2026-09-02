import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockList } from "@/components/blocks/block-renderer";
import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { parseBlocks } from "@/lib/blocks";
import { articleJsonLd, crumbs, publicMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.kbArticle
    .findFirst({ where: { slug, status: "PUBLISHED" } })
    .catch(() => null);
  if (!article) return { title: "Article" };
  return publicMetadata({
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.summary || article.title,
    path: `/knowledge-base/${article.slug}`,
  });
}

export default async function KbArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await prisma.kbArticle
    .findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { category: { select: { name: true } } },
    })
    .catch(() => null);
  if (!article) notFound();

  await prisma.kbArticle
    .update({ where: { id: article.id }, data: { views: { increment: 1 } } })
    .catch(() => undefined);

  const blocks = parseBlocks(article.blocks);
  const settings = await getSettings();

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          type: "TechArticle",
          headline: article.title,
          description: article.summary || undefined,
          path: `/knowledge-base/${article.slug}`,
          dateModified: article.updatedAt.toISOString(),
          publisherName: settings.companyName,
          logoUrl: settings.logoUrl,
        })}
      />
      <PageHero
        eyebrow={article.category?.name ?? "Knowledge base"}
        title={article.title}
        description={article.summary || "A technician-written note from WirelessCom.Ca Inc."}
        breadcrumbs={crumbs(
          { name: "Knowledge Base", href: "/knowledge-base" },
          { name: article.title, href: `/knowledge-base/${article.slug}` },
        )}
      />
      <section className="bg-white py-10">
        {blocks.length > 0 ? (
          <BlockList blocks={blocks} sourcePage={`/knowledge-base/${article.slug}`} />
        ) : (
          <div className="container-page max-w-3xl text-slate-600">
            This article has no body yet.
          </div>
        )}
      </section>
    </>
  );
}
