import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Knowledge base",
  description: "Guides from WirelessCom.Ca Inc. on networks, security, VoIP and workplace technology.",
  alternates: { canonical: `${env.siteUrl}/knowledge-base` },
};

export default async function KnowledgeBasePage() {
  const [categories, articles] = await Promise.all([
    prisma.kbCategory.findMany({ orderBy: { order: "asc" } }).catch(() => []),
    prisma.kbArticle
      .findMany({
        where: { status: "PUBLISHED" },
        orderBy: [{ featured: "desc" }, { order: "asc" }, { title: "asc" }],
        include: { category: { select: { name: true, slug: true } } },
      })
      .catch(() => []),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Help"
        title="Knowledge base"
        description="Practical notes we share with customers. Articles are written by our technicians, not generated filler."
      />
      <section className="bg-white py-14">
        <div className="container-page">
          {articles.length === 0 ? (
            <p className="text-slate-600">
              Articles appear here after they are published in the admin knowledge base.
            </p>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
              <aside>
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Categories
                </h2>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <a href={`#${category.slug}`} className="text-navy-800 hover:underline">
                        {category.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>
              <ul className="space-y-4">
                {articles.map((article) => (
                  <li key={article.id} className="surface-card surface-card-hover p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {article.category?.name ?? "General"}
                    </p>
                    <Link
                      href={`/knowledge-base/${article.slug}`}
                      className="mt-1 block text-lg font-bold text-navy-900 hover:text-brand-700"
                    >
                      {article.title}
                    </Link>
                    {article.summary && (
                      <p className="mt-2 text-sm text-slate-600">{article.summary}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
