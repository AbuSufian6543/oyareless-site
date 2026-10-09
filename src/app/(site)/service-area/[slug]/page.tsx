import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { quotePrefillHref } from "@/lib/quote-prefill";
import {
  SERVICE_AREAS,
  serviceAreaBySlug,
  serviceAreaPath,
  type ServiceArea,
} from "@/lib/service-areas";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, BUSINESS_ID, breadcrumbJsonLd, crumbs, publicMetadata, WEBSITE_ID } from "@/lib/seo";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return SERVICE_AREAS.map((area) => ({ slug: area.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = serviceAreaBySlug(slug);
  if (!area) return {};
  return publicMetadata({
    title: area.metaTitle,
    description: area.description,
    path: serviceAreaPath(area.slug),
  });
}

function areaJsonLd(area: ServiceArea) {
  const path = serviceAreaPath(area.slug);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: area.metaTitle,
    description: area.description,
    url: absoluteUrl(path),
    areaServed: { "@type": area.schemaType, name: area.name },
    provider: { "@id": BUSINESS_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
}

export default async function ServiceAreaTownPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const area = serviceAreaBySlug(slug);
  if (!area) notFound();

  const settings = await getSettings();
  const path = serviceAreaPath(area.slug);
  const crumbsTrail = crumbs(
    { name: "Service area", href: "/service-area" },
    { name: area.name, href: path },
  );
  const quoteHref = quotePrefillHref({
    address: `${area.name}, Ontario`,
    details: `Please contact me about work at a site in ${area.name}, Ontario.`,
  });

  return (
    <>
      <JsonLd data={areaJsonLd(area)} />
      <JsonLd data={breadcrumbJsonLd(crumbsTrail)} />
      <PageHero
        eyebrow={area.place}
        title={area.metaTitle}
        description={area.hero}
        breadcrumbs={crumbsTrail}
      />
      <section className="bg-white py-12 lg:py-16">
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <div className="max-w-3xl">
            {area.story.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-base leading-relaxed text-slate-700 first:mt-0">
                {paragraph}
              </p>
            ))}
            <h2 className="mt-10 text-2xl font-bold tracking-tight text-navy-900">Work we do here</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {area.work.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="surface-card surface-card-hover block h-full p-5">
                    <h3 className="text-base font-bold text-navy-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <aside className="surface-card p-6 lg:sticky lg:top-28">
            <h2 className="text-lg font-bold text-navy-900">Book a visit</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{area.visit}</p>
            <p className="mt-3 text-sm font-semibold text-navy-800">{settings.phone}</p>
            <div className="mt-5 flex flex-col gap-3">
              <ButtonLink href={quoteHref}>Request a quote</ButtonLink>
              <ButtonLink href="/internet-availability" variant="outline">
                Check an address
              </ButtonLink>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
