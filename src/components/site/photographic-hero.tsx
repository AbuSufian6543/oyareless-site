import type { ReactNode } from "react";

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
    "mb-5 inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-navy-950/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-[0_1px_2px_rgb(4_19_37_/_0.45)]",
  heading:
    "text-balance-tight text-4xl leading-[1.08] font-bold tracking-tight text-white [text-shadow:0_1px_2px_rgb(4_19_37_/_0.55)] sm:text-5xl lg:text-[3.35rem]",
  sub:
    "mt-6 max-w-xl text-lg font-medium leading-relaxed text-white [text-shadow:0_1px_2px_rgb(4_19_37_/_0.65)] lg:text-xl",
  actions: "mt-9 flex flex-wrap gap-3",
  outlineButton:
    "border-white/50 bg-navy-950/30 shadow-[0_8px_24px_rgb(4_19_37_/_0.35)] backdrop-blur-sm hover:border-white hover:bg-white/12",
} as const;

/** Same IBM Plex / brand tokens, pale field, navy type. */
export const photoHeroCopyLight = {
  wrap: "max-w-xl lg:max-w-2xl",
  eyebrow:
    "mb-5 inline-flex items-center gap-2.5 rounded-full border border-brand-200 bg-white/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-700 shadow-sm backdrop-blur-md",
  heading:
    "text-balance-tight text-4xl leading-[1.08] font-bold text-navy-900 sm:text-5xl lg:text-[3.35rem]",
  sub: "mt-6 max-w-xl text-lg leading-relaxed text-slate-600 lg:text-xl",
  actions: "mt-9 flex flex-wrap gap-3",
  outlineButton:
    "border-navy-300 bg-white/85 text-navy-900 shadow-sm hover:border-navy-400 hover:bg-white",
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
  corner,
  light = false,
  children,
}: {
  src: string;
  alt?: string;
  id?: string;
  className?: string;
  footer?: ReactNode;
  /** Compact panel anchored to the lower-right of the photograph. */
  corner?: ReactNode;
  light?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative isolate flex min-h-[32rem] flex-col overflow-hidden lg:aspect-[1024/472] lg:min-h-[40rem]",
        light ? "bg-slate-50 text-navy-900" : "bg-navy-950 text-white",
        className,
      )}
    >
      <div className="absolute inset-0 -z-20">
        <SectionImage
          src={src}
          alt={alt}
          fill
          priority
          sizes="(min-width: 768px) 200vw, 100vw"
          className="size-full object-cover object-[32%_center] sm:object-center lg:object-center"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
      >
        {light ? (
          <>
            <div className="absolute inset-0 bg-white/50 lg:bg-white/20" />
            <div
              className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent lg:from-white/95 lg:via-white/72"
              style={{
                maskImage:
                  "linear-gradient(to right, black 0%, black 42%, transparent 74%)",
                WebkitMaskImage:
                  "linear-gradient(to right, black 0%, black 42%, transparent 74%)",
              }}
            />
            <div className="absolute -left-24 top-10 h-[28rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgb(255_255_255_/_0.85)_0%,transparent_72%)]" />
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white/80 to-transparent lg:from-white/55" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-navy-950/55 lg:hidden" />
            <div
              className="absolute inset-0 hidden bg-gradient-to-r from-navy-950/90 via-navy-950/62 to-transparent lg:block"
              style={{
                maskImage:
                  "linear-gradient(to right, black 0%, black 46%, transparent 72%)",
                WebkitMaskImage:
                  "linear-gradient(to right, black 0%, black 46%, transparent 72%)",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-navy-950/80 to-transparent lg:h-24 lg:from-navy-950/55" />
          </>
        )}
      </div>

      <div
        className={cn(
          "container-page relative flex flex-1 flex-col justify-center py-14 lg:py-16",
          corner && "lg:pr-[23rem]",
        )}
      >
        {children}
      </div>

      {corner || footer ? (
        <div className="relative z-20">
          {corner ? (
            <div className="container-page pb-3 lg:absolute lg:inset-x-0 lg:bottom-full lg:pb-3">
              <div className="ml-auto w-full lg:w-[20.5rem]">{corner}</div>
            </div>
          ) : null}
          {footer ? (
            <div
              className={
                light
                  ? "relative border-t border-slate-200 bg-white/85 backdrop-blur-md"
                  : "relative border-t border-white/12 bg-navy-950/40 backdrop-blur-md"
              }
            >
              {footer}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
