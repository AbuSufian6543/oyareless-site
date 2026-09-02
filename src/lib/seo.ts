import type { Metadata } from "next";

import { env } from "@/lib/env";
import {
  DEFAULT_SETTINGS,
  formattedAddress,
  type SiteSettings,
} from "@/lib/settings-defaults";

export const BUSINESS_ID = `${env.siteUrl}/#business`;
export const WEBSITE_ID = `${env.siteUrl}/#website`;

export type Crumb = { name: string; href: string };

/** Resolves a site path or existing URL against NEXT_PUBLIC_SITE_URL. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${env.siteUrl}${normalized}`;
}

export function ogImage(
  url: string | null | undefined,
  fallback: string,
  alt = DEFAULT_SETTINGS.companyName,
) {
  return {
    url: absoluteUrl(url || fallback),
    width: 1200,
    height: 630,
    alt,
  };
}

const SERVICE_PAGES: Array<{ slug: string; name: string }> = [
  { slug: "it-services", name: "IT Services" },
  { slug: "cybersecurity", name: "Cybersecurity" },
  { slug: "firewalls", name: "Firewalls" },
  { slug: "ai-services", name: "AI cameras and phones" },
  { slug: "security-services", name: "Security systems" },
  { slug: "alarm-systems", name: "Alarm systems" },
  { slug: "access-control", name: "Access control" },
  { slug: "door-intercom", name: "Door intercom" },
  { slug: "panic-buttons", name: "Panic buttons" },
  { slug: "telephone-services", name: "Telephone (VoIP)" },
  { slug: "internet-services", name: "Internet services" },
  { slug: "data-cabling-fiber-optic", name: "Data cabling and fiber optic" },
  { slug: "two-way-radios", name: "Two-way radios" },
  { slug: "video-services", name: "Video and broadcasting" },
  { slug: "fleet-vehicle-tracking", name: "Fleet tracking" },
  { slug: "ev-charging-solutions", name: "EV charging" },
  { slug: "web-development", name: "Web development" },
  { slug: "digital-marketing", name: "Digital marketing" },
];

export function isServiceSlug(slug: string): boolean {
  return SERVICE_PAGES.some((page) => page.slug === slug);
}

export function sameAsLinks(settings: SiteSettings): string[] {
  return [
    settings.socialLinkedIn,
    settings.socialFacebook,
    settings.socialYouTube,
    settings.socialX,
  ].filter((url): url is string => Boolean(url));
}

/**
 * Parses the default "Monday – Friday, 8:30 a.m. – 5:00 p.m. ET" hours string.
 * Returns nothing when the text is not in that shape so we never invent hours.
 */
export function openingHoursSpec(businessHours: string) {
  const match = businessHours.match(
    /(\d{1,2}):(\d{2})\s*a\.m\.\s*[–-]\s*(\d{1,2}):(\d{2})\s*p\.m\./i,
  );
  if (!match || !/monday/i.test(businessHours) || !/friday/i.test(businessHours)) {
    return undefined;
  }
  const opens = `${match[1]!.padStart(2, "0")}:${match[2]}`;
  const closeHour = Number.parseInt(match[3]!, 10) + 12;
  const closes = `${String(closeHour).padStart(2, "0")}:${match[4]}`;
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens,
    closes,
  };
}

export function localBusinessJsonLd(settings: SiteSettings) {
  const logo = absoluteUrl(settings.logoUrl);
  const image = absoluteUrl(settings.ogImageUrl);
  const sameAs = sameAsLinks(settings);
  const hours = openingHoursSpec(settings.businessHours);

  return {
    "@type": ["LocalBusiness", "ProfessionalService"],
    "@id": BUSINESS_ID,
    name: settings.companyName,
    legalName: settings.companyName,
    slogan: settings.tagline,
    description: settings.description,
    url: env.siteUrl,
    telephone: settings.phone,
    email: settings.email,
    image: [image, logo],
    logo: { "@type": "ImageObject", url: logo },
    priceRange: "$$",
    currenciesAccepted: "CAD",
    foundingDate: "2005",
    address: {
      "@type": "PostalAddress",
      streetAddress: [settings.addressLine1, settings.addressLine2]
        .filter(Boolean)
        .join(", "),
      addressLocality: settings.city,
      addressRegion: settings.province,
      postalCode: settings.postalCode,
      addressCountry: "CA",
    },
    geo: {
      "@type": "GeoCoordinates",
      // White Oak Drive East industrial strip (nearby civic numbers 80–105).
      latitude: 46.5369,
      longitude: -84.332,
    },
    areaServed: [
      { "@type": "City", name: "Sault Ste. Marie" },
      { "@type": "AdministrativeArea", name: "Northern Ontario" },
      { "@type": "AdministrativeArea", name: "Ontario" },
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: settings.phone,
        contactType: "sales",
        areaServed: "CA",
        availableLanguage: ["English"],
      },
      {
        "@type": "ContactPoint",
        telephone: settings.phone,
        email: settings.supportEmail || settings.email,
        contactType: "customer support",
        areaServed: "CA",
        availableLanguage: ["English"],
      },
    ],
    knowsAbout: SERVICE_PAGES.map((page) => page.name),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: SERVICE_PAGES.map((page) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: page.name,
          url: absoluteUrl(`/${page.slug}`),
          provider: { "@id": BUSINESS_ID },
        },
      })),
    },
    ...(hours ? { openingHoursSpecification: hours } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function webSiteJsonLd(settings: SiteSettings) {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: env.siteUrl,
    name: settings.companyName,
    description: settings.description,
    inLanguage: "en-CA",
    publisher: { "@id": BUSINESS_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${env.siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function siteGraphJsonLd(settings: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@graph": [webSiteJsonLd(settings), localBusinessJsonLd(settings)],
  };
}

export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function serviceJsonLd(options: {
  name: string;
  description: string;
  path: string;
  brand?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    provider: { "@id": BUSINESS_ID },
    areaServed: [
      { "@type": "City", name: "Sault Ste. Marie" },
      { "@type": "AdministrativeArea", name: "Northern Ontario" },
    ],
    ...(options.brand
      ? { brand: { "@type": "Brand", name: options.brand } }
      : {}),
  };
}

export function webPageJsonLd(options: {
  name: string;
  description?: string;
  path: string;
  type?: "WebPage" | "ContactPage" | "AboutPage" | "FAQPage" | "CollectionPage";
}) {
  return {
    "@context": "https://schema.org",
    "@type": options.type ?? "WebPage",
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.path),
    inLanguage: "en-CA",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": BUSINESS_ID },
  };
}

export function collectionPageJsonLd(options: {
  name: string;
  description: string;
  path: string;
}) {
  return webPageJsonLd({ ...options, type: "CollectionPage" });
}

export function articleJsonLd(options: {
  type?: "BlogPosting" | "TechArticle" | "Article";
  headline: string;
  description?: string;
  path: string;
  datePublished?: string | null;
  dateModified?: string;
  image?: string | null;
  authorName?: string | null;
  publisherName: string;
  logoUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": options.type ?? "Article",
    headline: options.headline,
    description: options.description,
    url: absoluteUrl(options.path),
    mainEntityOfPage: absoluteUrl(options.path),
    datePublished: options.datePublished || undefined,
    dateModified: options.dateModified,
    image: options.image ? absoluteUrl(options.image) : undefined,
    author: {
      "@type": "Organization",
      name: options.authorName || options.publisherName,
    },
    publisher: {
      "@id": BUSINESS_ID,
      "@type": "Organization",
      name: options.publisherName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(options.logoUrl),
      },
    },
  };
}

/** Maps admin free-text values onto schema.org JobPosting employmentType. */
export function jobEmploymentType(value: string) {
  const key = value.toLowerCase().replace(/[^a-z]/g, "");
  const mapped: Record<string, string> = {
    fulltime: "FULL_TIME",
    parttime: "PART_TIME",
    contract: "CONTRACTOR",
    contractor: "CONTRACTOR",
    temporary: "TEMPORARY",
    intern: "INTERN",
    internship: "INTERN",
  };
  return mapped[key] || "OTHER";
}

export function crumbs(...items: Crumb[]): Crumb[] {
  return [{ name: "Home", href: "/" }, ...items];
}

export function publicMetadata(options: {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  index?: boolean;
  follow?: boolean;
  type?: "website" | "article";
  publishedTime?: string | null;
  modifiedTime?: string;
}): Metadata {
  const url = absoluteUrl(options.path);
  const image = ogImage(
    options.image,
    DEFAULT_SETTINGS.ogImageUrl,
    options.imageAlt,
  );
  const index = options.index !== false;
  const follow = options.follow !== false;
  const type = options.type ?? "website";

  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: options.path },
    robots: { index, follow },
    openGraph: {
      type,
      locale: "en_CA",
      siteName: DEFAULT_SETTINGS.companyName,
      title: options.title,
      description: options.description,
      url,
      images: [image],
      ...(type === "article" && options.publishedTime
        ? {
            publishedTime: options.publishedTime,
            modifiedTime: options.modifiedTime,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [image.url],
    },
  };
}

/** Address line used in JobPosting and similar schema. */
export function postalAddressJsonLd(settings: SiteSettings) {
  return {
    "@type": "PostalAddress",
    streetAddress: [settings.addressLine1, settings.addressLine2]
      .filter(Boolean)
      .join(", "),
    addressLocality: settings.city,
    addressRegion: settings.province,
    postalCode: settings.postalCode,
    addressCountry: "CA",
  };
}

export { formattedAddress };
