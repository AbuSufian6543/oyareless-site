import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { isExternalHref } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "onDark"
  | "ghost"
  | "accent"
  | "danger";

const STYLE_TO_VARIANT: Record<string, ButtonVariant> = {
  primary: "primary",
  secondary: "secondary",
  ghost: "ghost",
  outline: "outline",
  onDark: "onDark",
  accent: "accent",
  danger: "danger",
};

/** Map a CMS button style onto a dark or light surface so labels stay readable. */
export function buttonVariantOnSurface(
  style: string | undefined,
  dark: boolean,
): ButtonVariant {
  const key = style || "primary";
  if (dark) {
    if (key === "outline" || key === "ghost") return "onDark";
    if (key === "primary") return "accent";
  }
  return STYLE_TO_VARIANT[key] ?? "primary";
}

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 disabled:opacity-55 disabled:pointer-events-none whitespace-nowrap";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md active:translate-y-px",
  secondary:
    "bg-navy-800 text-white hover:bg-navy-900 shadow-sm hover:shadow-md active:translate-y-px",
  accent:
    "bg-accent-500 text-navy-950 hover:bg-accent-400 shadow-glow hover:shadow-md active:translate-y-px",
  outline:
    "border-2 border-navy-200 text-navy-800 hover:border-brand-600 hover:text-brand-700 hover:bg-navy-50 active:translate-y-px",
  onDark:
    "border-2 border-white/35 text-white hover:border-white hover:bg-white/10 active:translate-y-px",
  ghost: "text-navy-700 hover:bg-navy-50 active:translate-y-px",
  danger:
    "bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow-md active:translate-y-px",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "text-sm px-3.5 py-2",
  md: "text-[0.9375rem] px-5 py-2.5",
  lg: "text-base px-6 py-3.5",
};

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button className={buttonClasses(variant, size, className)} {...props} />
  );
}

/** Renders a `next/link` for internal hrefs and a plain anchor otherwise. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  openInNewTab = false,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  openInNewTab?: boolean;
  children: ReactNode;
}) {
  const classes = buttonClasses(variant, size, className);

  if (isExternalHref(href) || openInNewTab) {
    return (
      <a
        href={href}
        className={classes}
        {...(openInNewTab
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
