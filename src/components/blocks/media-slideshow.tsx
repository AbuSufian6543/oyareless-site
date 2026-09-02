"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { SlideshowItem } from "@/lib/slideshow";
import { cn, toEmbedUrl } from "@/lib/utils";

const PHOTO_INTERVAL_MS = 5500;

/**
 * Auto-advancing mixed photo/video carousel. Photos rotate on a timer; a
 * video slide stays until the visitor moves on so a promo is not cut off.
 */
export function MediaSlideshow({
  items,
  label = "Photos and promo videos",
}: {
  items: SlideshowItem[];
  label?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (direction: 1 | -1) => {
      setIndex((current) => (current + direction + items.length) % items.length);
    },
    [items.length],
  );

  const current = items[index];

  useEffect(() => {
    if (paused || items.length < 2) return;
    if (current?.kind === "video") return;
    const timer = setInterval(() => go(1), PHOTO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [current?.kind, go, items.length, paused]);

  if (items.length === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-navy-950"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="relative aspect-[16/9]">
        {items.map((item, itemIndex) => {
          const active = itemIndex === index;
          return (
            <div
              key={`${item.kind}-${item.kind === "image" ? item.url : item.url}-${itemIndex}`}
              className={cn(
                "absolute inset-0 transition-opacity duration-700",
                active ? "opacity-100" : "opacity-0",
              )}
              aria-hidden={!active}
            >
              {item.kind === "image" ? (
                <>
                  <Image
                    src={item.url}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 70vw"
                    className="object-contain p-2"
                    priority={itemIndex === 0}
                  />
                  {item.caption && (
                    <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/85 to-transparent p-5 pt-12 text-sm text-white">
                      {item.caption}
                    </p>
                  )}
                </>
              ) : active ? (
                <iframe
                  src={toEmbedUrl(item.url)}
                  title={item.title || "Promo video"}
                  className="size-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <div className="size-full bg-navy-950" />
              )}
            </div>
          );
        })}
      </div>

      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-navy-950/60 p-2.5 text-white backdrop-blur transition-colors hover:bg-navy-950/85"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-navy-950/60 p-2.5 text-white backdrop-blur transition-colors hover:bg-navy-950/85"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {items.map((_, dotIndex) => (
              <button
                key={dotIndex}
                type="button"
                onClick={() => setIndex(dotIndex)}
                aria-label={`Go to slide ${dotIndex + 1}`}
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
