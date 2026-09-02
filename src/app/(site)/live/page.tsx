import type { Metadata } from "next";
import Link from "next/link";
import { Radio } from "lucide-react";

import { StreamCard } from "@/components/blocks/stream-blocks";
import { PageHero } from "@/components/site/page-hero";
import { listStreamAccess, type StreamAccess } from "@/lib/streams";
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
            <LiveStreamList streams={streams} />
          )}
        </div>
      </section>
    </>
  );
}

function isHtmlStream(access: StreamAccess): boolean {
  return access.state === "ok" && access.stream.type === "HTML";
}

function LiveStreamList({ streams }: { streams: StreamAccess[] }) {
  const demos = streams.filter(isHtmlStream);
  const others = streams.filter((access) => !isHtmlStream(access));

  return (
    <div className="space-y-12">
      {demos.length > 0 ? (
        <div>
          <h2 className="text-lg font-bold text-white">Live demo</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-navy-300">
            Downtown Sault Ste. Marie, looking north — a sample of the live
            video we host.
          </p>
          <div className={`mt-6 grid gap-8 ${demos.length > 1 ? "lg:grid-cols-2" : ""}`}>
            {demos.map((access, index) => (
              <StreamCard
                key={access.state === "ok" ? access.stream.id : `demo-${index}`}
                access={access}
                showTitle
              />
            ))}
          </div>
        </div>
      ) : null}

      {others.length > 0 ? (
        <div>
          {demos.length > 0 ? (
            <h2 className="text-lg font-bold text-white">Other broadcasts</h2>
          ) : null}
          <div
            className={`grid gap-8 ${others.length > 1 ? "lg:grid-cols-2" : ""} ${
              demos.length > 0 ? "mt-6" : ""
            }`}
          >
            {others.map((access, index) => (
              <StreamCard
                key={
                  access.state === "ok"
                    ? access.stream.id
                    : access.state === "locked"
                      ? access.slug
                      : `stream-${index}`
                }
                access={access}
                showTitle
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
