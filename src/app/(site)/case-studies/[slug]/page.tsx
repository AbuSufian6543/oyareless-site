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
  const study = await prisma.caseStudy
    .findFirst({ where: { slug, status: "PUBLISHED" } })
    .catch(() => null);
  if (!study) return { title: "Case Study" };
  return publicMetadata({
    title: study.metaTitle || study.title,
    description: study.metaDescription || study.problem || study.title,
    path: `/case-studies/${study.slug}`,
    image: study.imageUrl,
    imageAlt: study.imageAlt || study.title,
  });
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = await prisma.caseStudy
    .findFirst({ where: { slug, status: "PUBLISHED" } })
    .catch(() => null);
  if (!study) notFound();

  const settings = await getSettings();
  const stages = [
    { label: "Problem", body: study.problem },
    { label: "Solution", body: study.solution },
    { label: "Implementation", body: study.implementation },
    { label: "Result", body: study.result },
  ].filter((stage) => stage.body);

  const blocks = parseBlocks(study.blocks);

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          type: "Article",
          headline: study.title,
          description: study.problem || undefined,
          path: `/case-studies/${study.slug}`,
          dateModified: study.updatedAt.toISOString(),
          image: study.imageUrl,
          publisherName: settings.companyName,
          logoUrl: settings.logoUrl,
        })}
      />
      <PageHero
        eyebrow={study.sector || "Case study"}
        title={study.title}
        description={
          study.clientName
            ? `Prepared with permission for ${study.clientName}.`
            : "A project WirelessCom.Ca Inc. designed and supports."
        }
        imageUrl={study.imageUrl ?? undefined}
        imageAlt={study.imageAlt || study.title}
        breadcrumbs={crumbs(
          { name: "Case Studies", href: "/case-studies" },
          { name: study.title, href: `/case-studies/${study.slug}` },
        )}
      />
      <section className="bg-white py-12">
        <div className="container-page grid gap-6 md:grid-cols-2">
          {stages.map((stage) => (
            <article key={stage.label} className="rounded-xl border border-slate-200 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-brand-700">
                {stage.label}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {stage.body}
              </p>
            </article>
          ))}
        </div>
        {blocks.length > 0 && (
          <div className="mt-8">
            <BlockList blocks={blocks} sourcePage={`/case-studies/${study.slug}`} />
          </div>
        )}
      </section>
    </>
  );
}
