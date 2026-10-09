import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { HomeAvailabilityCard } from "@/components/site/home-availability-band";
import {
  PhotographicHero,
  photoHeroCopy,
} from "@/components/site/photographic-hero";
import { ButtonLink } from "@/components/ui/button";
import { SectionImage } from "@/components/visuals/section-image";

const FACTS = [
  { value: "2005", label: "Serving Northern Ontario since" },
  { value: "Sault Ste. Marie", label: "Local office and technicians" },
  { value: "Hytera", label: "Authorized two-way radio dealer" },
  { value: "24/7", label: "Monitoring for contracted sites" },
] as const;

const PLATFORMS = [
  {
    kicker: "Networks & IT",
    title: "The LAN, the firewall, and the path to the cloud",
    body: "Switching, routing, Wi-Fi, structured cabling, Microsoft 365, and next-generation firewalls we size, install, and support.",
    href: "/it-services",
    image: "/images/cabling-install-1400.webp",
    imageAlt:
      "Technician's hands terminating blue and white network cables into a rack-mounted patch panel",
  },
  {
    kicker: "Building security",
    title: "Cameras, alarms, and who gets through the door",
    body: "IP video, alarms, and access control, with 24/7 monitoring where you contract it. Analytics on the cameras, and an attendant on the phones, are options on the systems we install.",
    href: "/security-services",
    image: "/images/surveillance-1400.webp",
    imageAlt:
      "Dome and bullet security cameras mounted under the soffit of a modern commercial building at dusk",
  },
  {
    kicker: "Voice & radio",
    title: "Desk phones, hosted PBX, and licensed radio",
    body: "VoIP for the office. Hytera DMR handhelds, mobiles, and repeaters as an authorized dealer — sales, rentals, and service.",
    href: "/telephone-services",
    image: "/images/two-way-radio-1400.webp",
    imageAlt:
      "Three rugged professional handheld two-way radios on a dark surface with blue rim lighting",
  },
] as const;

/**
 * Safety net for the home route when the CMS page is empty. It tells the same
 * story as the seeded home: the whole technology stack, not a single product.
 */
export function FallbackHome() {
  return (
    <>
      <PhotographicHero
        src="/images/office-1024.webp"
        corner={<HomeAvailabilityCard />}
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

      <section id="work" className="scroll-mt-24 bg-white pt-10 pb-16 lg:pt-12 lg:pb-20">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
            <div className="lg:col-span-7">
              <p className="eyebrow text-brand-700">What we put in</p>
              <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-navy-900 lg:text-4xl">
                Three kinds of work. One provider.
              </h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
                Most sites need the network, the building security, and a way
                to talk. Buying them from one team means they are designed to
                work together.
              </p>
            </div>
            <div className="border-l-2 border-brand-600 pl-5 lg:col-span-5">
              <p className="eyebrow text-brand-700">How we work</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-navy-900">
                Designed together, supported here.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                We plan the network, the cameras, and the phones as one job,
                document it, and answer from Sault Ste. Marie.
              </p>
            </div>
          </div>

          <ul className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-3">
            {PLATFORMS.map((platform) => (
              <li key={platform.href}>
                <Link
                  href={platform.href}
                  className="group surface-card surface-card-hover flex h-full flex-col overflow-hidden"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-navy-900">
                    <SectionImage
                      src={platform.image}
                      alt={platform.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-700">
                      {platform.kicker}
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-navy-900">
                      {platform.title}
                    </h3>
                    <p className="mt-3 flex-1 text-[0.9375rem] leading-relaxed text-slate-600">
                      {platform.body}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                      Learn more
                      <ArrowUpRight
                        className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <p className="mt-8 max-w-3xl text-base leading-relaxed text-slate-600">
            The same team works with offices, clinics, shops, plants, job
            sites, municipalities, schools, and nonprofits across Northern
            Ontario.
          </p>
        </div>
      </section>

      <section className="bg-white pb-16 lg:pb-20">
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

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 py-20 text-white lg:py-24">
        <div
          className="pointer-events-none absolute inset-0 bg-tech-grid"
          aria-hidden="true"
        />
        <div className="container-page relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
              Ready to talk about the site?
            </h2>
            <p className="mt-3 max-w-xl text-lg text-navy-100">
              Tell us what you need. We will put together a plan and a fixed
              quote. Already a client? Start remote support or call.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/request-quote" variant="accent" size="lg">
              Request a quote
            </ButtonLink>
            <ButtonLink href="/remote-support" variant="onDark" size="lg">
              Remote support
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
