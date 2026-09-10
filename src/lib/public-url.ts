/**
 * Canonical public origin for links we send off-site (email, sitemap, OG).
 *
 * Production always uses https://wirelesscom.ca. That stops notification and
 * password-reset mail from leaking the server IP or following a spoofed Host
 * header, even if NEXT_PUBLIC_SITE_URL still contains one.
 */

export const CANONICAL_PUBLIC_HOST = "wirelesscom.ca";
export const CANONICAL_PUBLIC_ORIGIN = `https://${CANONICAL_PUBLIC_HOST}`;

const LOCAL_DEV_ORIGIN = "http://localhost:3000";

export function isIpHostname(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (!host) return false;
  if (host.includes(":")) return true;
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host);
}

export function isLoopbackHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  return (
    host === "localhost" ||
    host === "localhost.localdomain" ||
    host === "ip6-localhost" ||
    host === "::1" ||
    host === "0:0:0:0:0:0:0:1" ||
    host === "127.0.0.1"
  );
}

export function isCanonicalPublicHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase().replace(/\.$/, "");
  return host === CANONICAL_PUBLIC_HOST || host === `www.${CANONICAL_PUBLIC_HOST}`;
}

function tryParseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.username = "";
    url.password = "";
    return url;
  } catch {
    return null;
  }
}

/**
 * Origin used in email, robots, sitemap, and metadata.
 * Production: always https://wirelesscom.ca.
 * Development: only loopback is kept; IPs and unknown hosts become the company HTTPS origin.
 */
export function resolvePublicOrigin(
  raw?: string | null,
  nodeEnv: string = process.env.NODE_ENV ?? "development",
): string {
  if (nodeEnv === "production") return CANONICAL_PUBLIC_ORIGIN;

  const trimmed = (raw ?? "").trim().replace(/\/$/, "");
  if (!trimmed) return LOCAL_DEV_ORIGIN;

  const parsed = tryParseHttpUrl(trimmed);
  if (parsed && isLoopbackHost(parsed.hostname)) {
    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, "");
  }

  return CANONICAL_PUBLIC_ORIGIN;
}

function hasControlChars(value: string): boolean {
  return /[\u0000-\u001F\u007F\\]/.test(value);
}

/** Path + query + hash only. Protocol-relative and foreign URLs become `/`. */
export function sanitizeAppPath(pathOrUrl: string): string {
  const trimmed = pathOrUrl.trim();
  if (!trimmed || hasControlChars(trimmed)) return "/";

  const absolute = tryParseHttpUrl(trimmed);
  if (absolute) {
    if (
      isCanonicalPublicHost(absolute.hostname) ||
      isLoopbackHost(absolute.hostname) ||
      isIpHostname(absolute.hostname)
    ) {
      return `${absolute.pathname}${absolute.search}${absolute.hash}` || "/";
    }
    return "/";
  }

  if (trimmed.startsWith("//") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return "/";
  }

  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  try {
    const resolved = new URL(withSlash, `${CANONICAL_PUBLIC_ORIGIN}/`);
    if (!isCanonicalPublicHost(resolved.hostname)) return "/";
    return `${resolved.pathname}${resolved.search}${resolved.hash}` || "/";
  } catch {
    return "/";
  }
}

export function joinOriginAndPath(origin: string, pathOrUrl = "/"): string {
  const base = origin.replace(/\/$/, "");
  const path = sanitizeAppPath(pathOrUrl);
  if (path === "/") return base;
  return `${base}${path}`;
}

export function publicOrigin(): string {
  return resolvePublicOrigin(process.env.NEXT_PUBLIC_SITE_URL);
}

/** Safe absolute https://wirelesscom.ca (or localhost in `next dev`) link. */
export function publicUrl(pathOrUrl = "/"): string {
  return joinOriginAndPath(publicOrigin(), pathOrUrl);
}

export function publicHostLabel(): string {
  try {
    return new URL(publicOrigin()).hostname;
  } catch {
    return CANONICAL_PUBLIC_HOST;
  }
}

function decodeHtmlAttr(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function sanitizeEmailHref(raw: string): string {
  const value = raw.trim();
  const lower = value.toLowerCase();
  if (lower.startsWith("mailto:") || lower.startsWith("tel:")) {
    if (hasControlChars(value) || /javascript:/i.test(value)) {
      return publicUrl("/");
    }
    return value;
  }
  return publicUrl(value);
}

/** Last-line filter so a missed template cannot put an IP or foreign host in mail. */
export function sanitizeEmailHtml(html: string): string {
  return html.replace(
    /\b(href|src)\s*=\s*(["'])([\s\S]*?)\2/gi,
    (_full, attr: string, quote: string, value: string) => {
      const href = sanitizeEmailHref(decodeHtmlAttr(value));
      return `${attr}=${quote}${escapeHtmlAttr(href)}${quote}`;
    },
  );
}

export function emailHtmlContainsForbiddenOrigin(html: string): boolean {
  const pattern = /\b(?:href|src)\s*=\s*(["'])([\s\S]*?)\1/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    const decoded = decodeHtmlAttr(match[2] ?? "");
    const lower = decoded.toLowerCase();
    if (lower.startsWith("mailto:") || lower.startsWith("tel:")) continue;
    const parsed = tryParseHttpUrl(decoded);
    if (!parsed) return true;
    if (isIpHostname(parsed.hostname)) return true;
    if (!isCanonicalPublicHost(parsed.hostname) && !isLoopbackHost(parsed.hostname)) {
      return true;
    }
    if (parsed.protocol !== "https:" && !isLoopbackHost(parsed.hostname)) return true;
  }
  return false;
}
