"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { SlideshowItem } from "@/lib/slideshow";
import { cn, toEmbedUrl } from "@/lib/utils";

const PHOTO_INTERVAL_MS = 5500;
const DOT_LIMIT = 8;

/**
 * Auto-advancing mixed photo/video carousel. Photos rotate on a timer; a
 * video slide stays until the visitor moves on so a promo is not cut off.
 *
 * `hero` sits in the split-hero picture column. `page` is the fallback band
 * used when a page has slides but no split hero to host them.
 */
export function MediaSlideshow({
  items,
  label = "Photos and promo videos",
  variant = "page",
}: {
  items: SlideshowItem[];
  label?: string;
  variant?: "page" | "hero";
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const inHero = variant === "hero";

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

  const useDots = items.length <= DOT_LIMIT;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl",
        inHero
          ? "bg-white shadow-lift ring-1 ring-white/15"
          : "bg-white",
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className={cn("relative", inHero ? "aspect-[16/10]" : "aspect-[16/9]")}>
        {items.map((item, itemIndex) => {
          const active = itemIndex === index;
          return (
            <div
              key={`${item.kind}-${item.url}-${itemIndex}`}
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
                    sizes={
                      inHero
                        ? "(min-width: 1024px) 42vw, 100vw"
                        : "(max-width: 1024px) 100vw, 70vw"
                    }
                    className="bg-white object-contain p-3 sm:p-4"
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
                <div className="size-full bg-white" />
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
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full text-white backdrop-blur transition-colors",
              inHero
                ? "left-2 bg-navy-950/75 p-1.5 ring-1 ring-white/15 hover:bg-navy-950/90"
                : "left-3 bg-navy-950/60 p-2.5 hover:bg-navy-950/85",
            )}
          >
            <ChevronLeft className={inHero ? "size-4" : "size-5"} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full text-white backdrop-blur transition-colors",
              inHero
                ? "right-2 bg-navy-950/75 p-1.5 ring-1 ring-white/15 hover:bg-navy-950/90"
                : "right-3 bg-navy-950/60 p-2.5 hover:bg-navy-950/85",
            )}
          >
            <ChevronRight className={inHero ? "size-4" : "size-5"} aria-hidden="true" />
          </button>

          {useDots ? (
            <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
              {items.map((_, dotIndex) => (
                <button
                  key={dotIndex}
                  type="button"
                  onClick={() => setIndex(dotIndex)}
                  aria-label={`Go to slide ${dotIndex + 1}`}
                  aria-current={dotIndex === index ? true : undefined}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    dotIndex === index
                      ? "w-6 bg-accent-400"
                      : "w-1.5 bg-navy-900/35 hover:bg-navy-900/60",
                  )}
                />
              ))}
            </div>
          ) : (
            <p className="absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-navy-950/70 px-2.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-white backdrop-blur">
              {index + 1} / {items.length}
            </p>
          )}
        </>
      )}
    </div>
  );
}
