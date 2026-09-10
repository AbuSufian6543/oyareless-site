/**
 * Canonical public menus. Seed, content-sync, and the runtime fallback all
 * read this list so a database blip cannot hide services, tools, or support.
 */

export type DefaultNavChild = {
  label: string;
  href: string;
  openInNewTab?: boolean;
};

export type DefaultNavItem = {
  label: string;
  href: string;
  location: "HEADER" | "FOOTER" | "UTILITY";
  order: number;
  children?: DefaultNavChild[];
};

export type DefaultNavNode = {
  id: string;
  label: string;
  href: string;
  openInNewTab: boolean;
  children: DefaultNavNode[];
};

export const DEFAULT_NAV: DefaultNavItem[] = [
  { label: "Home", href: "/", location: "HEADER", order: 0 },
  {
    label: "Services",
    href: "/it-services",
    location: "HEADER",
    order: 1,
    children: [
      { label: "IT Services", href: "/it-services" },
      { label: "Cybersecurity", href: "/cybersecurity" },
      { label: "Firewalls", href: "/firewalls" },
      { label: "AI cameras & phones", href: "/ai-services" },
      { label: "Security Systems", href: "/security-services" },
      { label: "Alarm Systems", href: "/alarm-systems" },
      { label: "Door Intercom", href: "/door-intercom" },
      { label: "Panic Buttons", href: "/panic-buttons" },
      { label: "Access Control", href: "/access-control" },
      { label: "Telephone (VoIP)", href: "/telephone-services" },
      { label: "Internet Services", href: "/internet-services" },
      { label: "Data Cabling & Fiber", href: "/data-cabling-fiber-optic" },
      { label: "Video & Broadcasting", href: "/video-services" },
      { label: "Two-Way Radios", href: "/two-way-radios" },
      { label: "EV Charging", href: "/ev-charging-solutions" },
      { label: "Fleet Tracking", href: "/fleet-vehicle-tracking" },
      { label: "Digital Marketing", href: "/digital-marketing" },
      { label: "Web Development", href: "/web-development" },
    ],
  },
  {
    label: "Tools",
    href: "/speed-test",
    location: "HEADER",
    order: 2,
    children: [
      { label: "Internet Speed Test", href: "/speed-test" },
      { label: "Network Tools", href: "/network-tools" },
      { label: "Cybersecurity Tools", href: "/cybersecurity-tools" },
      { label: "Network Status", href: "/network-status" },
    ],
  },
  {
    label: "Support",
    href: "/support",
    location: "HEADER",
    order: 3,
    children: [
      { label: "Request Service", href: "/support" },
      { label: "Remote Support", href: "/remote-support" },
      { label: "Knowledge Base", href: "/knowledge-base" },
      { label: "FAQ", href: "/faq" },
      { label: "Customer Portal", href: "/portal" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    label: "Company",
    href: "/contact",
    location: "HEADER",
    order: 4,
    children: [
      { label: "Brands We Support", href: "/brands" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Live Streams", href: "/live" },
      { label: "News", href: "/news" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },

  {
    label: "Services",
    href: "/it-services",
    location: "FOOTER",
    order: 0,
    children: [
      { label: "IT Services", href: "/it-services" },
      { label: "Cybersecurity", href: "/cybersecurity" },
      { label: "Firewalls", href: "/firewalls" },
      { label: "AI cameras & phones", href: "/ai-services" },
      { label: "Security Systems", href: "/security-services" },
      { label: "Alarm Systems", href: "/alarm-systems" },
      { label: "Door Intercom", href: "/door-intercom" },
      { label: "Panic Buttons", href: "/panic-buttons" },
      { label: "Access Control", href: "/access-control" },
      { label: "Telephone (VoIP)", href: "/telephone-services" },
      { label: "Internet Services", href: "/internet-services" },
      { label: "Data Cabling & Fiber", href: "/data-cabling-fiber-optic" },
    ],
  },
  {
    label: "Networking & Radio",
    href: "/it-services",
    location: "FOOTER",
    order: 1,
    children: [
      { label: "Two-Way Radios", href: "/two-way-radios" },
      { label: "Hytera Radios", href: "https://hyteraradios.ca", openInNewTab: true },
      { label: "Video & Broadcasting", href: "/video-services" },
      { label: "Fleet Tracking", href: "/fleet-vehicle-tracking" },
      { label: "EV Charging", href: "/ev-charging-solutions" },
      { label: "Digital Marketing", href: "/digital-marketing" },
      { label: "Web Development", href: "/web-development" },
    ],
  },
  {
    label: "Tools & Status",
    href: "/speed-test",
    location: "FOOTER",
    order: 2,
    children: [
      { label: "Internet Speed Test", href: "/speed-test" },
      { label: "Network Tools", href: "/network-tools" },
      { label: "Cybersecurity Tools", href: "/cybersecurity-tools" },
      { label: "Network Status", href: "/network-status" },
      { label: "System Status", href: "/system-status" },
    ],
  },
  {
    label: "Help & Company",
    href: "/support",
    location: "FOOTER",
    order: 3,
    children: [
      { label: "Request a Quote", href: "/request-quote" },
      { label: "Request Service", href: "/support" },
      { label: "Remote Support", href: "/remote-support" },
      { label: "Knowledge Base", href: "/knowledge-base" },
      { label: "FAQ", href: "/faq" },
      { label: "Brands", href: "/brands" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

function navId(location: string, order: number, label: string, extra = ""): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `default-${location.toLowerCase()}-${order}${extra ? `-${extra}` : ""}-${slug}`;
}

function hrefKey(href: string): string {
  const trimmed = href.trim().toLowerCase();
  if (trimmed === "/" || trimmed === "") return "/";
  return trimmed.replace(/\/+$/, "");
}

export function defaultNavNodes(
  location: DefaultNavItem["location"],
): DefaultNavNode[] {
  return DEFAULT_NAV.filter((item) => item.location === location)
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      id: navId(item.location, item.order, item.label),
      label: item.label,
      href: item.href,
      openInNewTab: false,
      children: (item.children ?? []).map((child, index) => ({
        id: navId(item.location, item.order, child.label, `c${index}`),
        label: child.label,
        href: child.href,
        openInNewTab: child.openInNewTab ?? false,
        children: [],
      })),
    }));
}

/**
 * Keeps admin labels, order inside a group, and extra links, and fills in any
 * shipped items that are missing (Home, EV Charging, Network Status, Live
 * Streams, and the rest).
 */
export function mergeNavWithDefaults<T extends DefaultNavNode>(
  loaded: T[],
  defaults: T[],
): T[] {
  if (loaded.length === 0) return defaults;

  const loadedByLabel = new Map(
    loaded.map((item) => [item.label.trim().toLowerCase(), item] as const),
  );
  const used = new Set<string>();
  const result: T[] = [];

  for (const fallback of defaults) {
    const key = fallback.label.trim().toLowerCase();
    const existing = loadedByLabel.get(key);
    if (!existing) {
      result.push(fallback);
      continue;
    }
    used.add(key);
    result.push({
      ...existing,
      children: mergeChildren(existing.children, fallback.children),
    });
  }

  for (const item of loaded) {
    const key = item.label.trim().toLowerCase();
    if (used.has(key)) continue;
    result.push(item);
  }

  return result;
}

function mergeChildren<T extends DefaultNavNode>(existing: T[], fallback: T[]): T[] {
  const hrefs = new Set(existing.map((child) => hrefKey(child.href)));
  const labels = new Set(existing.map((child) => child.label.trim().toLowerCase()));
  const missing = fallback.filter((child) => {
    if (hrefs.has(hrefKey(child.href))) return false;
    if (labels.has(child.label.trim().toLowerCase())) return false;
    return true;
  });
  return missing.length === 0 ? existing : [...existing, ...missing];
}
