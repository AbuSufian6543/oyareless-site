import type { ReactNode } from "react";

import { TechBackdrop } from "@/components/visuals/tech-backdrop";
import { SectionImage } from "@/components/visuals/section-image";
import { HOME_OFFICE_ALT } from "@/lib/home-office";
import { cn } from "@/lib/utils";

/**
 * Type and chrome that sit on the dusk office photograph.
 *
 * White for the headline, ice-cyan for the eyebrow (the UI accent), and a
 * slightly blue-tinted body so copy matches the cool sky instead of the
 * building's gold uplights. Buttons stay cyan; they should not compete with
 * the architectural lighting.
 */
export const photoHeroCopy = {
  wrap: "max-w-xl lg:max-w-2xl",
  eyebrow:
    "mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/18 bg-navy-950/50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-accent-300 shadow-[0_10px_28px_rgb(4_19_37_/_0.4)] backdrop-blur-md",
  heading:
    "text-balance-tight text-4xl leading-[1.08] font-bold text-white [text-shadow:0_2px_28px_rgb(4_19_37_/_0.72)] sm:text-5xl lg:text-[3.35rem]",
  sub:
    "mt-6 max-w-xl text-lg leading-relaxed text-navy-50 [text-shadow:0_1px_18px_rgb(4_19_37_/_0.7)] lg:text-xl",
  actions: "mt-9 flex flex-wrap gap-3",
  outlineButton:
    "border-white/50 bg-navy-950/30 shadow-[0_8px_24px_rgb(4_19_37_/_0.35)] backdrop-blur-sm hover:border-white hover:bg-white/12",
} as const;

/**
 * Home hero when the office photograph is the background.
 *
 * The dusk shot is dark charcoal, cool sky, and warm gold lights, with the
 * building and sign on the right. Copy stays on the left over a masked navy
 * well; the right side stays open. Cyan is the UI accent so buttons do not
 * compete with the building lights.
 */
export function PhotographicHero({
  src,
  alt = HOME_OFFICE_ALT,
  id,
  className,
  footer,
  children,
}: {
  src: string;
  alt?: string;
  id?: string;
  className?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative isolate flex min-h-[32rem] flex-col overflow-hidden bg-navy-950 text-white lg:min-h-[38rem]",
        className,
      )}
    >
      <div className="absolute inset-0 -z-20">
        <SectionImage
          src={src}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="size-full object-cover object-[58%_46%] sm:object-[68%_44%] lg:object-[76%_42%]"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        {/* Light overall veil — enough for type, not a flat navy field. */}
        <div className="absolute inset-0 bg-navy-950/38 lg:bg-navy-950/12" />

        {/* Copy well on the left only; the mask keeps the sign and uplights. */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-navy-950/88 via-navy-950/58 to-transparent lg:from-navy-950/78 lg:via-navy-950/36"
          style={{
            maskImage:
              "linear-gradient(to right, black 0%, black 42%, transparent 74%)",
            WebkitMaskImage:
              "linear-gradient(to right, black 0%, black 42%, transparent 74%)",
          }}
        />

        {/* Local contrast behind the headline, still left-weighted. */}
        <div className="absolute -left-24 top-10 h-[28rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgb(4_19_37_/_0.55)_0%,transparent_72%)] lg:bg-[radial-gradient(circle,rgb(4_19_37_/_0.42)_0%,transparent_72%)]" />

        {/* Let the building's gold lights breathe on the right. */}
        <div className="absolute -right-10 bottom-10 hidden h-[22rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgb(245_186_72_/_0.14)_0%,transparent_70%)] lg:block" />

        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-navy-950/50 to-transparent lg:from-navy-950/22" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-navy-950/70 to-transparent lg:from-navy-950/45" />
      </div>

      <TechBackdrop
        wash="photo"
        network
        density={0.28}
        glow="none"
        scrim="none"
        mood="network"
      />

      <div className="container-page relative flex flex-1 flex-col justify-center py-16 lg:py-20">
        {children}
      </div>

      {footer ? (
        <div className="relative border-t border-white/12 bg-navy-950/40 backdrop-blur-md">
          {footer}
        </div>
      ) : null}
    </section>
  );
}
