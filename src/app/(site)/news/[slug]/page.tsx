import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";

import { BlockList } from "@/components/blocks/block-renderer";
import { parseBlocks } from "@/lib/blocks";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function loadPost(slug: string) {
  return prisma.post
    .findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { author: { select: { name: true } } },
    })
    .catch(() => null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: "Article not found" };

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt || undefined,
      url: `${env.siteUrl}/news/${post.slug}`,
      publishedTime: post.publishedAt?.toISOString(),
      images: post.coverImageUrl ? [{ url: post.coverImageUrl }] : undefined,
    },
  };
}

export default async function NewsArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const blocks = parseBlocks(post.blocks);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      "@type": "Organization",
      name: post.author?.name ?? "WirelessCom.Ca Inc.",
    },
    publisher: {
      "@type": "Organization",
      name: "WirelessCom.Ca Inc.",
      logo: {
        "@type": "ImageObject",
        url: `${env.siteUrl}/brand/logo.jpg`,
      },
    },
    mainEntityOfPage: `${env.siteUrl}/news/${post.slug}`,
    image: post.coverImageUrl ?? undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article>
        <header className="border-b border-slate-200 bg-slate-50 py-12 lg:py-16">
          <div className="container-page">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/news"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                All articles
              </Link>

              <h1 className="mt-5 text-balance-tight text-3xl leading-tight text-navy-900 lg:text-[2.75rem]">
                {post.title}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                <span>{formatDate(post.publishedAt)}</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {post.readingMinutes} min read
                </span>
                {post.author?.name && <span>By {post.author.name}</span>}
              </div>

              {post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {post.coverImageUrl && (
          <div className="container-page -mt-px pt-10">
            <div className="relative mx-auto aspect-[21/9] max-w-4xl overflow-hidden rounded-xl bg-slate-100">
              <Image
                src={post.coverImageUrl}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 60rem"
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {post.excerpt && (
          <div className="container-page pt-12">
            <p className="mx-auto max-w-3xl text-xl leading-relaxed text-slate-600">
              {post.excerpt}
            </p>
          </div>
        )}

        <BlockList blocks={blocks} sourcePage={`/news/${post.slug}`} />
      </article>
    </>
  );
}
