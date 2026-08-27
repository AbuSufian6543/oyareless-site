import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Renders section photography.
 *
 * Images built by `scripts/build-site-images.mjs` already exist as AVIF and
 * WebP at three widths, so those are served through a plain `<picture>`: the
 * browser negotiates the format, no server-side optimization runs, and the
 * files are cacheable static assets.
 *
 * Anything else — most importantly images an admin uploads or pastes through
 * the media library — falls through to `next/image`.
 */

const WIDTHS = [560, 900, 1400] as const;

/** e.g. /images/server-rack-1400.webp → "server-rack" */
const BUILT_PATTERN = /^\/images\/([a-z0-9-]+)-(?:560|900|1400)\.(?:avif|webp)$/;

function builtName(src: string): string | null {
  return BUILT_PATTERN.exec(src)?.[1] ?? null;
}

function srcSet(name: string, extension: "avif" | "webp"): string {
  return WIDTHS.map(
    (width) => `/images/${name}-${width}.${extension} ${width}w`,
  ).join(", ");
}

export function SectionImage({
  src,
  alt,
  className,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  width = 1400,
  height = 875,
  fill = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  fill?: boolean;
}) {
  if (!src) return null;

  const name = builtName(src);

  if (!name) {
    const remote = /^https?:\/\//i.test(src);
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={remote}
          className={cn("object-cover", className)}
        />
      );
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        unoptimized={remote}
        className={className}
      />
    );
  }

  return (
    <picture className={fill ? "absolute inset-0 block size-full" : undefined}>
      <source type="image/avif" srcSet={srcSet(name, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(name, "webp")} sizes={sizes} />
      {/* Pre-optimized static derivatives; the optimizer would only re-encode
          what the build already produced. */}
      <img
        src={`/images/${name}-900.webp`}
        alt={alt}
        width={fill ? undefined : 1400}
        height={fill ? undefined : 875}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={cn(fill && "size-full object-cover", className)}
      />
    </picture>
  );
}
