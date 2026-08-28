import type { ReactNode } from "react";

import { SectionImage } from "@/components/visuals/section-image";
import { TechBackdrop } from "@/components/visuals/tech-backdrop";

/**
 * Shared dark page intro used by tools, collections, and utility routes so
 * they sit in the same family as the home tech hero and the speed test.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  imageUrl,
  imageAlt,
  children,
}: {
  eyebrow?: ReactNode;
  title: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950">
      {imageUrl ? (
        <div className="absolute inset-0" aria-hidden="true">
          <SectionImage
            src={imageUrl}
            alt={imageAlt || ""}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-navy-950/78" />
        </div>
      ) : (
        <TechBackdrop density={0.6} glow="center" />
      )}
      <div className="container-page relative py-16 lg:py-20">
        {eyebrow && <p className="eyebrow-pill">{eyebrow}</p>}
        <h1 className="mt-5 max-w-3xl text-balance-tight text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.12]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-navy-200">
          {description}
        </p>
        {children}
      </div>
    </section>
  );
}
