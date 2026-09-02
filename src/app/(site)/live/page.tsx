import type { Metadata } from "next";
import Link from "next/link";
import { Radio } from "lucide-react";

import { StreamCard } from "@/components/blocks/stream-blocks";
import { PageHero } from "@/components/site/page-hero";
import { listStreamAccess } from "@/lib/streams";
import { JsonLd } from "@/components/site/json-ld";
import { collectionPageJsonLd, publicMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = publicMetadata({
  title: "Live Video Broadcasting",
  description:
    "Live event broadcasts, job-site cameras, and fixed weather cameras streamed by WirelessCom.Ca Inc. from Sault Ste. Marie.",
  path: "/live",
});

export default async function LiveIndexPage() {
  const streams = await listStreamAccess({});

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: "Live Video Broadcasting",
          description:
            "Live event broadcasts, job-site cameras, and fixed weather cameras streamed by WirelessCom.Ca Inc. from Sault Ste. Marie.",
          path: "/live",
        })}
      />
      <PageHero
        eyebrow={
          <>
            <span
              className="size-1.5 rounded-full bg-accent-400 animate-live-dot"
              aria-hidden="true"
            />
            Broadcasting
          </>
        }
        title="Live Video Broadcasting"
        description="From live events and press conferences to job site progress cameras and fixed weather cameras."
      >
        <Link
          href="/contact"
          className="mt-5 inline-flex font-semibold text-accent-300 underline underline-offset-2 hover:text-accent-200"
        >
          Talk to our broadcast team
        </Link>
      </PageHero>

      <section className="bg-navy-900 pb-20">
        <div className="container-page">
          {streams.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-navy-700 bg-navy-900/50 p-16 text-center">
              <Radio className="size-9 text-navy-500" aria-hidden="true" />
              <p className="text-navy-400">
                There are no active streams right now. Please check back later.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              {streams.map((access, index) => (
                <StreamCard key={index} access={access} showTitle />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
