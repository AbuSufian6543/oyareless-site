import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gauge, Wifi } from "lucide-react";

import { InternetAvailabilityChecker } from "@/components/site/internet-availability";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Internet Availability",
  description:
    "Check which fibre and copper internet speeds WirelessCom can deliver to a street address in Ontario or Quebec.",
  path: "/internet-availability",
});

const NEXT = [
  {
    href: "/internet-services",
    title: "Internet services",
    body: "How WirelessCom brings fibre and copper to a site, and what to ask for on the quote.",
    icon: Wifi,
  },
  {
    href: "/speed-test",
    title: "Speed test",
    body: "Already connected? Measure download, upload, latency, and jitter from this browser.",
    icon: Gauge,
  },
  {
    href: "/request-quote",
    title: "Request a quote",
    body: "Tell us the address and the speed you want. We will follow up from Sault Ste. Marie.",
    icon: ArrowRight,
  },
] as const;

export default function InternetAvailabilityPage() {
  return (
    <>
      <InternetAvailabilityChecker asPage />
      <section className="border-t border-slate-200 bg-white py-12 lg:py-16">
        <div className="container-page">
          <h2 className="text-2xl font-bold tracking-tight text-navy-900">After you check the address</h2>
          <ul className="mt-6 grid gap-4 lg:grid-cols-3">
            {NEXT.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="surface-card surface-card-hover flex h-full flex-col p-5"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <item.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-bold text-navy-900">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
                  <span className="mt-4 text-sm font-semibold text-brand-700">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
