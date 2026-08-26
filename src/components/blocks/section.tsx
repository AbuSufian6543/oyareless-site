import type { ReactNode } from "react";

import type { BlockSettings } from "@/lib/blocks";
import { cn } from "@/lib/utils";

const BACKGROUNDS: Record<string, string> = {
  white: "bg-white text-navy-900",
  light: "bg-slate-50 text-navy-900",
  dark: "bg-navy-900 text-white",
  navy: "bg-navy-800 text-white",
  gradient:
    "bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 text-white",
  accent: "bg-accent-500 text-navy-950",
  grid: "bg-navy-900 text-white bg-tech-grid",
};

const PADDING: Record<string, string> = {
  none: "py-0",
  sm: "py-8 lg:py-10",
  md: "py-12 lg:py-16",
  lg: "py-16 lg:py-24",
  xl: "py-24 lg:py-32",
};

const WIDTHS: Record<string, string> = {
  narrow: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-[86rem]",
  full: "max-w-none",
};

const ALIGN: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function isDarkBackground(settings?: BlockSettings): boolean {
  const background = settings?.background ?? "white";
  return (
    background === "dark" ||
    background === "navy" ||
    background === "gradient" ||
    background === "grid"
  );
}

/**
 * Applies the per-block presentation settings chosen in the admin editor.
 */
export function Section({
  settings,
  children,
  className,
  defaultBackground,
  defaultPadding,
}: {
  settings?: BlockSettings;
  children: ReactNode;
  className?: string;
  defaultBackground?: string;
  defaultPadding?: string;
}) {
  const background = settings?.background ?? defaultBackground ?? "white";
  const paddingY = settings?.paddingY ?? defaultPadding ?? "lg";
  const width = settings?.width ?? "default";
  const align = settings?.align ?? "left";

  return (
    <section
      id={settings?.anchor || undefined}
      className={cn(
        "relative",
        BACKGROUNDS[background] ?? BACKGROUNDS.white,
        PADDING[paddingY] ?? PADDING.lg,
        className,
      )}
      style={
        settings?.anchor
          ? { scrollMarginTop: "6rem" }
          : undefined
      }
    >
      <div className="container-page">
        <div className={cn("mx-auto", WIDTHS[width] ?? WIDTHS.default, ALIGN[align])}>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Shared eyebrow + heading + description cluster used across blocks. */
export function SectionHeading({
  eyebrow,
  heading,
  description,
  dark = false,
  align = "left",
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  heading?: string;
  description?: string;
  dark?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  if (!eyebrow && !heading && !description) return null;

  return (
    <div
      className={cn(
        "mb-10",
        align === "center" && "mx-auto max-w-3xl text-center",
        align === "right" && "text-right",
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            "mb-3 text-xs font-bold uppercase tracking-[0.14em]",
            dark ? "text-accent-400" : "text-brand-600",
          )}
        >
          {eyebrow}
        </p>
      )}
      {heading && (
        <Tag
          className={cn(
            "text-balance-tight text-3xl leading-tight lg:text-[2.5rem]",
            dark ? "text-white" : "text-navy-900",
          )}
        >
          {heading}
        </Tag>
      )}
      {description && (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed",
            dark ? "text-navy-200" : "text-slate-600",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
