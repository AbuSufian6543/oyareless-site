/**
 * Editable site-wide configuration. Values live in the SiteSetting table so an
 * admin can change contact details without a redeploy; these are the
 * fallbacks, seeded from the current wirelesscom.org content.
 *
 * Kept free of `server-only` so the seed script can share the same defaults.
 */
export const DEFAULT_SETTINGS = {
  companyName: "WirelessCom.Ca Inc.",
  tagline: "Technology Service Provider",
  description:
    "WirelessCom.Ca Inc. provides IT services, cybersecurity, networking, telephone, security systems, and internet solutions to businesses across Northern Ontario.",
  phone: "1-800-705-3189",
  localPhone: "",
  email: "service@wirelesscom.ca",
  supportEmail: "service@wirelesscom.ca",
  addressLine1: "97 White Oak Drive, East",
  addressLine2: "",
  city: "Sault Ste. Marie",
  province: "ON",
  postalCode: "P6B 4J7",
  country: "Canada",
  businessHours: "Monday – Friday, 8:30 a.m. – 5:00 p.m. ET",
  emergencyNote: "24/7 monitoring and emergency support for contracted clients.",
  mapEmbedUrl:
    "https://www.openstreetmap.org/export/embed.html?bbox=-84.36%2C46.50%2C-84.28%2C46.55&layer=mapnik",
  footerNote: "Proudly Canadian. Serving Northern Ontario since 2005.",
  announcementEnabled: false,
  announcementText: "",
  announcementLink: "",
  socialLinkedIn: "",
  socialFacebook: "",
  socialX: "",
  socialYouTube: "",
  analyticsSnippet: "",
  cookieBannerEnabled: true,
  showLiveChatCta: true,
};

export type SiteSettings = typeof DEFAULT_SETTINGS;
export type SettingKey = keyof SiteSettings;

export function formattedAddress(settings: SiteSettings): string {
  return [
    settings.addressLine1,
    settings.addressLine2,
    `${settings.city}, ${settings.province} ${settings.postalCode}`,
    settings.country,
  ]
    .filter(Boolean)
    .join(", ");
}
