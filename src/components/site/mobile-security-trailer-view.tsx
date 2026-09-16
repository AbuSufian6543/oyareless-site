import Image from "next/image";
import {
  ArrowDown,
  ArrowRight,
  Camera,
  Check,
  Download,
  Handshake,
  HardDrive,
  MonitorSmartphone,
  Satellite,
  Shield,
  Sun,
  Truck,
  Wrench,
} from "lucide-react";

import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { SectionImage } from "@/components/visuals/section-image";
import { TechBackdrop } from "@/components/visuals/tech-backdrop";
import type { BlockOf } from "@/lib/blocks";
import {
  defaultMobileTrailerBlockData,
  MOBILE_TRAILER_PATH,
  resolveTrailerFlyerUrl,
  trailerFlyerDownloadName,
  trailerFlyerIsPdf,
} from "@/lib/mobile-security-trailer";
import { crumbs } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

const PIPELINE_ICONS = {
  Cameras: Camera,
  Recording: HardDrive,
  Satellite: Satellite,
  "Remote monitoring": MonitorSmartphone,
} as const;

const PLATFORM_ICONS = [Camera, Satellite, Sun, HardDrive, Truck] as const;
const PROOF_ICONS = [Shield, Sun, Wrench, Handshake] as const;

export async function MobileTrailerBlock({
  block,
}: {
  block: BlockOf<"mobileTrailer">;
}) {
  const settings = await getSettings();
  const flyerUrl = resolveTrailerFlyerUrl(
    block.data.flyerUrl || settings.mobileTrailerFlyerUrl,
  );

  return (
    <MobileSecurityTrailerView
      data={block.data}
      flyerUrl={flyerUrl}
      phone={settings.phone}
      logoUrl={settings.logoInverseUrl || "/brand/logo-inverse.png"}
    />
  );
}

export function MobileSecurityTrailerView({
  data = defaultMobileTrailerBlockData(),
  flyerUrl,
  phone,
  logoUrl,
}: {
  data?: BlockOf<"mobileTrailer">["data"];
  flyerUrl: string;
  phone: string;
  logoUrl: string;
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
                  src={data.heroImageUrl}
                  alt={data.heroImageAlt}
                  width={1280}
                  height={720}
                  sizes="(min-width: 1024px) 46vw, 100vw"
                  priority
                  className="relative w-full rounded-2xl object-cover shadow-lift"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Image
                src={logoUrl}
                alt="WirelessCom.Ca Inc."
                width={230}
                height={44}
                priority
                className="h-8 w-auto lg:h-9"
              />
              {data.eyebrow ? (
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-accent-300">
                  {data.eyebrow}
                </p>
              ) : null}
              <h1 className="mt-3 text-balance-tight text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.7rem] lg:leading-[1.12]">
                {data.headline}
              </h1>
              {data.kicker ? (
                <p className="mt-3 text-lg font-semibold text-accent-300">{data.kicker}</p>
              ) : null}
              <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-navy-200">
                {data.subheadline}
              </p>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {data.callouts.map((item) => (
                  <div
                    key={`${item.label}-${item.detail}`}
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
                <ButtonLink href={data.quoteHref} variant="accent" size="lg">
                  {data.quoteLabel}
                </ButtonLink>
                <ButtonLink href={data.customHref} variant="onDark" size="lg">
                  {data.customLabel}
                </ButtonLink>
              </div>
              <a
                href={flyerUrl}
                download={flyerName}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-300 hover:text-white"
              >
                <Download className="size-4" aria-hidden="true" />
                {data.flyerLinkLabel}
              </a>
            </div>
          </div>
        </div>
        {data.stripText ? (
          <div className="relative z-10 bg-[#8DC63F]">
            <p className="container-page py-3 text-center text-[0.8rem] font-bold uppercase tracking-[0.22em] text-navy-950 sm:text-sm">
              {data.stripText}
            </p>
          </div>
        ) : null}
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-16">
          <div>
            {data.introEyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                {data.introEyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 max-w-3xl text-balance-tight text-3xl font-bold tracking-tight text-navy-900">
              {data.introHeading}
            </h2>
            <div className="mt-5 space-y-4 text-[1.05rem] leading-relaxed text-slate-600">
              {data.introParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <aside className="surface-card p-6 sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-700">
              {data.platformHeading}
            </p>
            <ul className="mt-5 space-y-3.5">
              {data.platformItems.map((label, index) => {
                const Icon = PLATFORM_ICONS[index] ?? Check;
                return (
                  <li key={label} className="flex items-start gap-3 text-navy-800">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="pt-1.5 text-[0.95rem] font-semibold leading-snug">
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>
        <div className="container-page mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.proof.map((item, index) => {
            const Icon = PROOF_ICONS[index] ?? Shield;
            return (
              <article key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-[0.95rem] font-bold leading-snug text-navy-900">
                  {item.label}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="container-page">
          <h2 className="max-w-3xl text-balance-tight text-3xl font-bold tracking-tight text-navy-900">
            {data.pillarsHeading}
          </h2>
          {data.pillarsDescription ? (
            <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-slate-600">
              {data.pillarsDescription}
            </p>
          ) : null}
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {data.pillars.map((pillar) => (
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
            {data.towerEyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
                {data.towerEyebrow}
              </p>
            ) : null}
            <h2 className="mt-3 text-balance-tight text-3xl font-bold tracking-tight text-navy-900">
              {data.towerHeading}
            </h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-slate-600">{data.towerBody}</p>
            {data.towerStrip ? (
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-navy-800">
                {data.towerStrip}
              </p>
            ) : null}
          </div>
          <div className="relative">
            <SectionImage
              src={data.towerImageUrl}
              alt={data.towerImageAlt}
              width={1280}
              height={720}
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="w-full rounded-2xl object-cover shadow-lift"
            />
            {data.towerBadge ? (
              <p className="absolute left-4 top-4 rounded-full bg-navy-950/85 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white">
                {data.towerBadge}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-navy-950 py-16 lg:py-20">
        <div className="container-page">
          <h2 className="max-w-3xl text-balance-tight text-3xl font-bold tracking-tight text-white">
            {data.pipelineHeading}
          </h2>
          {data.pipelineDescription ? (
            <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-navy-200">
              {data.pipelineDescription}
            </p>
          ) : null}
          <ol className="mt-10 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
            {data.pipeline.map((step, index) => {
              const Icon =
                PIPELINE_ICONS[step.label as keyof typeof PIPELINE_ICONS] ?? Camera;
              const last = index === data.pipeline.length - 1;
              return (
                <li key={step.label} className="flex flex-1 flex-col lg:flex-row lg:items-stretch">
                  <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-white/10 text-accent-300">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-accent-300">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-white">{step.label}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-navy-200">{step.detail}</p>
                  </div>
                  {last ? null : (
                    <>
                      <span className="flex items-center justify-center py-1 text-accent-300 lg:hidden">
                        <ArrowDown className="size-5" aria-hidden="true" />
                      </span>
                      <span className="hidden items-center px-2 text-accent-300 lg:flex">
                        <ArrowRight className="size-5" aria-hidden="true" />
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="container-page">
          <h2 className="max-w-3xl text-balance-tight text-3xl font-bold tracking-tight text-navy-900">
            {data.applicationsHeading}
          </h2>
          {data.applicationsDescription ? (
            <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-slate-600">
              {data.applicationsDescription}
            </p>
          ) : null}
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {data.applications.map((item) => (
              <article key={item.title} className="surface-card overflow-hidden p-0">
                <div className="relative aspect-[16/9]">
                  <SectionImage
                    src={item.imageUrl}
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
            {data.customEyebrow ? (
              <p className="eyebrow-pill">{data.customEyebrow}</p>
            ) : null}
            <h2 className="mt-5 text-balance-tight text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {data.customHeading}
            </h2>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-navy-200">{data.customBody}</p>
            <ul className="mt-6 space-y-2.5">
              {data.customOptions.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-navy-200">
                  <Check className="mt-0.5 size-4 shrink-0 text-accent-300" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold uppercase tracking-[0.16em] text-accent-300">
              {data.customTraits.map((trait) => (
                <span key={trait}>{trait}</span>
              ))}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <p className="text-lg font-bold text-white">{data.customCardHeading}</p>
            <p className="mt-3 text-sm leading-relaxed text-navy-200">{data.customCardBody}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={data.customQuoteHref} variant="accent">
                {data.customQuoteLabel}
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
            <h2 className="text-3xl font-bold tracking-tight text-navy-900">{data.flyerHeading}</h2>
            <p className="mt-4 text-[1.05rem] leading-relaxed text-slate-600">
              {data.flyerDescription}
            </p>
            <a
              href={flyerUrl}
              download={flyerName}
              className={cn(buttonClasses("primary", "lg"), "mt-6")}
            >
              <Download className="size-4" aria-hidden="true" />
              {data.flyerButtonLabel}
            </a>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-card">
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
            <h2 className="text-2xl font-bold text-white">{data.ctaHeading}</h2>
            <p className="mt-2 max-w-xl text-navy-200">{data.ctaBody}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={data.quoteHref} variant="accent">
              {data.quoteLabel}
            </ButtonLink>
            <ButtonLink href={data.ctaSecondaryHref} variant="onDark">
              {data.ctaSecondaryLabel}
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
