import type { Metadata } from "next";
import Link from "next/link";
import { Radio } from "lucide-react";

import { StreamCard } from "@/components/blocks/stream-blocks";
import { listStreamAccess } from "@/lib/streams";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live Video Broadcasting",
  description:
    "Live event broadcasts, job site cameras, and fixed weather cameras streamed by WirelessCom.Ca Inc.",
  alternates: { canonical: "/live" },
};

export default async function LiveIndexPage() {
  const streams = await listStreamAccess({});

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy-900">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900"
          aria-hidden="true"
        />
        <div className="bg-tech-grid absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container-page py-16 lg:py-20">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent-300">
            <span
              className="size-1.5 rounded-full bg-accent-400 animate-live-dot"
              aria-hidden="true"
            />
            Broadcasting
          </p>
          <h1 className="text-balance-tight text-4xl text-white lg:text-5xl">
            Live Video Broadcasting
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-navy-200">
            From live events and press conferences to job site progress cameras
            and fixed weather cameras. Need your event streamed?{" "}
            <Link
              href="/contact"
              className="font-semibold text-accent-300 underline underline-offset-2"
            >
              Talk to our broadcast team
            </Link>
            .
          </p>
        </div>
      </section>

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
