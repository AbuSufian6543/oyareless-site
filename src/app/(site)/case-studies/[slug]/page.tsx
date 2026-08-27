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
  const study = await prisma.caseStudy
    .findFirst({ where: { slug, status: "PUBLISHED" } })
    .catch(() => null);
  if (!study) return { title: "Case study" };
  return {
    title: study.metaTitle || study.title,
    description: study.metaDescription || study.problem,
    alternates: { canonical: `${env.siteUrl}/case-studies/${study.slug}` },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = await prisma.caseStudy
    .findFirst({ where: { slug, status: "PUBLISHED" } })
    .catch(() => null);
  if (!study) notFound();

  const stages = [
    { label: "Problem", body: study.problem },
    { label: "Solution", body: study.solution },
    { label: "Implementation", body: study.implementation },
    { label: "Result", body: study.result },
  ].filter((stage) => stage.body);

  const blocks = parseBlocks(study.blocks);

  return (
    <>
      <PageHero
        eyebrow={study.sector || "Case study"}
        title={study.title}
        description={
          study.clientName
            ? `Prepared with permission for ${study.clientName}.`
            : "A project WirelessCom.Ca Inc. designed and supports."
        }
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
