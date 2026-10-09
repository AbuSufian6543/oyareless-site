import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

import { JsonLd } from "@/components/site/json-ld";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { SERVICE_AREAS, serviceAreaPath } from "@/lib/service-areas";
import { getSettings } from "@/lib/settings";
import { collectionPageJsonLd, crumbs, publicMetadata } from "@/lib/seo";

const PATH = "/service-area";
const TITLE = "Where We Work";
const DESCRIPTION =
  "WirelessCom.Ca Inc. sends technicians from 97 White Oak Drive East in Sault Ste. Marie to Prince Township, Garden River, Batchewana, Echo Bay, St. Joseph Island, Bruce Mines, Thessalon, Goulais River, and Searchmont.";

export const metadata: Metadata = publicMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

export default async function ServiceAreaPage() {
  const settings = await getSettings();

  return (
    <>
      <JsonLd data={collectionPageJsonLd({ name: TITLE, description: DESCRIPTION, path: PATH })} />
      <PageHero
        eyebrow="Service area"
        title="Communities We Drive To"
        description="The shop is in Sault Ste. Marie. These are the communities a technician reaches on a normal day from White Oak Drive East."
        breadcrumbs={crumbs({ name: "Service area", href: PATH })}
      />
      <section className="bg-slate-50 py-12 lg:py-16">
        <div className="container-page">
          <p className="max-w-3xl text-base leading-relaxed text-slate-600">
            Internet at a street is confirmed with an address check. The town name does not
            decide the speed. If your community is not listed, call {settings.phone}. We take
            work further into Northern Ontario when the trip fits the job.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {SERVICE_AREAS.map((area) => (
              <li key={area.slug}>
                <Link
                  href={serviceAreaPath(area.slug)}
                  className="surface-card surface-card-hover flex h-full flex-col p-6"
                >
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                    <MapPin className="size-4" aria-hidden="true" />
                    {area.place}
                  </p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-navy-900">{area.name}</h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{area.hero}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                    Work in {area.name}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/internet-availability">Check an address</ButtonLink>
            <ButtonLink href="/request-quote" variant="outline">Request a quote</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
