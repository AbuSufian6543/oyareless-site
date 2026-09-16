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

export const MOBILE_TRAILER_PROOF = [
  {
    title: "Deter crime. Protect assets.",
    detail: "Peace of mind on sites that cannot take a permanent camera install.",
  },
  {
    title: "Clean, solar-powered operation",
    detail: "Silent 1000W array with MPPT charging for year-round autonomy.",
  },
  {
    title: "Built to your specifications",
    detail: "Cameras, storage, communications, and alarms selected for the job.",
  },
  {
    title: "A partner you can trust",
    detail: "Specified, deployed, and supported by WirelessCom.Ca.",
  },
] as const;

export const MOBILE_TRAILER_BUILD_OPTIONS = [
  "Camera types and count",
  "LPR, AI, and time-lapse options",
  "Recording capacity",
  "Satellite and remote management",
  "Audio, siren, and alarm packages",
] as const;

/** Default CMS block payload. Admins edit a copy of this on the Pages screen. */
export function defaultMobileTrailerBlockData() {
  return {
    eyebrow: "WirelessCom.Ca Inc.",
    headline: MOBILE_TRAILER_META.title,
    kicker: "Fully Autonomous Surveillance System",
    subheadline:
      "Fully autonomous surveillance. Anywhere you need it. Custom built to your specifications — deploy, power, walk away.",
    heroImageUrl: MOBILE_TRAILER_IMAGES.hero,
    heroImageAlt:
      "WirelessCom.Ca Mobile Security Trailer with a 30-foot camera tower and solar array on a worksite at sunset",
    callouts: MOBILE_TRAILER_CALLOUTS.map((item) => ({ ...item })),
    quoteLabel: "Request a quote",
    quoteHref: "/request-quote?interest=trailer",
    customLabel: "Custom build your system",
    customHref: "#custom-build",
    flyerUrl: "",
    flyerLinkLabel: "Download the flyer",
    stripText: "Deploy · Power · Walk away",
    introEyebrow: "Built for remote security",
    introHeading: "Protect the site even when there is no power and no network.",
    introParagraphs: [
      "Protect construction sites, equipment, parking facilities, remote locations, and critical assets without permanent power or communications infrastructure.",
      "The WirelessCom.Ca Mobile Security Trailer is a rapidly deployable, solar-powered surveillance platform custom built to meet your security and monitoring requirements.",
      "With a 30-foot camera tower, satellite communications, solar power, local video storage, and remote system management, it can provide 24/7/365 surveillance where conventional security infrastructure is difficult or impractical to install.",
    ],
    platformHeading: "One compact towable platform",
    platformItems: [
      "Surveillance, recording, and alarms",
      "Satellite communications",
      "Solar power with MPPT charging",
      "On-board video storage",
      "Towable by most vehicles",
    ],
    proof: MOBILE_TRAILER_PROOF.map((item) => ({
      label: item.title,
      detail: item.detail,
    })),
    pillarsHeading: "Surveillance, communications, and power in one trailer.",
    pillarsDescription:
      "Specify the cameras, recording, uplink, and alarms around the job — then move the same platform when the site moves.",
    pillars: MOBILE_TRAILER_PILLARS.map((pillar) => ({
      title: pillar.title,
      items: [...pillar.items],
    })),
    towerEyebrow: "30-foot mobile surveillance tower",
    towerHeading: "See more. Cover more.",
    towerBody:
      "The integrated 30-foot tower rotates nearly 360°, so cameras and specialized equipment can be aimed for each deployment. Because the system is mobile, coverage can move as the project, property, or security requirement changes.",
    towerBadge: "30 ft tower · nearly 360°",
    towerStrip: "Fix · Power · Walk away",
    towerImageUrl: MOBILE_TRAILER_IMAGES.hero,
    towerImageAlt:
      "Extended 30-foot camera mast on a WirelessCom.Ca mobile security trailer",
    pipelineHeading: "Camera to recording to satellite to the people watching.",
    pipelineDescription:
      "Video is captured and stored on the trailer. Satellite carries the management path when the site has no usable internet. Staff can configure and review the system without standing next to it.",
    pipeline: MOBILE_TRAILER_PIPELINE.map((step) => ({
      label: step.title,
      detail: step.detail,
    })),
    applicationsHeading: "One platform. Multiple applications.",
    applicationsDescription:
      "The same trailer covers a job site this month and a yard, lot, or temporary entrance the next.",
    applications: MOBILE_TRAILER_APPLICATIONS.map((item) => ({
      title: item.title,
      description: item.description,
      imageUrl: item.image,
      imageAlt: item.imageAlt,
    })),
    customEyebrow: "Custom built to your specifications",
    customHeading: "Your site is different. The security system should be too.",
    customBody:
      "WirelessCom.Ca configures each Mobile Security Trailer around the operational requirement. Components are selected for the application — not sold as a single locked package.",
    customOptions: [...MOBILE_TRAILER_BUILD_OPTIONS],
    customTraits: ["Flexible", "Scalable", "Reliable"],
    customCardHeading: "Tell us the site and the job.",
    customCardBody:
      "Construction coverage, a parking facility, LPR at a gate, or a remote yard with no power — we will specify the trailer around that, then quote it.",
    customQuoteLabel: "Custom build your system",
    customQuoteHref: "/request-quote?interest=trailer&intent=custom",
    flyerHeading: "Product flyer",
    flyerDescription:
      "The current product letter: cameras, power, communications, and how we deploy. Download it to share with your team.",
    flyerButtonLabel: "Download flyer",
    ctaHeading: "Ready to put a trailer on site?",
    ctaBody:
      "Request a quote or call the office. We will ask where it needs to work, what it needs to see, and how long it stays.",
    ctaSecondaryLabel: "Security systems",
    ctaSecondaryHref: "/security-services",
  };
}

export type MobileTrailerContent = ReturnType<typeof defaultMobileTrailerBlockData>;
