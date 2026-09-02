import { stat } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import { catalogServicePictures } from "@/lib/service-photos";
import { vendorLogoUrl } from "@/lib/vendor-logos";

/**
 * Photographs and marks that ship with the site. They live under `public/`
 * until an admin replaces them; then they move to the uploads volume so the
 * change survives the next Docker rebuild.
 */

export type SitePicture = {
  url: string;
  name: string;
  alt: string;
  folder: string;
};

export const SITE_PICTURES: SitePicture[] = [
  photo("office", "Sault Ste. Marie office", "The WirelessCom.Ca Inc. office at 97 White Oak Drive East in Sault Ste. Marie, photographed at dusk"),
  ...catalogServicePictures(),
  photo("server-rack", "IT services — server rack", "Row of rack-mounted enterprise servers in a dark data center aisle lit by blue status indicators"),
  photo("wifi", "Wi-Fi access point", "White enterprise Wi-Fi access point mounted on a dark office ceiling with a blue status ring"),
  photo("surveillance", "Security cameras", "Dome and bullet security cameras mounted under the soffit of a modern commercial building at dusk"),
  photo("cybersecurity", "Cybersecurity", "Abstract shield formed from connected cyan nodes and lines over a dark navy grid"),
  photo("voip", "VoIP desk phone", "Black executive VoIP desk phone with a color display on a dark office desk"),
  photo("two-way-radio", "Two-way radios", "Three rugged professional handheld two-way radios on a dark surface with blue rim lighting"),
  photo("remote-support", "Remote support", "Support technician wearing a headset at a desk with two monitors showing dashboards, seen from behind"),
  photo("cabling-install", "Structured cabling", "Technician's hands terminating blue and white network cables into a rack-mounted patch panel"),
  photo("cabling", "Network cabling", "Dense bundles of blue and gray network patch cables terminated into a switch"),
  photo("firewall", "Firewalls", "Rack-mounted next-generation firewall appliances in a dark cabinet with cyan status lights and dressed ethernet"),
  photo("ai-camera", "AI camera analytics", "IP dome camera in the foreground with a security monitor showing cyan AI detection overlays on a night-time scene"),
  photo("ai-phone", "AI phone attendant", "Black executive VoIP desk phone whose display shows an abstract cyan assistant waveform"),
  photo("access-control", "Access control", "Slim black card reader with a cyan LED beside a glass commercial entrance at dusk"),
  photo("alarm-system", "Alarm systems", "Commercial alarm keypad and control panel on a dark corridor wall with a cyan status LED"),
  photo("door-intercom", "Door intercom", "Video door intercom station on a dark wall beside a glass commercial entrance at dusk"),
  photo("panic-button", "Panic buttons", "Red wall-mounted panic button under a clear cover in a quiet commercial corridor"),
  photo("video-broadcast", "Video broadcast", "Professional video cameras on tripods in a dark studio with cyan rim lighting"),
  photo("ev-charging", "EV charging", "Wall-mounted Level 2 EV charging station with a cyan status light on a dark commercial wall"),
  photo("fleet-tracking", "Fleet tracking", "GPS tracker unit in the foreground with a commercial pickup truck in a dusk lot behind"),
  photo("digital-signage", "Digital signage", "Large digital signage display in a dark modern lobby showing an abstract navy and cyan graphic"),
  photo("web-development", "Web development", "Ultrawide monitor on a dark desk showing a navy and cyan business website layout"),
  photo("networking", "Networking", "Dense bundles of blue and gray network patch cables terminated into a switch"),
  logo("cisco", "Cisco"),
  logo("unifi", "UniFi"),
  logo("mikrotik", "MikroTik"),
  logo("fortinet", "Fortinet"),
  logo("barracuda", "Barracuda"),
  logo("microsoft", "Microsoft"),
  logo("microsoft-365", "Microsoft 365"),
  logo("azure", "Azure"),
  logo("aws", "Amazon Web Services"),
  logo("google-cloud", "Google Cloud"),
  logo("cloudflare", "Cloudflare"),
  logo("paradox", "Paradox"),
  logo("grandstream", "Grandstream"),
  logo("hytera", "Hytera"),
  logo("surecall", "SureCall"),
  logo("fanvil", "Fanvil"),
  logo("juniper", "Juniper"),
  logo("genetec", "Genetec"),
  logo("tait", "Tait Communications"),
  logo("rogers", "Rogers"),
  {
    url: "/brand/logo.png",
    name: "Primary logo",
    alt: "WirelessCom.Ca Inc. logo",
    folder: "branding",
  },
  {
    url: "/brand/logo-inverse.png",
    name: "Inverse logo",
    alt: "WirelessCom.Ca Inc. logo on dark",
    folder: "branding",
  },
  {
    url: "/brand/logo-mark.png",
    name: "Logo mark",
    alt: "WirelessCom.Ca Inc. mark",
    folder: "branding",
  },
  {
    url: "/brand/og-default.png",
    name: "Social share image",
    alt: "WirelessCom.Ca Inc. social card",
    folder: "branding",
  },
  {
    url: "/favicon.svg",
    name: "Favicon",
    alt: "WirelessCom.Ca 3D globe mark",
    folder: "branding",
  },
  {
    url: "/favicon.png",
    name: "Favicon (PNG)",
    alt: "WirelessCom.Ca 3D globe mark",
    folder: "branding",
  },
  {
    url: "/icon.png",
    name: "App icon",
    alt: "WirelessCom.Ca 3D globe mark",
    folder: "branding",
  },
  {
    url: "/apple-icon.png",
    name: "Apple touch icon",
    alt: "WirelessCom.Ca 3D globe mark",
    folder: "branding",
  },
];

function photo(stem: string, name: string, alt: string): SitePicture {
  return {
    url: `/images/${stem}-1400.webp`,
    name,
    alt,
    folder: "site",
  };
}

function logo(slug: string, name: string): SitePicture {
  return {
    url: vendorLogoUrl(slug),
    name: `${name} logo`,
    alt: name,
    folder: "logos",
  };
}

export function isCataloguedFilename(filename: string): boolean {
  return filename.startsWith("site:");
}

export function catalogFilename(url: string): string {
  return `site:${url}`;
}

function mimeFor(url: string): string {
  if (url.endsWith(".svg")) return "image/svg+xml";
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".jpg") || url.endsWith(".jpeg")) return "image/jpeg";
  if (url.endsWith(".avif")) return "image/avif";
  return "image/webp";
}

/**
 * Registers shipped photographs in the media library so an admin can replace
 * them without hunting through page blocks. Create-only: existing rows and
 * files an admin has already migrated to /uploads are left alone.
 */
export async function ensureSiteMedia(): Promise<number> {
  const existing = await prisma.mediaAsset.findMany({
    select: { url: true, filename: true },
  });
  const present = new Set(existing.flatMap((row) => [row.url, row.filename]));

  let created = 0;
  const publicRoot = path.join(process.cwd(), "public");

  for (const picture of SITE_PICTURES) {
    const filename = catalogFilename(picture.url);
    if (present.has(picture.url) || present.has(filename)) continue;

    const diskPath = path.join(publicRoot, picture.url.replace(/^\//, ""));
    const info = await stat(diskPath).catch(() => null);
    if (!info?.isFile()) continue;

    await prisma.mediaAsset.create({
      data: {
        filename,
        originalName: picture.name,
        mimeType: mimeFor(picture.url),
        sizeBytes: info.size,
        width: null,
        height: null,
        url: picture.url,
        altText: picture.alt,
        folder: picture.folder,
      },
    });
    created += 1;
  }

  return created;
}
