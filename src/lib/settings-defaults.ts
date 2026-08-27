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

  // Branding. Every value is a URL an admin can repoint at the media library,
  // so the logo, favicon and social card change without a redeploy.
  logoUrl: "/brand/logo.png",
  logoInverseUrl: "/brand/logo-inverse.png",
  faviconUrl: "/favicon.svg",
  ogImageUrl: "/brand/og-default.png",

  // Theme. `themeAccent` drives the whole accent ramp at runtime via
  // color-mix(); see src/lib/theme.ts.
  themePrimary: "#1478d4",
  themeAccent: "#22b8d8",

  // Empty means the hero uses the animated node mesh alone, which is the
  // intended default. Point this at a photograph to layer one behind it.
  homeHeroImageUrl: "",
  homeHeroOverlay: "0.78",

  // Site-wide script/pixel injection. Dashboards and iframes belong in page
  // content instead, so these two only ever run script tags.
  headEmbedCode: "",
  bodyEndEmbedCode: "",

  // Search console ownership tokens, rendered as proper <meta> tags.
  verificationGoogle: "",
  verificationBing: "",

  // Remote support. RustDesk is self-hosted, so the relay details are the
  // customer's own servers. The key below is the *public* part of the server
  // key pair — it is meant to be distributed to clients, unlike the private
  // key, which never belongs in this table.
  remoteSupportEnabled: true,
  rustdeskIdServer: "",
  rustdeskRelayServer: "",
  rustdeskApiServer: "",
  rustdeskPublicKey: "",
  rustdeskDownloadWindows: "",
  rustdeskDownloadMacOS: "",
  rustdeskDownloadLinux: "",
  rustdeskDownloadAndroid: "",
  remoteSupportInstructions:
    "Download and run the client, then read us the nine-digit ID and one-time password shown on your screen. Nothing happens until you share them, and you can end the session at any time by closing the window.",

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
