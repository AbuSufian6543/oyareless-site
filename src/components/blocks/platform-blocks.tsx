import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldAlert } from "lucide-react";

import {
  Section,
  SectionHeading,
  isDarkBackground,
} from "@/components/blocks/section";
import { ButtonLink, type ButtonVariant } from "@/components/ui/button";
import { BlockIcon } from "@/components/ui/icon";
import { SectionImage } from "@/components/visuals/section-image";
import { TechBackdrop } from "@/components/visuals/tech-backdrop";
import { SiteStackPanel } from "@/components/visuals/site-stack-panel";
import type { BlockOf } from "@/lib/blocks";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

const HEIGHTS: Record<string, string> = {
  sm: "py-16 lg:py-20",
  md: "py-20 lg:py-28",
  lg: "py-24 lg:py-36",
};

/**
 * Primary hero for the platform pages. The background is the animated node
 * mesh, optionally over a photograph.
 */
export async function TechHeroBlock({ block }: { block: BlockOf<"techHero"> }) {
  const { data } = block;
  const settings = await getSettings();
  const photo = data.backgroundImageUrl || settings.homeHeroImageUrl;

  return (
    <section
      id={block.settings?.anchor || undefined}
      className={cn(
        "relative isolate overflow-hidden bg-navy-950 text-white",
        HEIGHTS[data.height] ?? HEIGHTS.lg,
      )}
    >
      {photo && (
        <div className="absolute inset-0 -z-20" aria-hidden="true">
          <SectionImage
            src={photo}
            alt={data.backgroundImageAlt || ""}
            priority
            sizes="100vw"
            className="size-full object-cover"
          />
          <div
            className="absolute inset-0 bg-navy-950"
            style={{ opacity: data.overlayOpacity / 100 }}
          />
        </div>
      )}

      <TechBackdrop
        network={data.networkDensity > 0}
        density={data.networkDensity / 100}
        glow="right"
        // The photo layer already supplies the base color when present.
        className={photo ? "bg-transparent" : undefined}
      />

      <div className="container-page relative">
        <div
          className={cn(
            "grid items-center gap-12",
            !photo &&
              "lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,22rem)] lg:gap-16",
          )}
        >
        <div className="max-w-3xl">
          {data.eyebrow && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent-300">
              {data.eyebrow}
            </p>
          )}

          <h1 className="text-balance-tight text-4xl leading-[1.08] font-bold lg:text-[3.5rem]">
            {data.headline}
          </h1>

          {data.subheadline && (
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-200 lg:text-xl">
              {data.subheadline}
            </p>
          )}

          {data.buttons.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {data.buttons.map((button, index) => (
                <ButtonLink
                  key={index}
                  href={button.href}
                  openInNewTab={button.openInNewTab}
                  size="lg"
                  variant={heroButtonVariant(button.style, index)}
                  className={
                    button.style === "outline"
                      ? "border-white/35 text-white hover:bg-white/10"
                      : undefined
                  }
                >
                  {button.label}
                </ButtonLink>
              ))}
            </div>
          )}

          {data.highlights.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-6 text-sm text-navy-200">
              {data.highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-2">
                  <span
                    className="size-1.5 rounded-full bg-accent-400"
                    aria-hidden="true"
                  />
                  {highlight}
                </li>
              ))}
            </ul>
          )}
        </div>
          {!photo && <SiteStackPanel />}
        </div>
      </div>
    </section>
  );
}

function heroButtonVariant(style: string, index: number): ButtonVariant {
  if (style === "outline" || style === "ghost") return "outline";
  if (style === "secondary") return "secondary";
  // First primary button gets the accent so it reads against navy.
  return index === 0 ? "accent" : "primary";
}

/** Data / Voice / Video / Security — the four service pillars. */
export function PillarsBlock({ block }: { block: BlockOf<"pillars"> }) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings} defaultBackground="white">
      <SectionHeading
        eyebrow={data.eyebrow}
        heading={data.heading}
        description={data.description}
        dark={dark}
        align={block.settings?.align ?? "left"}
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {data.items.map((item, index) => {
          const inner = (
            <>
              <span
                className={cn(
                  "mb-5 flex size-12 items-center justify-center rounded-xl transition-colors",
                  dark
                    ? "bg-accent-500/15 text-accent-300 group-hover:bg-accent-500/25"
                    : "bg-brand-50 text-brand-600 group-hover:bg-brand-100",
                )}
              >
                <BlockIcon name={item.icon} className="size-6" />
              </span>

              <h3
                className={cn(
                  "text-lg font-bold",
                  dark ? "text-white" : "text-navy-900",
                )}
              >
                {item.title}
              </h3>

              {item.description && (
                <p
                  className={cn(
                    "mt-2 text-[0.9375rem] leading-relaxed",
                    dark ? "text-navy-300" : "text-slate-600",
                  )}
                >
                  {item.description}
                </p>
              )}

              {item.points.length > 0 && (
                <ul
                  className={cn(
                    "mt-4 space-y-1.5 text-sm",
                    dark ? "text-navy-300" : "text-slate-500",
                  )}
                >
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span
                        className={cn(
                          "mt-1.5 size-1 shrink-0 rounded-full",
                          dark ? "bg-accent-400" : "bg-brand-400",
                        )}
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              )}

              {item.href && (
                <span
                  className={cn(
                    "mt-5 inline-flex items-center gap-1.5 text-sm font-semibold",
                    dark ? "text-accent-300" : "text-brand-600",
                  )}
                >
                  Learn more
                  <ArrowRight
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              )}
            </>
          );

          const className = cn(
            "group flex flex-col rounded-2xl border p-6 transition-all",
            dark
              ? "border-navy-700 bg-navy-800/50 hover:border-accent-500/40 hover:bg-navy-800"
              : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift",
          );

          return item.href ? (
            <Link key={index} href={item.href} className={className}>
              {inner}
            </Link>
          ) : (
            <div key={index} className={className}>
              {inner}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

const CAPABILITY_COLUMNS: Record<string, string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 lg:grid-cols-3",
};

/** Photo-led cards for the nine core capabilities. */
export function CapabilityGridBlock({
  block,
}: {
  block: BlockOf<"capabilityGrid">;
}) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings} defaultBackground="light">
      <SectionHeading
        eyebrow={data.eyebrow}
        heading={data.heading}
        description={data.description}
        dark={dark}
        align={block.settings?.align ?? "left"}
      />

      <div
        className={cn(
          "grid gap-5",
          CAPABILITY_COLUMNS[data.columns] ?? CAPABILITY_COLUMNS["3"],
        )}
      >
        {data.items.map((item, index) => {
          const showImage = data.showImages && Boolean(item.imageUrl);

          const inner = (
            <>
              {showImage && (
                <div className="relative aspect-16/10 overflow-hidden bg-navy-900">
                  <SectionImage
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent"
                    aria-hidden="true"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col p-6">
                <span
                  className={cn(
                    "mb-4 flex size-11 items-center justify-center rounded-lg",
                    dark
                      ? "bg-accent-500/15 text-accent-300"
                      : "bg-brand-50 text-brand-600",
                  )}
                >
                  <BlockIcon name={item.icon} className="size-5.5" />
                </span>

                <h3
                  className={cn(
                    "text-[1.0625rem] font-bold",
                    dark ? "text-white" : "text-navy-900",
                  )}
                >
                  {item.title}
                </h3>

                {item.description && (
                  <p
                    className={cn(
                      "mt-2 flex-1 text-[0.9375rem] leading-relaxed",
                      dark ? "text-navy-300" : "text-slate-600",
                    )}
                  >
                    {item.description}
                  </p>
                )}

                {item.href && (
                  <span
                    className={cn(
                      "mt-4 inline-flex items-center gap-1.5 text-sm font-semibold",
                      dark ? "text-accent-300" : "text-brand-600",
                    )}
                  >
                    Explore
                    <ArrowUpRight
                      className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      aria-hidden="true"
                    />
                  </span>
                )}
              </div>
            </>
          );

          const className = cn(
            "group flex flex-col overflow-hidden rounded-2xl border transition-all",
            dark
              ? "border-navy-700 bg-navy-800/50 hover:border-accent-500/40"
              : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift",
          );

          return item.href ? (
            <Link key={index} href={item.href} className={className}>
              {inner}
            </Link>
          ) : (
            <div key={index} className={className}>
              {inner}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/**
 * Vendor logos or typographic tiles. The qualifier line is content-driven so
 * relationship claims stay accurate.
 */
function BrandLogo({
  url,
  name,
}: {
  url: string;
  name: string;
  dark: boolean;
}) {
  const className = cn(
    "h-7 w-auto max-w-[9.5rem] object-contain",
  );

  const mark = /\.svg(?:$|\?)/i.test(url) || url.startsWith("/brand/") ? (
    // Official vendor marks skip next/image so they are not re-encoded.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={className} />
  ) : (
    <SectionImage
      src={url}
      alt={name}
      width={160}
      height={48}
      sizes="160px"
      className={className}
    />
  );

  return (
    <span className="flex h-12 w-full items-center justify-center rounded-md bg-white px-3 py-1.5">
      {mark}
    </span>
  );
}

export function BrandGridBlock({ block }: { block: BlockOf<"brandGrid"> }) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);

  const tile = (item: (typeof data.items)[number], key: string) => {
    const inner = (
      <>
        {item.logoUrl ? (
          <BrandLogo url={item.logoUrl} name={item.name} dark={dark} />
        ) : (
          <span
            className={cn(
              "text-base font-bold tracking-tight",
              dark ? "text-white" : "text-navy-800",
            )}
          >
            {item.name}
          </span>
        )}
        {item.logoUrl ? (
          <span
            className={cn(
              "mt-1.5 text-center text-xs font-semibold tracking-tight",
              dark ? "text-white" : "text-navy-800",
            )}
          >
            {item.name}
          </span>
        ) : null}
        {item.category && (
          <span
            className={cn(
              "mt-1 text-center text-[0.6875rem] leading-tight",
              dark ? "text-navy-400" : "text-slate-500",
            )}
          >
            {item.category}
          </span>
        )}
      </>
    );

    const className = cn(
      "group flex min-h-[7.25rem] shrink-0 flex-col items-center justify-center rounded-xl border px-4 py-3 transition-colors",
      data.layout === "marquee" ? "w-44" : "",
      dark
        ? "border-navy-700 bg-navy-800/50 hover:border-accent-400/45"
        : "border-slate-200 bg-white hover:border-brand-300",
    );

    if (!item.href) {
      return (
        <div key={key} className={className}>
          {inner}
        </div>
      );
    }

    const opensNewTab = /^(https?:)?\/\//.test(item.href);

    if (opensNewTab) {
      return (
        <a
          key={key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {inner}
        </a>
      );
    }

    return (
      <Link key={key} href={item.href} className={className}>
        {inner}
      </Link>
    );
  };

  return (
    <Section settings={block.settings} defaultBackground="white">
      <SectionHeading
        eyebrow={data.eyebrow}
        heading={data.heading}
        description={data.description}
        dark={dark}
        align={block.settings?.align ?? "left"}
      />

      {data.layout === "marquee" ? (
        // Overflow is hidden and the track is duplicated so the scroll loops
        // seamlessly. The duplicate is hidden from assistive tech.
        <div className="relative overflow-hidden">
          <div className="animate-marquee flex w-max gap-4">
            {data.items.map((item, index) => tile(item, `a${index}`))}
            <div className="flex gap-4" aria-hidden="true">
              {data.items.map((item, index) => tile(item, `b${index}`))}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-2 gap-4 sm:grid-cols-3",
            data.items.length >= 12 ? "lg:grid-cols-4" : "lg:grid-cols-5",
          )}
        >
          {data.items.map((item, index) => tile(item, String(index)))}
        </div>
      )}

      {data.disclaimer && (
        <p
          className={cn(
            "mt-6 text-sm",
            dark ? "text-navy-400" : "text-slate-500",
          )}
        >
          {data.disclaimer}
        </p>
      )}
    </Section>
  );
}

const TOOL_COLUMNS: Record<string, string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 lg:grid-cols-3",
  "4": "sm:grid-cols-2 lg:grid-cols-4",
};

/** Compact directory of the network and security tools. */
export function ToolGridBlock({ block }: { block: BlockOf<"toolGrid"> }) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings} defaultBackground="white">
      <SectionHeading
        eyebrow={data.eyebrow}
        heading={data.heading}
        description={data.description}
        dark={dark}
        align={block.settings?.align ?? "left"}
      />

      <div className={cn("grid gap-4", TOOL_COLUMNS[data.columns] ?? TOOL_COLUMNS["3"])}>
        {data.items.map((item, index) => {
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-lg",
                    dark
                      ? "bg-accent-500/15 text-accent-300"
                      : "bg-brand-50 text-brand-600",
                  )}
                >
                  <BlockIcon name={item.icon} className="size-5" />
                </span>
                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
                      dark
                        ? "bg-navy-700 text-navy-200"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <h3
                className={cn(
                  "mt-4 font-bold",
                  dark ? "text-white" : "text-navy-900",
                )}
              >
                {item.title}
              </h3>
              {item.description && (
                <p
                  className={cn(
                    "mt-1.5 text-sm leading-relaxed",
                    dark ? "text-navy-300" : "text-slate-600",
                  )}
                >
                  {item.description}
                </p>
              )}
            </>
          );

          const className = cn(
            "group flex flex-col rounded-xl border p-5 transition-all",
            dark
              ? "border-navy-700 bg-navy-800/50 hover:border-accent-500/40 hover:bg-navy-800"
              : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift",
          );

          return item.href ? (
            <Link key={index} href={item.href} className={className}>
              {inner}
            </Link>
          ) : (
            <div key={index} className={className}>
              {inner}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/** Problem → Solution → Result cards. */
export function CaseStudyGridBlock({
  block,
}: {
  block: BlockOf<"caseStudyGrid">;
}) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);

  const stages: Array<{ key: "problem" | "solution" | "result"; label: string }> =
    [
      { key: "problem", label: "Problem" },
      { key: "solution", label: "Solution" },
      { key: "result", label: "Result" },
    ];

  return (
    <Section settings={block.settings} defaultBackground="light">
      <SectionHeading
        eyebrow={data.eyebrow}
        heading={data.heading}
        description={data.description}
        dark={dark}
        align={block.settings?.align ?? "left"}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {data.items.map((item, index) => (
          <article
            key={index}
            className={cn(
              "flex flex-col overflow-hidden rounded-2xl border",
              dark
                ? "border-navy-700 bg-navy-800/50"
                : "border-slate-200 bg-white",
            )}
          >
            {item.imageUrl && (
              <div className="relative aspect-16/10 bg-navy-900">
                <SectionImage
                  src={item.imageUrl}
                  alt={item.imageAlt}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="size-full object-cover"
                />
              </div>
            )}

            <div className="flex flex-1 flex-col p-6 lg:p-7">
              {item.sector && (
                <p
                  className={cn(
                    "mb-2 text-xs font-bold uppercase tracking-[0.14em]",
                    dark ? "text-accent-400" : "text-brand-600",
                  )}
                >
                  {item.sector}
                </p>
              )}

              <h3
                className={cn(
                  "text-xl font-bold leading-snug",
                  dark ? "text-white" : "text-navy-900",
                )}
              >
                {item.title}
              </h3>

              <dl className="mt-5 space-y-4">
                {stages.map((stage) =>
                  item[stage.key] ? (
                    <div key={stage.key} className="flex gap-3.5">
                      <span
                        className={cn(
                          "mt-1 h-full w-0.5 shrink-0 rounded-full",
                          dark ? "bg-accent-500/40" : "bg-brand-200",
                        )}
                        aria-hidden="true"
                      />
                      <div>
                        <dt
                          className={cn(
                            "text-[0.6875rem] font-bold uppercase tracking-wider",
                            dark ? "text-navy-400" : "text-slate-400",
                          )}
                        >
                          {stage.label}
                        </dt>
                        <dd
                          className={cn(
                            "mt-0.5 text-[0.9375rem] leading-relaxed",
                            dark ? "text-navy-200" : "text-slate-600",
                          )}
                        >
                          {item[stage.key]}
                        </dd>
                      </div>
                    </div>
                  ) : null,
                )}
              </dl>

              {item.href && (
                <Link
                  href={item.href}
                  className={cn(
                    "mt-6 inline-flex items-center gap-1.5 text-sm font-semibold",
                    dark
                      ? "text-accent-300 hover:text-accent-200"
                      : "text-brand-600 hover:text-brand-700",
                  )}
                >
                  Read the full story
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

const KB_COLUMNS: Record<string, string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 lg:grid-cols-3",
};

/** Featured knowledge-base articles. */
export function KbHighlightsBlock({
  block,
}: {
  block: BlockOf<"kbHighlights">;
}) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);

  return (
    <Section settings={block.settings} defaultBackground="white">
      <SectionHeading
        eyebrow={data.eyebrow}
        heading={data.heading}
        description={data.description}
        dark={dark}
        align={block.settings?.align ?? "left"}
      />

      <div className={cn("grid gap-4", KB_COLUMNS[data.columns] ?? KB_COLUMNS["3"])}>
        {data.items.map((item, index) => (
          <Link
            key={index}
            href={item.href || "/knowledge-base"}
            className={cn(
              "group flex gap-4 rounded-xl border p-5 transition-all",
              dark
                ? "border-navy-700 bg-navy-800/50 hover:border-accent-500/40"
                : "border-slate-200 bg-white hover:border-brand-200 hover:shadow-sm",
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                dark
                  ? "bg-accent-500/15 text-accent-300"
                  : "bg-brand-50 text-brand-600",
              )}
            >
              <BlockIcon name={item.icon} className="size-5" />
            </span>

            <div className="min-w-0">
              {item.category && (
                <p
                  className={cn(
                    "text-[0.6875rem] font-bold uppercase tracking-wider",
                    dark ? "text-navy-400" : "text-slate-400",
                  )}
                >
                  {item.category}
                </p>
              )}
              <h3
                className={cn(
                  "mt-0.5 font-semibold leading-snug",
                  dark
                    ? "text-white group-hover:text-accent-200"
                    : "text-navy-900 group-hover:text-brand-700",
                )}
              >
                {item.title}
              </h3>
              {item.description && (
                <p
                  className={cn(
                    "mt-1.5 text-sm leading-relaxed",
                    dark ? "text-navy-300" : "text-slate-600",
                  )}
                >
                  {item.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {data.buttons.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-3">
          {data.buttons.map((button, index) => (
            <ButtonLink
              key={index}
              href={button.href}
              openInNewTab={button.openInNewTab}
              variant={button.style === "primary" ? "primary" : "outline"}
              className={
                dark && button.style !== "primary"
                  ? "border-white/35 text-white hover:bg-white/10"
                  : undefined
              }
            >
              {button.label}
            </ButtonLink>
          ))}
        </div>
      )}
    </Section>
  );
}

/**
 * Concentric "defense in depth" diagram.
 *
 * Rendered as nested rings on wide screens and a stacked list on narrow ones.
 * The list is the accessible representation in both cases — the rings are
 * presentation only.
 */
export function DefenseInDepthBlock({
  block,
}: {
  block: BlockOf<"defenseInDepth">;
}) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);
  const layers = data.layers;

  return (
    <Section settings={block.settings} defaultBackground="dark">
      <SectionHeading
        eyebrow={data.eyebrow}
        heading={data.heading}
        description={data.description}
        dark={dark}
        align={block.settings?.align ?? "left"}
      />

      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Ring diagram. Hidden below lg, where the list carries everything. */}
        <div
          className="relative mx-auto hidden aspect-square w-full max-w-md lg:block"
          aria-hidden="true"
        >
          {layers.map((layer, index) => {
            // Outermost layer is the largest ring.
            const inset = (index / (layers.length + 0.6)) * 100;
            return (
              <div
                key={index}
                className={cn(
                  "absolute rounded-full border",
                  index === layers.length - 1
                    ? dark
                      ? "border-brand-400/50 bg-brand-500/[0.08]"
                      : "border-brand-300 bg-brand-50"
                    : dark
                      ? "border-accent-500/25 bg-accent-500/[0.04]"
                      : "border-brand-300/60 bg-brand-500/[0.04]",
                )}
                style={{
                  inset: `${inset / 2}%`,
                }}
              >
                <span
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.625rem] font-bold uppercase tracking-wider",
                    index === layers.length - 1
                      ? dark
                        ? "text-brand-200"
                        : "text-brand-700"
                      : dark
                        ? "text-accent-300"
                        : "text-brand-700",
                  )}
                  style={{ top: "0.5rem" }}
                >
                  {layer.title}
                </span>
                <span
                  className={cn(
                    "absolute left-1/2 top-0 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full animate-live-dot",
                    index === layers.length - 1 ? "bg-brand-400" : "bg-accent-400",
                  )}
                />
              </div>
            );
          })}

          <div
            className={cn(
              "absolute left-1/2 top-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-center text-xs font-bold",
              dark
                ? "bg-accent-400 text-navy-950"
                : "bg-brand-600 text-white",
            )}
          >
            {data.centreLabel}
          </div>
        </div>

        <ol className="space-y-3">
          {layers.map((layer, index) => (
            <li
              key={index}
              className={cn(
                "flex gap-4 rounded-xl border p-5",
                dark
                  ? "border-navy-700 bg-navy-800/50"
                  : "border-slate-200 bg-white",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  dark
                    ? "bg-accent-500/15 text-accent-300"
                    : "bg-brand-50 text-brand-600",
                )}
              >
                <BlockIcon name={layer.icon} className="size-5" />
              </span>

              <div className="min-w-0">
                <h3
                  className={cn(
                    "font-bold",
                    dark ? "text-white" : "text-navy-900",
                  )}
                >
                  <span
                    className={cn(
                      "mr-2 text-xs font-mono",
                      dark ? "text-navy-500" : "text-slate-400",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {layer.title}
                </h3>
                {layer.description && (
                  <p
                    className={cn(
                      "mt-1.5 text-sm leading-relaxed",
                      dark ? "text-navy-300" : "text-slate-600",
                    )}
                  >
                    {layer.description}
                  </p>
                )}
                {layer.controls.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {layer.controls.map((control) => (
                      <li
                        key={control}
                        className={cn(
                          "rounded border px-2 py-0.5 text-[0.6875rem] font-medium",
                          dark
                            ? "border-navy-600 text-navy-300"
                            : "border-slate-200 text-slate-600",
                        )}
                      >
                        {control}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {data.threats.length > 0 && (
        <div
          className={cn(
            "mt-10 rounded-2xl border p-6",
            dark
              ? "border-navy-700 bg-navy-950/40"
              : "border-slate-200 bg-slate-50",
          )}
        >
          <h3
            className={cn(
              "flex items-center gap-2 text-sm font-bold uppercase tracking-wider",
              dark ? "text-navy-200" : "text-navy-800",
            )}
          >
            <ShieldAlert
              className={cn("size-4", dark ? "text-accent-400" : "text-brand-600")}
              aria-hidden="true"
            />
            Threats these layers help reduce exposure to
          </h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {data.threats.map((threat) => (
              <li
                key={threat}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium",
                  dark
                    ? "border-navy-600 bg-navy-800/60 text-navy-200"
                    : "border-slate-200 bg-white text-slate-700",
                )}
              >
                {threat}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Section>
  );
}
