import { Check, ChevronRight } from "lucide-react";

import { MediaSlideshow } from "@/components/blocks/media-slideshow";
import { ButtonLink, type ButtonVariant } from "@/components/ui/button";
import { SectionImage } from "@/components/visuals/section-image";
import { TechBackdrop } from "@/components/visuals/tech-backdrop";
import type { BlockOf, LinkItem } from "@/lib/blocks";
import { visibleSlideshow, type SlideshowItem } from "@/lib/slideshow";
import { cn } from "@/lib/utils";

const HEIGHTS: Record<string, string> = {
  sm: "py-14 lg:py-20",
  md: "py-20 lg:py-28",
  lg: "py-24 lg:py-36",
  full: "py-32 lg:min-h-[38rem] lg:py-40",
};

const STYLE_TO_VARIANT: Record<string, ButtonVariant> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "ghost",
  outline: "outline",
};

export function HeroBlock({
  block,
  slideshow = [],
}: {
  block: BlockOf<"hero">;
  slideshow?: SlideshowItem[];
}) {
  const { data } = block;
  const isLight = data.variant === "light";
  const isSplit = data.variant === "split";
  const hasMedia = Boolean(data.backgroundImageUrl || data.backgroundVideoUrl);
  const slides = visibleSlideshow(slideshow);

  if (isSplit) {
    const picture = slides.length > 0 || data.backgroundImageUrl;

    return (
      <section className="relative isolate overflow-hidden bg-navy-950">
        <TechBackdrop network density={0.75} glow="right" mood="network" />
        <div className="container-page relative">
          <div className="grid items-center gap-10 py-16 sm:gap-12 lg:grid-cols-2 lg:gap-16 lg:py-28">
            <div>
              <HeroCopy data={data} dark />
            </div>
            {picture && (
              <div className="relative">
                <div
                  className="absolute -inset-4 rounded-2xl bg-accent-500/10 blur-2xl"
                  aria-hidden="true"
                />
                {slides.length > 0 ? (
                  <MediaSlideshow
                    items={slides}
                    variant="hero"
                    label={`${data.eyebrow || data.headline} photos`}
                  />
                ) : (
                  <SectionImage
                    src={data.backgroundImageUrl}
                    alt={data.backgroundImageAlt || data.headline}
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    className="relative w-full rounded-xl object-cover shadow-lift"
                    priority
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden",
        isLight ? "bg-slate-50" : "bg-navy-900",
      )}
    >
      {data.backgroundVideoUrl ? (
        <video
          className="absolute inset-0 -z-10 size-full object-cover"
          src={data.backgroundVideoUrl}
          poster={data.backgroundImageUrl || undefined}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : (
        data.backgroundImageUrl && (
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <SectionImage
              src={data.backgroundImageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
            />
          </div>
        )
      )}

      {hasMedia && !isLight && (
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-900/95 to-brand-900/80"
          style={{ opacity: data.overlayOpacity / 100 }}
          aria-hidden="true"
        />
      )}

      {!hasMedia && !isLight && (
        <TechBackdrop network density={0.7} glow="right" mood="network" />
      )}

      <div className="container-page relative">
        <div
          className={cn(
            HEIGHTS[data.height] ?? HEIGHTS.lg,
            data.variant === "minimal" ? "max-w-3xl" : "max-w-4xl",
          )}
        >
          <HeroCopy data={data} dark={!isLight} />
        </div>
      </div>
    </section>
  );
}

function HeroCopy({
  data,
  dark,
}: {
  data: BlockOf<"hero">["data"];
  dark: boolean;
}) {
  return (
    <>
      {data.eyebrow && (
        <p
          className={cn(
            "mb-4",
            dark ? "eyebrow-pill" : "inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-700",
          )}
        >
          <span
            className="size-1.5 rounded-full bg-accent-400 animate-live-dot"
            aria-hidden="true"
          />
          {data.eyebrow}
        </p>
      )}

      <h1
        className={cn(
          "text-balance-tight text-4xl leading-[1.08] sm:text-5xl lg:text-[3.5rem]",
          dark ? "text-white" : "text-navy-900",
        )}
      >
        {data.headline}
      </h1>

      {data.subheadline && (
        <p
          className={cn(
            "mt-6 max-w-2xl text-lg leading-relaxed lg:text-xl",
            dark ? "text-navy-200" : "text-slate-600",
          )}
        >
          {data.subheadline}
        </p>
      )}

      {data.highlights.length > 0 && (
        <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5">
          {data.highlights.map((highlight, index) => (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                dark ? "text-navy-100" : "text-slate-700",
              )}
            >
              <Check
                className="size-4 shrink-0 text-accent-400"
                aria-hidden="true"
              />
              {highlight}
            </li>
          ))}
        </ul>
      )}

      {data.buttons.length > 0 && (
        <div className="mt-9 flex flex-wrap gap-3">
          {data.buttons.map((button: LinkItem, index) => (
            <ButtonLink
              key={index}
              href={button.href}
              openInNewTab={button.openInNewTab}
              size="lg"
              variant={
                button.style === "outline" && dark
                  ? "onDark"
                  : button.style === "primary" && dark
                    ? "accent"
                    : (STYLE_TO_VARIANT[button.style] ?? "primary")
              }
            >
              {button.label}
              <ChevronRight className="size-4" aria-hidden="true" />
            </ButtonLink>
          ))}
        </div>
      )}
    </>
  );
}
