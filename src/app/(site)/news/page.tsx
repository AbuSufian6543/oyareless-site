import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

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
      <section className="relative isolate overflow-hidden bg-navy-900">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900"
          aria-hidden="true"
        />
        <div className="bg-tech-grid absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container-page py-16 lg:py-24">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-400">
            WirelessCom.Ca Inc.
          </p>
          <h1 className="text-balance-tight text-4xl text-white lg:text-5xl">
            News &amp; Insights
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-navy-200">
            Security advisories, technology guidance, and updates on the services
            we deliver across Northern Ontario.
          </p>
        </div>
      </section>

      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="container-page">
          {posts.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-14 text-center">
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
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lift"
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
