import { SectionImage } from "@/components/visuals/section-image";
import { HOME_OFFICE_ALT, HOME_OFFICE_IMAGE } from "@/lib/home-office";
import { cn } from "@/lib/utils";

/**
 * Office photograph for the home hero. It takes the right-hand column so the
 * dusk shot sits with the headline instead of as a banner underneath.
 */
export function HomeOfficePhoto({
  src = HOME_OFFICE_IMAGE,
  alt = HOME_OFFICE_ALT,
  className,
}: {
  src?: string;
  alt?: string;
  className?: string;
}) {
  const imageSrc = src.trim() || HOME_OFFICE_IMAGE;
  const imageAlt = alt.trim() || HOME_OFFICE_ALT;

  return (
    <figure
      className={cn(
        "relative mx-auto w-full max-w-lg lg:mx-0 lg:h-full lg:max-w-none",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -inset-6 rounded-3xl bg-accent-500/10 blur-2xl"
        aria-hidden="true"
      />
      <div className="relative aspect-[16/9] min-h-[16rem] overflow-hidden rounded-2xl border border-white/10 bg-navy-950/80 shadow-lift lg:aspect-auto lg:h-full lg:min-h-[28rem]">
        <SectionImage
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 32rem, calc(100vw - 2.5rem)"
          className="size-full object-cover object-[center_58%]"
        />
      </div>
      <figcaption className="absolute inset-x-0 bottom-0 z-10 rounded-b-2xl bg-gradient-to-t from-navy-950/90 via-navy-950/45 to-transparent px-5 pb-4 pt-12 text-sm text-navy-100">
        97 White Oak Drive East, Sault Ste. Marie
      </figcaption>
    </figure>
  );
}
