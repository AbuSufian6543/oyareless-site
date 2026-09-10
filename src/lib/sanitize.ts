import sanitizeHtml from "sanitize-html";

/**
 * Rich-text blocks are authored by signed-in staff, but sanitising still
 * matters: it contains the blast radius if an editor account is compromised
 * and stops malformed markup from breaking the layout.
 *
 * Uses a Node HTML parser rather than a browser DOM so public pages do not
 * stall (or crash) while a document implementation boots.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "sub", "sup",
      "ul", "ol", "li",
      "h2", "h3", "h4", "h5", "h6",
      "a", "blockquote", "code", "pre", "hr",
      "table", "thead", "tbody", "tr", "th", "td",
      "span", "div", "img", "figure", "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height", "class"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    allowedSchemesAppliedToAttributes: ["href", "src"],
  });
}

/**
 * The "Custom embed" block intentionally allows iframes so admins can paste
 * stream players, maps, and dashboards. Scripts stay blocked, and only
 * known media/map hosts may be framed.
 */
const EMBED_HOST_ALLOWLIST = [
  "youtube.com",
  "youtube-nocookie.com",
  "youtu.be",
  "player.vimeo.com",
  "vimeo.com",
  "player.twitch.tv",
  "twitch.tv",
  "facebook.com",
  "dailymotion.com",
  "google.com",
  "openstreetmap.org",
  "windy.com",
  "speedtest.net",
  "wirelesscom.ca",
  "wirelesscom.org",
];

export function sanitizeEmbed(html: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: [
      "iframe", "video", "source", "div", "p", "a", "span", "br", "img", "figure", "figcaption",
    ],
    allowedAttributes: {
      iframe: [
        "src", "srcdoc", "width", "height", "frameborder", "allow", "allowfullscreen",
        "title", "loading", "referrerpolicy", "class", "style",
      ],
      video: ["src", "width", "height", "controls", "autoplay", "muted", "loop", "playsinline", "poster", "class"],
      source: ["src", "type"],
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "width", "height", "class"],
      "*": ["class", "style"],
    },
    allowedSchemes: ["http", "https"],
    allowProtocolRelative: false,
    allowedSchemesAppliedToAttributes: ["href", "src"],
    disallowedTagsMode: "discard",
  });

  // Drop iframes pointing at hosts outside the allowlist.
  return clean.replace(
    /<iframe\b[^>]*\bsrc=["']([^"']+)["'][^>]*>(?:\s*<\/iframe>)?/gi,
    (match, src: string) => (isAllowedEmbedSrc(src) ? match : ""),
  );
}

export function isAllowedEmbedSrc(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const { hostname, protocol } = new URL(src);
    if (protocol !== "https:" && protocol !== "http:") return false;
    return EMBED_HOST_ALLOWLIST.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

export { EMBED_HOST_ALLOWLIST };
