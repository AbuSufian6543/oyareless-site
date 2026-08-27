import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  Headset,
  LifeBuoy,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { SpeedTest } from "@/components/blocks/speed-test";
import { TechBackdrop } from "@/components/visuals/tech-backdrop";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Internet speed test",
  description:
    "Measure your download speed, upload speed, latency and jitter against our own server in Northern Ontario. No third-party test service, no account, no tracking.",
  alternates: { canonical: `${env.siteUrl}/speed-test` },
};

const FACTORS = [
  {
    title: "Wi-Fi, not the internet",
    body: "Most disappointing results are a wireless problem. Older access points, a distant router or a congested 2.4 GHz band will cap the result well below the line rate. Test again with a network cable to see the difference.",
  },
  {
    title: "What else is running",
    body: "Cloud backups, software updates, streaming and video calls all compete for the same connection. Pause them before testing, or the figure reflects what was left over.",
  },
  {
    title: "The device itself",
    body: "An old laptop, a saturated CPU or a browser with dozens of tabs can become the bottleneck before the network does.",
  },
  {
    title: "Time of day",
    body: "Shared access technologies slow down when a neighbourhood is busy. A result at 8pm and one at 8am can differ substantially on the same connection.",
  },
];

export default async function SpeedTestPage() {
  const settings = await getSettings();

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <TechBackdrop density={0.8} glow="center" />
        <div className="container-page py-14 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-300">
              <Gauge className="size-3.5" aria-hidden="true" />
              Network tool
            </p>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Internet speed test
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-navy-200">
              Measured directly against our own server in {settings.city} — not a
              third-party test network. Press GO and the test will check latency,
              then download, then upload.
            </p>
          </div>

          <div className="mt-10">
            <SpeedTest dark />
          </div>
        </div>
      </section>

      <section className="bg-white py-14 lg:py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
              Why your result may differ from what you pay for
            </h2>
            <p className="mt-3 text-slate-600">
              A speed test measures one browser&rsquo;s path to one server at one
              moment. Several things sit between your subscribed rate and the
              number above.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {FACTORS.map((factor) => (
              <div
                key={factor.title}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-5"
              >
                <h3 className="font-bold text-navy-900">{factor.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {factor.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="font-bold text-navy-900">How this test works</h3>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-slate-600">
              <li>
                <strong className="font-semibold text-navy-800">
                  Latency and jitter
                </strong>{" "}
                come from seven small round trips. The first is discarded because
                it also pays for connection setup. Latency is the fastest trip;
                jitter is how much the rest varied.
              </li>
              <li>
                <strong className="font-semibold text-navy-800">
                  Download and upload
                </strong>{" "}
                transfer random, incompressible data in growing chunks, so
                compression anywhere along the path cannot flatter the result.
                The first half-second is excluded while the connection ramps up.
              </li>
              <li>
                <strong className="font-semibold text-navy-800">
                  Packet loss is not measured.
                </strong>{" "}
                It cannot be established reliably from a browser over HTTP, so it
                is left blank rather than estimated. If you suspect a lossy line,
                ask us to run a proper ICMP or MTR test.
              </li>
              <li>
                <strong className="font-semibold text-navy-800">
                  Your network name
                </strong>{" "}
                comes from a reverse DNS lookup of your address and nothing else.
                There is no geo-IP or ASN database involved, so it is blank
                whenever your provider publishes no useful record.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14 lg:py-20">
        <div className="container-page">
          <h2 className="text-2xl font-extrabold tracking-tight text-navy-900 sm:text-3xl">
            Results not what they should be?
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            We diagnose the whole path — cabling, switching, Wi-Fi design and the
            carrier circuit itself — rather than guessing at one part of it.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <NextStep
              Icon={LifeBuoy}
              title="Request service"
              body="Tell us what you are seeing and we will investigate."
              href="/support"
            />
            <NextStep
              Icon={Headset}
              title="Remote support"
              body="Let a technician look at the device with you, with your permission."
              href="/remote-support"
            />
            <NextStep
              Icon={Wrench}
              title="More network tools"
              body="DNS lookups, port checks, subnet and cable calculators."
              href="/network-tools"
            />
          </div>

          <p className="mt-8 flex items-start gap-2 text-sm text-slate-500">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Results are stored only when you finish a test, and only so the share
            link works: four throughput figures, your carrier&rsquo;s name where
            reverse DNS reveals it, and a one-way hash of your address. Your IP
            itself is never saved.
          </p>
        </div>
      </section>
    </>
  );
}

function NextStep({
  Icon,
  title,
  body,
  href,
}: {
  Icon: typeof LifeBuoy;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <Icon className="size-6 text-brand-600" aria-hidden="true" />
      <h3 className="mt-3 flex items-center gap-1.5 font-bold text-navy-900">
        {title}
        <ArrowRight
          className="size-4 text-brand-600 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
    </Link>
  );
}
