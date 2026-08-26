import Image from "next/image";

import { GalleryCarousel } from "@/components/blocks/gallery-carousel";
import { Section, SectionHeading, isDarkBackground } from "@/components/blocks/section";
import type { BlockOf } from "@/lib/blocks";
import { sanitizeEmbed } from "@/lib/sanitize";
import { cn, toEmbedUrl } from "@/lib/utils";

const ASPECTS: Record<string, string> = {
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
  "21/9": "aspect-[21/9]",
  "1/1": "aspect-square",
};

export function VideoEmbedBlock({ block }: { block: BlockOf<"videoEmbed"> }) {
  const dark = isDarkBackground(block.settings);
  const src = toEmbedUrl(block.data.url);

  return (
    <Section settings={block.settings}>
      <SectionHeading
        heading={block.data.heading}
        description={block.data.description}
        dark={dark}
      />

      {src ? (
        <div
          className={cn(
            "overflow-hidden rounded-xl bg-navy-950 shadow-card",
            ASPECTS[block.data.aspectRatio] ?? ASPECTS["16/9"],
          )}
        >
          <iframe
            src={src}
            title={block.data.heading || "Embedded video"}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <PlaceholderNotice message="No video URL has been set for this block yet." />
      )}
    </Section>
  );
}

export function EmbedBlock({ block }: { block: BlockOf<"embed"> }) {
  const dark = isDarkBackground(block.settings);
  const html = sanitizeEmbed(block.data.html);

  return (
    <Section settings={block.settings}>
      <SectionHeading
        heading={block.data.heading}
        description={block.data.description}
        dark={dark}
      />

      {html.trim() ? (
        <div
          className="[&_iframe]:size-full [&_iframe]:rounded-xl [&_video]:w-full [&_video]:rounded-xl overflow-hidden rounded-xl"
          style={{ minHeight: block.data.minHeight }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <PlaceholderNotice
          message="No embed code has been added, or the source host is not on the allowlist."
        />
      )}
    </Section>
  );
}

const GALLERY_COLUMNS: Record<string, string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-2 lg:grid-cols-4",
};

export function GalleryBlock({ block }: { block: BlockOf<"gallery"> }) {
  const { data } = block;
  const dark = isDarkBackground(block.settings);
  const images = data.images.filter((image) => image.url);

  return (
    <Section settings={block.settings}>
      <SectionHeading
        heading={data.heading}
        description={data.description}
        dark={dark}
      />

      {images.length === 0 ? (
        <PlaceholderNotice message="No images have been added to this gallery yet." />
      ) : data.layout === "carousel" ? (
        <GalleryCarousel images={images} />
      ) : (
        <div
          className={cn(
            "grid gap-4",
            GALLERY_COLUMNS[data.columns] ?? GALLERY_COLUMNS["3"],
          )}
        >
          {images.map((image, index) => (
            <figure key={index} className="group">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {image.caption && (
                <figcaption
                  className={cn(
                    "mt-2.5 text-sm",
                    dark ? "text-navy-300" : "text-slate-500",
                  )}
                >
                  {image.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </Section>
  );
}

function PlaceholderNotice({ message }: { message: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
