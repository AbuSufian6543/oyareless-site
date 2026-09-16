/**
 * Mobile Security Trailer landing page. Copy and public file paths live here
 * so the dedicated route, admin flyer field, and checks stay in lockstep.
 */

export const MOBILE_TRAILER_PATH = "/mobile-security-trailer";

export const DEFAULT_MOBILE_TRAILER_FLYER_URL =
  "/docs/mobile-security-trailer-flyer.jpg";

export const MOBILE_TRAILER_IMAGES = {
  hero: "/images/services/mobile-security-trailer/hero.webp",
  construction: "/images/services/mobile-security-trailer/construction.webp",
  parking: "/images/services/mobile-security-trailer/parking.webp",
  lpr: "/images/services/mobile-security-trailer/lpr.webp",
  remote: "/images/services/mobile-security-trailer/remote.webp",
} as const;

export const MOBILE_TRAILER_META = {
  title: "Mobile Security Trailer",
  metaTitle: "Mobile Security Trailer in Sault Ste. Marie",
  description:
    "Solar-powered Mobile Security Trailer with a 30-foot camera tower, satellite communications, and 24/7/365 autonomous surveillance for construction sites, parking lots, and remote locations in Northern Ontario.",
};

export function resolveTrailerFlyerUrl(raw: string | undefined): string {
  const trimmed = raw?.trim();
  return trimmed || DEFAULT_MOBILE_TRAILER_FLYER_URL;
}

export function trailerFlyerIsPdf(url: string): boolean {
  return /\.pdf(?:$|\?)/i.test(url);
}

export function trailerFlyerDownloadName(url: string): string {
  return trailerFlyerIsPdf(url)
    ? "WirelessCom-Mobile-Security-Trailer-Flyer.pdf"
    : "WirelessCom-Mobile-Security-Trailer-Flyer.jpg";
}

export const MOBILE_TRAILER_CALLOUTS = [
  { label: "30 ft tower", detail: "Rotates nearly 360°" },
  { label: "1000W solar", detail: "Year-round autonomy" },
  { label: "Satellite comms", detail: "No site network required" },
  { label: "24/7/365", detail: "Always watching" },
] as const;

export const MOBILE_TRAILER_PILLARS = [
  {
    title: "Surveillance",
    items: [
      "Up to 3 WCCTV pole cameras",
      "Full 4K HD video",
      "LPR / licence plate recognition options",
      "AI-enabled camera options",
      "Time-lapse video",
      "Audio and siren alarms",
      "Up to 16 TB HDD / SSD storage",
    ],
  },
  {
    title: "Communications & remote management",
    items: [
      "Integrated satellite communications",
      "Full remote configuration",
      "Remote diagnostics and system management",
      "Designed for sites with little supporting infrastructure",
    ],
  },
  {
    title: "Power & deployment",
    items: [
      "1000W solar array",
      "Latest MPPT charge-controller technology",
      "Silent operation",
      "Designed for 24/7/365 year-round autonomy",
      "Installed and operational in minutes",
      "Compact, easy to transport, and towable by most vehicles",
      "Relocate as the site requirements change",
    ],
  },
] as const;

export const MOBILE_TRAILER_APPLICATIONS = [
  {
    title: "Construction sites",
    description:
      "Help deter theft, vandalism, and unauthorized access while monitoring equipment, materials, and site activity.",
    image: MOBILE_TRAILER_IMAGES.construction,
    imageAlt:
      "Active construction site with cranes and a steel frame that a mobile security trailer can watch",
  },
  {
    title: "Parking lots & assets",
    description:
      "Monitor vehicles, equipment, storage areas, yards, and other valuable assets from one towable platform.",
    image: MOBILE_TRAILER_IMAGES.parking,
    imageAlt: "Outdoor parking lot filled with vehicles viewed from a security-camera angle",
  },
  {
    title: "LPR & traffic monitoring",
    description:
      "Add licence plate recognition and specialized cameras for vehicle identification, entrances, exits, and traffic-monitoring work.",
    image: MOBILE_TRAILER_IMAGES.lpr,
    imageAlt: "Highway traffic photographed from an elevated roadside camera angle",
  },
  {
    title: "Remote & temporary sites",
    description:
      "Deploy surveillance where conventional power and communications infrastructure may not be readily available.",
    image: MOBILE_TRAILER_IMAGES.remote,
    imageAlt: "Quiet remote worksite at dusk with floodlights and an empty paved lot",
  },
] as const;

export const MOBILE_TRAILER_PIPELINE = [
  {
    title: "Cameras",
    detail: "Up to three 4K pole cameras, with LPR and AI options.",
  },
  {
    title: "Recording",
    detail: "On-trailer storage up to 16 TB. The video stays with the system.",
  },
  {
    title: "Satellite",
    detail: "Uplink when the site has no usable internet of its own.",
  },
  {
    title: "Remote monitoring",
    detail: "Configure, diagnose, and review the system from off-site.",
  },
] as const;
