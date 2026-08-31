import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, Gauge, Timer, Waves } from "lucide-react";

import { TechBackdrop } from "@/components/visuals/tech-backdrop";
import { prisma } from "@/lib/prisma";

/**
 * Shared results are a snapshot, not live data, and they should never appear in
 * search results — the token is the only thing protecting them.
 */
export const metadata: Metadata = {
  title: "Shared Speed Test Result",
  robots: { index: false, follow: false },
};

export default async function SharedResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const result = await prisma.speedTestResult
    .findUnique({
      where: { shareToken: token },
      select: {
        downloadMbps: true,
        uploadMbps: true,
        latencyMs: true,
        jitterMs: true,
        networkName: true,
        createdAt: true,
      },
    })
    .catch(() => null);

  if (!result) notFound();

  const measured = new Intl.DateTimeFormat("en-CA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Toronto",
  }).format(result.createdAt);

  return (
    <section className="relative isolate overflow-hidden">
      <TechBackdrop density={0.6} glow="center" />
      <div className="container-page py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow-pill">
            <Gauge className="size-3.5" aria-hidden="true" />
            Shared result
          </p>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Speed Test Result
          </h1>
          <p className="mt-3 text-navy-300">
            Measured {measured} (Eastern Time)
            {result.networkName ? ` on ${result.networkName}` : ""}, against
            Cloudflare&rsquo;s edge network.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-6">
          <Figure
            Icon={ArrowDown}
            label="Download"
            value={result.downloadMbps}
            unit="Mbps"
          />
          <Figure
            Icon={ArrowUp}
            label="Upload"
            value={result.uploadMbps}
            unit="Mbps"
          />
          <Figure
            Icon={Timer}
            label="Latency"
            value={result.latencyMs}
            unit="ms"
          />
          <Figure
            Icon={Waves}
            label="Jitter"
            value={result.jitterMs}
            unit="ms"
          />
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-navy-700 bg-navy-900/70 p-5 text-sm leading-relaxed text-navy-300">
          <p>
            This is a snapshot of one browser&rsquo;s path to Cloudflare&rsquo;s
            nearest edge at that moment, not a guarantee of the subscribed rate.
            Packet loss was not measured — it cannot be established reliably
            over HTTP.
          </p>
          <p className="mt-3">
            <Link
              href="/speed-test"
              className="font-semibold text-accent-400 underline underline-offset-4 hover:text-accent-300"
            >
              Run your own test
            </Link>{" "}
            to compare.
          </p>
        </div>
      </div>
    </section>
  );
}

function Figure({
  Icon,
  label,
  value,
  unit,
}: {
  Icon: typeof ArrowDown;
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-navy-400">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl">
        {value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)}
      </p>
      <p className="mt-0.5 text-xs font-medium text-navy-400">{unit}</p>
    </div>
  );
}
