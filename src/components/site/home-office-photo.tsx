import { SectionImage } from "@/components/visuals/section-image";
import { HOME_OFFICE_ALT, HOME_OFFICE_IMAGE } from "@/lib/home-office";

/**
 * Office photograph that sits under the home headline and Scope of work
 * panel. Framed like the scope card so the dusk shot belongs to the navy
 * hero instead of reading as a leftover banner.
 */
export function HomeOfficePhoto({
  src = HOME_OFFICE_IMAGE,
  alt = HOME_OFFICE_ALT,
}: {
  src?: string;
  alt?: string;
}) {
  const imageSrc = src.trim() || HOME_OFFICE_IMAGE;
  const imageAlt = alt.trim() || HOME_OFFICE_ALT;

  return (
    <figure className="mt-12 lg:mt-16">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10 bg-navy-900 shadow-lift sm:aspect-[1.85/1]">
        <SectionImage
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="(min-width: 1280px) 72rem, calc(100vw - 2.5rem)"
          className="size-full object-cover object-[center_58%]"
        />
      </div>
      <figcaption className="mt-3 text-sm text-navy-300">
        97 White Oak Drive East, Sault Ste. Marie
      </figcaption>
    </figure>
  );
}
