import {
  Camera,
  Check,
  Download,
  HardDrive,
  Satellite,
  Sun,
  Truck,
} from "lucide-react";

import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { SectionImage } from "@/components/visuals/section-image";
import { TechBackdrop } from "@/components/visuals/tech-backdrop";
import {
  MOBILE_TRAILER_APPLICATIONS,
  MOBILE_TRAILER_CALLOUTS,
  MOBILE_TRAILER_IMAGES,
  MOBILE_TRAILER_PATH,
  MOBILE_TRAILER_PILLARS,
  MOBILE_TRAILER_PIPELINE,
  trailerFlyerDownloadName,
  trailerFlyerIsPdf,
} from "@/lib/mobile-security-trailer";
import { crumbs } from "@/lib/seo";
import { cn } from "@/lib/utils";

const QUOTE_HREF = "/request-quote?interest=trailer";
const CUSTOM_QUOTE_HREF = "/request-quote?interest=trailer&intent=custom";

export function MobileSecurityTrailerView({
  flyerUrl,
  phone,
}: {
  flyerUrl: string;
  phone: string;
}) {
  const flyerName = trailerFlyerDownloadName(flyerUrl);
  const flyerPdf = trailerFlyerIsPdf(flyerUrl);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-navy-950">
        <TechBackdrop network density={0.55} glow="right" mood="network" />
        <div className="container-page relative z-10 pt-6 lg:pt-8">
          <PageBreadcrumbs
            items={crumbs(
              { name: "Security Systems", href: "/security-services" },
              { name: "Mobile Security Trailer", href: MOBILE_TRAILER_PATH },
            )}
            tone="onDark"
          />
          <div className="grid items-center gap-10 pb-14 pt-4 lg:grid-cols-2 lg:gap-14 lg:pb-16 lg:pt-6">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div
                  className="absolute -inset-6 rounded-[1.75rem] bg-accent-500/14 blur-3xl"
                  aria-hidden="true"
                />
                <SectionImage
                  src={MOBILE_TRAILER_IMAGES.hero}
                  alt="WirelessCom.Ca Mobile Security Trailer with a 30-foot camera tower and solar array on a worksite at sunset"
                  width={1280}
                  height={720}
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  priority
                  className="relative w-full rounded-2xl object-cover shadow-lift"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="eyebrow-pill">WirelessCom.Ca Inc.</p>
              <h1 className="mt-5 text-balance-tight text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.7rem] lg:leading-[1.12]">
                Mobile Security Trailer
              </h1>
              <p className="mt-3 text-lg font-semibold text-accent-300">
                Fully Autonomous Surveillance System
              </p>
              <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-navy-200">
                Fully autonomous surveillance. Anywhere you need it. Custom built
                to your specifications — deploy, power, walk away.
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {MOBILE_TRAILER_CALLOUTS.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/20 bg-white/10 px-3.5 py-3"
                  >
                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-accent-300">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm text-white">{item.detail}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={QUOTE_HREF} variant="accent" size="lg">
                  Request a quote
                </ButtonLink>
                <ButtonLink href="#custom-build" variant="onDark" size="lg">
                  Custom build your system
                </ButtonLink>
              </div>
              <a
                href={flyerUrl}
                download={flyerName}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-300 hover:text-white"
              >
                <Download className="size-4" aria-hidden="true" />
                Download the flyer
              </a>
            </div>
          </div>
        </div>
        <div className="relative z-10 bg-[#8DC63F]">
          <p className="container-page py-3 text-center text-[0.8rem] font-bold uppercase tracking-[0.22em] text-navy-950 sm:text-sm">
            Deploy · Power · Walk away
          </p>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
              Built for remote security
            </p>
            <h2 className="mt-3 max-w-3xl text-balance-tight text-3xl font-bold tracking-tight text-navy-900">
              Protect the site even when there is no power and no network.
            </h2>
            <div className="mt-5 space-y-4 text-[1.05rem] leading-relaxed text-slate-600">
              <p>
                Protect construction sites, equipment, parking facilities, remote
                locations, and critical assets without permanent power or
                communications infrastructure.
              </p>
              <p>
                The WirelessCom.Ca Mobile Security Trailer is a rapidly
                deployable, solar-powered surveillance platform custom built to
                meet your security and monitoring requirements.
              </p>
              <p>
                With a 30-foot camera tower, satellite communications, solar
                power, local video storage, and remote system management, it can
                provide 24/7/365 surveillance where conventional security
                infrastructure is difficult or impractical to install.
              </p>
            </div>
          </div>
          <aside className="surface-card p-6 sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-700">
              One compact towable platform
            </p>
            <ul className="mt-5 space-y-3.5">
              {[
                { Icon: Camera, label: "Surveillance, recording, and alarms" },
                { Icon: Satellite, label: "Satellite communications" },
                { Icon: Sun, label: "Solar power with MPPT charging" },
                { Icon: HardDrive, label: "On-board video storage" },
                { Icon: Truck, label: "Towable by most vehicles" },
              ].map(({ Icon, label }) => (
                <li key={label} className="flex items-start gap-3 text-navy-800">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="pt-1.5 text-[0.95rem] font-semibold leading-snug">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="container-page">
          <h2 className="max-w-3xl text-balance-tight text-3xl font-bold tracking-tight text-navy-900">
            Surveillance, communications, and power in one trailer.
          </h2>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-slate-600">
            Specify the cameras, recording, uplink, and alarms around the job —
            then move the same platform when the site moves.
          </p>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {MOBILE_TRAILER_PILLARS.map((pillar) => (
              <article key={pillar.title} className="surface-card p-6">
                <h3 className="text-lg font-bold text-navy-900">{pillar.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[0.95rem] leading-relaxed text-slate-600">
                      <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
              30-foot mobile surveillance tower
            </p>
            <h2 className="mt-3 text-balance-tight text-3xl font-bold tracking-tight text-navy-900">
              See more. Cover more.
            </h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-slate-600">
              The integrated 30-foot tower rotates nearly 360°, so cameras and
              specialized equipment can be aimed for each deployment. Because the
              system is mobile, coverage can move as the project, property, or
              security requirement changes.
            </p>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-navy-800">
              Fix · Power · Walk away
            </p>
          </div>
          <div className="relative">
            <SectionImage
              src={MOBILE_TRAILER_IMAGES.hero}
              alt="Extended 30-foot camera mast on a WirelessCom.Ca mobile security trailer"
              width={1280}
              height={720}
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="w-full rounded-2xl object-cover shadow-lift"
            />
          </div>
        </div>
      </section>

      <section className="bg-navy-950 py-16 lg:py-20">
        <div className="container-page">
          <h2 className="max-w-3xl text-balance-tight text-3xl font-bold tracking-tight text-white">
            Camera to recording to satellite to the people watching.
          </h2>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-navy-200">
            Video is captured and stored on the trailer. Satellite carries the
            management path when the site has no usable internet. Staff can
            configure and review the system without standing next to it.
          </p>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MOBILE_TRAILER_PIPELINE.map((step, index) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-accent-300">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-200">{step.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="container-page">
          <h2 className="max-w-3xl text-balance-tight text-3xl font-bold tracking-tight text-navy-900">
            One platform. Multiple applications.
          </h2>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-slate-600">
            The same trailer covers a job site this month and a yard, lot, or
            temporary entrance the next.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {MOBILE_TRAILER_APPLICATIONS.map((item) => (
              <article key={item.title} className="surface-card overflow-hidden p-0">
                <div className="relative aspect-[16/9]">
                  <SectionImage
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="(min-width: 1024px) 38vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-navy-900">{item.title}</h3>
                  <p className="mt-2 text-[0.97rem] leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="custom-build" className="scroll-mt-24 bg-navy-950 py-16 lg:py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="eyebrow-pill">Custom built to your specifications</p>
            <h2 className="mt-5 text-balance-tight text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Your site is different. The security system should be too.
            </h2>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-navy-200">
              WirelessCom.Ca configures each Mobile Security Trailer around the
              operational requirement. Camera types, recording capacity,
              communications, analytics, alarms, and other components are selected
              for the application — not sold as a single locked package.
            </p>
            <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold uppercase tracking-[0.16em] text-accent-300">
              <span>Flexible</span>
              <span>Scalable</span>
              <span>Reliable</span>
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-lg font-bold text-white">Tell us the site and the job.</p>
            <p className="mt-3 text-sm leading-relaxed text-navy-200">
              Construction coverage, a parking facility, LPR at a gate, or a
              remote yard with no power — we will specify the trailer around that,
              then quote it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={CUSTOM_QUOTE_HREF} variant="accent">
                Custom build your system
              </ButtonLink>
              <ButtonLink href={`tel:${phone.replace(/\D/g, "")}`} variant="onDark">
                Call {phone}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-navy-900">
              Product flyer
            </h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-slate-600">
              The current product letter: cameras, power, communications, and
              how we deploy. Download it to share with your team.
            </p>
            <a
              href={flyerUrl}
              download={flyerName}
              className={cn(buttonClasses("primary", "lg"), "mt-6")}
            >
              <Download className="size-4" aria-hidden="true" />
              Download flyer
            </a>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-card">
            {flyerPdf ? (
              <div className="flex min-h-[18rem] flex-col items-center justify-center gap-3 p-8 text-center">
                <Download className="size-10 text-brand-600" aria-hidden="true" />
                <p className="font-semibold text-navy-900">PDF flyer ready to download</p>
              </div>
            ) : (
              <SectionImage
                src={flyerUrl}
                alt="WirelessCom.Ca Mobile Security Trailer product flyer"
                width={790}
                height={1024}
                sizes="(min-width: 1024px) 36vw, 100vw"
                className="mx-auto h-auto w-full max-w-lg object-contain"
              />
            )}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="container-page flex flex-col items-start justify-between gap-6 rounded-2xl bg-navy-900 px-6 py-10 sm:px-10 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Ready to put a trailer on site?</h2>
            <p className="mt-2 max-w-xl text-navy-200">
              Request a quote or call the office. We will ask where it needs to
              work, what it needs to see, and how long it stays.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={QUOTE_HREF} variant="accent">
              Request a quote
            </ButtonLink>
            <ButtonLink href="/security-services" variant="onDark">
              Security systems
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}