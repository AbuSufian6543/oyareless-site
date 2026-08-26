import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import slugifyLib from "slugify";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function slugify(value: string): string {
  return slugifyLib(value, { lower: true, strict: true, trim: true });
}

export function formatDate(
  value: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", options).format(date);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  return formatDate(value, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

/** Digits-only phone for `tel:` links. */
export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

export function truncate(value: string, length = 160): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1).trimEnd()}…`;
}

/** Strips tags so HTML block content can be reused as a meta description. */
export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Converts a YouTube/Vimeo share URL into its embeddable form. Returns the
 * input unchanged when it is already an embed URL.
 */
export function toEmbedUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  const youtubeId =
    trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)?.[1] ??
    trimmed.match(/youtube\.com\/shorts\/([\w-]{11})/)?.[1] ??
    trimmed.match(/youtube\.com\/live\/([\w-]{11})/)?.[1];
  if (youtubeId) {
    return `https://www.youtube-nocookie.com/embed/${youtubeId}`;
  }

  const vimeoId = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }

  return trimmed;
}

export function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

export function readingMinutes(text: string): number {
  const words = stripHtml(text).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function absoluteUrl(path: string, base: string): string {
  if (isExternalHref(path)) return path;
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
