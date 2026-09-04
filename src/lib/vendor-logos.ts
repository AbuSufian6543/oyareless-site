/**
 * Shipped vendor marks under public/brand/logos. Extensions follow the files
 * we actually have — some vendors only publish a PNG or WebP lockup.
 */
export const VENDOR_LOGO_EXT: Record<string, "svg" | "png" | "webp"> = {
  cisco: "png",
  unifi: "png",
  mikrotik: "png",
  fortinet: "png",
  barracuda: "png",
  microsoft: "svg",
  "microsoft-365": "svg",
  azure: "png",
  aws: "png",
  "google-cloud": "png",
  cloudflare: "png",
  paradox: "png",
  grandstream: "png",
  hytera: "png",
  surecall: "png",
  fanvil: "png",
  juniper: "png",
  genetec: "png",
  tait: "png",
  rogers: "png",
  sonicwall: "webp",
  watchguard: "webp",
  "palo-alto": "webp",
  sophos: "webp",
  butterflymx: "webp",
  fs: "webp",
  oracle: "webp",
  uniview: "webp",
  schlage: "webp",
  shure: "webp",
  cdvi: "webp",
};

export function vendorLogoUrl(slug: string): string {
  return `/brand/logos/${slug}.${VENDOR_LOGO_EXT[slug] ?? "svg"}`;
}

/**
 * How the shipped file should sit in a logo tile. Several vendor PNGs are
 * already locked up on black, red, or blue, so they fill the cell instead of
 * sitting on a white plate.
 */
export type VendorPlate = "light" | "dark" | "fill";

export type FooterProduct = {
  slug: keyof typeof VENDOR_LOGO_EXT;
  name: string;
  plate: VendorPlate;
  href: string;
  authorizedDealer?: boolean;
};

/**
 * Every shipped product mark, in the order the footer wall shows them.
 * Grouped by what we actually sell so related chips wrap together. Hytera is
 * the only authorized dealership — it leads the strip; the rest are platforms
 * we deploy.
 */
export const FOOTER_PRODUCTS: FooterProduct[] = [
  {
    slug: "hytera",
    name: "Hytera",
    plate: "dark",
    href: "/two-way-radios",
    authorizedDealer: true,
  },
  {
    slug: "tait",
    name: "Tait Communications",
    plate: "dark",
    href: "/two-way-radios",
  },
  { slug: "unifi", name: "UniFi", plate: "fill", href: "/it-services" },
  { slug: "cisco", name: "Cisco", plate: "light", href: "/it-services" },
  { slug: "mikrotik", name: "MikroTik", plate: "light", href: "/it-services" },
  { slug: "fortinet", name: "Fortinet", plate: "light", href: "/firewalls" },
  { slug: "barracuda", name: "Barracuda", plate: "dark", href: "/firewalls" },
  { slug: "juniper", name: "Juniper", plate: "light", href: "/firewalls" },
  { slug: "sonicwall", name: "SonicWall", plate: "light", href: "/firewalls" },
  { slug: "watchguard", name: "WatchGuard", plate: "light", href: "/firewalls" },
  {
    slug: "palo-alto",
    name: "Palo Alto",
    plate: "light",
    href: "/firewalls",
  },
  { slug: "sophos", name: "Sophos", plate: "light", href: "/firewalls" },
  { slug: "microsoft", name: "Microsoft", plate: "light", href: "/it-services" },
  {
    slug: "microsoft-365",
    name: "Microsoft 365",
    plate: "light",
    href: "/it-services",
  },
  { slug: "azure", name: "Azure", plate: "dark", href: "/it-services" },
  { slug: "aws", name: "AWS", plate: "dark", href: "/it-services" },
  {
    slug: "google-cloud",
    name: "Google Cloud",
    plate: "dark",
    href: "/it-services",
  },
  { slug: "oracle", name: "Oracle", plate: "light", href: "/it-services" },
  { slug: "cloudflare", name: "Cloudflare", plate: "dark", href: "/it-services" },
  { slug: "rogers", name: "Rogers", plate: "fill", href: "/internet-services" },
  { slug: "surecall", name: "SureCall", plate: "dark", href: "/it-services" },
  {
    slug: "grandstream",
    name: "Grandstream",
    plate: "dark",
    href: "/telephone-services",
  },
  { slug: "fanvil", name: "Fanvil", plate: "dark", href: "/telephone-services" },
  { slug: "shure", name: "Shure", plate: "light", href: "/video-services" },
  {
    slug: "fs",
    name: "FS",
    plate: "light",
    href: "/data-cabling-fiber-optic",
  },
  {
    slug: "paradox",
    name: "Paradox",
    plate: "dark",
    href: "/alarm-systems",
  },
  {
    slug: "uniview",
    name: "Uniview",
    plate: "light",
    href: "/security-services",
  },
  {
    slug: "genetec",
    name: "Genetec",
    plate: "light",
    href: "/access-control",
  },
  {
    slug: "cdvi",
    name: "CDVI",
    plate: "light",
    href: "/access-control",
  },
  {
    slug: "butterflymx",
    name: "ButterflyMX",
    plate: "light",
    href: "/access-control",
  },
  {
    slug: "schlage",
    name: "Schlage",
    plate: "light",
    href: "/access-control",
  },
];

