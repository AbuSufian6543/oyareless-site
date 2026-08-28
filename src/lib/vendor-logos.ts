/**
 * Shipped vendor marks under public/brand/logos. Extensions follow the files
 * we actually have — some vendors only publish a PNG or WebP lockup.
 */
export const VENDOR_LOGO_EXT: Record<string, "svg" | "png"> = {
  cisco: "png",
  unifi: "png",
  mikrotik: "png",
  fortinet: "svg",
  barracuda: "svg",
  microsoft: "svg",
  "microsoft-365": "svg",
  azure: "png",
  aws: "png",
  "google-cloud": "png",
  cloudflare: "png",
  paradox: "png",
  grandstream: "png",
  hytera: "svg",
  fanvil: "png",
  juniper: "png",
  genetec: "png",
  tait: "png",
  rogers: "png",
};

export function vendorLogoUrl(slug: string): string {
  return `/brand/logos/${slug}.${VENDOR_LOGO_EXT[slug] ?? "svg"}`;
}
