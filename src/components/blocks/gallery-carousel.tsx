"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type GalleryImage = { url: string; alt: string; caption: string };

/** Auto-advancing carousel used by the gallery block's "carousel" layout. */
export function GalleryCarousel({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (direction: 1 | -1) => {
      setIndex((current) => (current + direction + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    if (paused || images.length < 2) return;
    const timer = setInterval(() => go(1), 5500);
    return () => clearInterval(timer);
  }, [go, paused, images.length]);

  if (images.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-navy-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Project photos"
    >
      <div className="relative aspect-[16/9]">
        {images.map((image, imageIndex) => (
          <div
            key={imageIndex}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              imageIndex === index ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={imageIndex !== index}
          >
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 70vw"
              className="object-cover"
              priority={imageIndex === 0}
            />
            {image.caption && (
              <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/85 to-transparent p-5 pt-12 text-sm text-white">
                {image.caption}
              </p>
            )}
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-navy-950/60 p-2.5 text-white backdrop-blur transition-colors hover:bg-navy-950/85"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-navy-950/60 p-2.5 text-white backdrop-blur transition-colors hover:bg-navy-950/85"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {images.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                onClick={() => setIndex(dotIndex)}
                aria-label={`Go to image ${dotIndex + 1}`}
                aria-current={dotIndex === index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  dotIndex === index
                    ? "w-7 bg-accent-400"
                    : "w-1.5 bg-white/50 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
