import { Phone } from "lucide-react";
import Link from "next/link";

import {
  PhotographicHero,
  photoHeroCopy,
} from "@/components/site/photographic-hero";
import { ButtonLink } from "@/components/ui/button";
import { BlockIcon } from "@/components/ui/icon";

const FACTS = [
  { value: "2005", label: "Serving Northern Ontario since" },
  { value: "Sault Ste. Marie", label: "Local office and technicians" },
  { value: "Hytera", label: "Authorized two-way radio dealer" },
  { value: "24/7", label: "Monitoring for contracted sites" },
] as const;

const PLATFORMS = [
  {
    icon: "network",
    kicker: "Networks & IT",
    title: "The LAN, the firewall, and the path to the cloud",
    body: "Switching, routing, Wi-Fi, structured cabling, Microsoft 365, and next-generation firewalls we size, install, and support. Cisco, UniFi, Fortinet, Barracuda, Juniper and similar platforms we are trained on.",
    href: "/it-services",
  },
  {
    icon: "cctv",
    kicker: "Building security",
    title: "Cameras, alarms, and who gets through the door",
    body: "IP video, intrusion panels, access control, and 24/7 monitoring where you contract it. One team owns the recorders and the network they sit on.",
    href: "/security-services",
  },
  {
    icon: "phone",
    kicker: "Voice & radio",
    title: "Desk phones, hosted PBX, and licensed radio",
    body: "VoIP for the office. Hytera DMR handhelds, mobiles, and repeaters as an authorized dealer — sales, rentals, and service.",
    href: "/telephone-services",
  },
] as const;

const INDUSTRIES = [
  "Small and medium business",
  "Professional offices",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Construction",
  "Municipal organizations",
  "Schools and nonprofits",
] as const;

/**
 * Safety net for the home route when the CMS page is empty. It tells the same
 * story as the seeded home: the whole technology stack, not a single product.
 */
export function FallbackHome() {
  return (
    <>
      <PhotographicHero
        src="/images/office-1400.webp"
        footer={
          <div className="container-page grid gap-7 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-white/10">
            {FACTS.map((fact) => (
              <div
                key={fact.label}
                className="lg:px-8 first:lg:pl-0 last:lg:pr-0"
              >
                <p className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {fact.value}
                </p>
                <p className="mt-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-white/55">
                  {fact.label}
                </p>
              </div>
            ))}
          </div>
        }
      >
        <div className={photoHeroCopy.wrap}>
          <p className={photoHeroCopy.eyebrow}>
            <span
              className="size-1.5 rounded-full bg-accent-400"
              aria-hidden="true"
            />
            Technology service provider · Northern Ontario
          </p>
          <h1 className={photoHeroCopy.heading}>
            Networks, Security, And Communications For Northern Ontario
          </h1>
          <p className={photoHeroCopy.sub}>
            Since 2005 in Sault Ste. Marie we design, install, and support
            the systems businesses here actually run — IT and Wi-Fi,
            firewalls, cameras and alarms, VoIP, and two-way radio. The
            same local team stays on them.
          </p>
          <div className={photoHeroCopy.actions}>
            <ButtonLink href="#work" variant="accent" size="lg">
              Explore our work
            </ButtonLink>
            <ButtonLink
              href="/request-quote"
              variant="onDark"
              size="lg"
              className={photoHeroCopy.outlineButton}
            >
              Request a quote
            </ButtonLink>
          </div>
        </div>
      </PhotographicHero>

      <section id="work" className="scroll-mt-24 bg-white py-20 lg:py-28">
        <div className="container-page">
          <p className="eyebrow text-brand-700">What we put in</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-navy-900 lg:text-4xl">
            Three kinds of work. One provider.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            Most sites need the network, the building security, and a way to
            talk. Buying them from one team means they are designed to work
            together.
          </p>

          <ul className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLATFORMS.map((platform) => (
              <li key={platform.title}>
                <Link
                  href={platform.href}
                  className="surface-card surface-card-hover flex h-full flex-col p-7"
                >
                  <span className="flex size-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <BlockIcon name={platform.icon} className="size-5.5" />
                  </span>
                  <p className="mt-5 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-700">
                    {platform.kicker}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-navy-900">
                    {platform.title}
                  </h3>
                  <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-slate-600">
                    {platform.body}
                  </p>
                  <span className="mt-5 text-sm font-semibold text-brand-700">
                    Learn more
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 p-8 lg:p-12">
            <div className="bg-tech-grid absolute inset-0" aria-hidden="true" />
            <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="eyebrow-pill">Authorized Hytera dealer</p>
                <h2 className="mt-4 text-balance-tight text-2xl font-bold text-white lg:text-3xl">
                  Check current Hytera prices and quote the radios you need
                </h2>
                <p className="mt-3 text-navy-200">
                  Browse live models and pricing at hyteraradios.ca, then request
                  a quote for the handhelds, mobiles, repeaters, or accessories
                  that fit your crew.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <ButtonLink
                  href="https://hyteraradios.ca"
                  openInNewTab
                  size="lg"
                  variant="accent"
                >
                  Open hyteraradios.ca
                </ButtonLink>
                <ButtonLink href="/two-way-radios" size="lg" variant="onDark">
                  Two-way radio service
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20 lg:py-24">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow text-brand-700">How we work</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">
              Designed together, supported here
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              A camera that cannot talk to the recorder, a phone system on an
              undersized circuit, a firewall nobody owns — those are what we
              are hired to unwind. We plan the LAN, the security, and the
              voice as one job, document it, and answer from Sault Ste. Marie.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/request-quote" variant="primary">
                Request a quote
              </ButtonLink>
              <ButtonLink href="tel:18007053189" variant="outline">
                <Phone className="size-4" aria-hidden="true" />
                1-800-705-3189
              </ButtonLink>
            </div>
          </div>
          <ul className="space-y-4">
            {[
              "Industry-standard installs, permits where the work needs them",
              "Firewalls and Wi-Fi we can still support years later",
              "Authorized Hytera dealer for two-way radio",
              "Practical AI only on cameras and phones we actually install",
            ].map((point) => (
              <li
                key={point}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-relaxed text-navy-800"
              >
                <span
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-500"
                  aria-hidden="true"
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="container-page">
          <p className="eyebrow text-brand-700">Who we serve</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">
            Organizations across Northern Ontario
          </h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((name) => (
              <li
                key={name}
                className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-navy-800"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-navy-950 py-16 text-white">
        <div className="container-page flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow-pill">When it earns its keep</p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight lg:text-3xl">
              Analytics on cameras. An attendant on phones.
            </h2>
            <p className="mt-3 text-navy-200 leading-relaxed">
              Those are options on systems we design and install — not a
              chatbot on this website, and not the whole company. Firewalls,
              cabling, radio, and support are still the core of the work.
            </p>
          </div>
          <ButtonLink href="/ai-services" variant="onDark">
            AI on cameras &amp; phones
          </ButtonLink>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-navy-900">
              Ready to talk about the site?
            </h2>
            <p className="mt-2 max-w-xl text-slate-600">
              Tell us what you need. We will put together a plan and a fixed
              quote. Already a client? Start remote support or call.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/request-quote" variant="primary" size="lg">
              Request a quote
            </ButtonLink>
            <ButtonLink href="/remote-support" variant="outline" size="lg">
              Remote support
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
