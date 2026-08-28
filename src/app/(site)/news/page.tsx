import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import { PageHero } from "@/components/site/page-hero";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News & Insights",
  description:
    "Technology news, security advisories, and service updates from the WirelessCom.Ca Inc. team.",
  alternates: { canonical: "/news" },
};

export default async function NewsIndexPage() {
  const posts = await prisma.post
    .findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
    })
    .catch(() => []);

  return (
    <>
      <PageHero
        eyebrow="WirelessCom.Ca Inc."
        title="News & Insights"
        description="Security advisories, technology guidance, and updates on the services we deliver across Northern Ontario."
      />

      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="container-page">
          {posts.length === 0 ? (
            <div className="surface-empty p-14">
              <p className="text-slate-500">
                No articles have been published yet. Please check back soon.
              </p>
            </div>
          ) : (
            <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.slug}`}
                  className="group flex flex-col overflow-hidden surface-card surface-card-hover"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                    {post.coverImageUrl ? (
                      <Image
                        src={post.coverImageUrl}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="bg-tech-grid-light size-full" />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-brand-50 px-2.5 py-0.5 font-semibold text-brand-700"
                        >
                          {tag}
                        </span>
                      ))}
                      <span>{formatDate(post.publishedAt)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" aria-hidden="true" />
                        {post.readingMinutes} min
                      </span>
                    </div>

                    <h2 className="mt-3 text-[1.0625rem] font-bold leading-snug text-navy-800">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                      Read article
                      <ArrowUpRight
                        className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
