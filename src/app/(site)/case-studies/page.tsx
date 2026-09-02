import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { SectionImage } from "@/components/visuals/section-image";
import { prisma } from "@/lib/prisma";
import { JsonLd } from "@/components/site/json-ld";
import { collectionPageJsonLd, publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Case Studies",
  description:
    "How WirelessCom.Ca Inc. has designed, installed, and supported networks, security, and communications for Northern Ontario organizations.",
  path: "/case-studies",
});

export default async function CaseStudiesPage() {
  const studies = await prisma.caseStudy
    .findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { order: "asc" }],
    })
    .catch(() => []);

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: "Case Studies",
          description:
            "How WirelessCom.Ca Inc. has designed, installed, and supported networks, security, and communications for Northern Ontario organizations.",
          path: "/case-studies",
        })}
      />
      <PageHero
        eyebrow="Work"
        title="Case Studies"
        description="Real projects, written without invented metrics. If a number is not here, we did not measure it."
      />
      <section className="bg-white py-14">
        <div className="container-page">
          {studies.length === 0 ? (
            <p className="text-slate-600">
              Case studies are added from the admin when we have a customer&rsquo;s
              permission to publish them.
            </p>
          ) : (
            <ul className="grid gap-5 lg:grid-cols-2">
              {studies.map((study) => (
                <li key={study.id} className="surface-card overflow-hidden">
                  {study.imageUrl ? (
                    <div className="relative aspect-16/10 bg-navy-900">
                      <SectionImage
                        src={study.imageUrl}
                        alt={study.imageAlt || study.title}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                      />
                    </div>
                  ) : null}
                  <div className="p-6">
                    {study.sector && (
                      <p className="text-xs font-bold uppercase tracking-wide text-brand-700">
                        {study.sector}
                      </p>
                    )}
                    <Link
                      href={`/case-studies/${study.slug}`}
                      className="mt-1 block text-xl font-bold text-navy-900 hover:text-brand-700"
                    >
                      {study.title}
                    </Link>
                    {study.problem && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">
                        {study.problem}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
