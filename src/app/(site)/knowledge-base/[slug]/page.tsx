import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockList } from "@/components/blocks/block-renderer";
import { PageHero } from "@/components/site/page-hero";
import { env } from "@/lib/env";
import { parseBlocks } from "@/lib/blocks";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.kbArticle
    .findFirst({ where: { slug, status: "PUBLISHED" } })
    .catch(() => null);
  if (!article) return { title: "Article" };
  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.summary,
    alternates: { canonical: `${env.siteUrl}/knowledge-base/${article.slug}` },
  };
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

  return (
    <>
      <PageHero
        eyebrow={article.category?.name ?? "Knowledge base"}
        title={article.title}
        description={article.summary || "A technician-written note from WirelessCom.Ca Inc."}
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
