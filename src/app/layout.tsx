import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { THEME_COLOR, themeCss } from "@/lib/theme";
import { bindDisplayTimeZone } from "@/lib/timezone";
import "./globals.css";

// Vendored so the image build does not fetch Google Fonts. That fetch
// sometimes returns a URL Turbopack rejects, and the Docker build stops.
const plexSans = localFont({
  src: [
    { path: "../fonts/ibm-plex-sans/ibm-plex-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans/ibm-plex-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-sans/ibm-plex-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/ibm-plex-sans/ibm-plex-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ibm-sans",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "../fonts/ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-mono/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-mono/ibm-plex-mono-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-ibm-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: THEME_COLOR,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  return {
    metadataBase: new URL(env.siteUrl),
    title: {
      default: `${settings.companyName} — ${settings.tagline}`,
      template: `%s — ${settings.companyName}`,
    },
    description: settings.description,
    applicationName: settings.companyName,
    keywords: [
      "IT services Sault Ste. Marie",
      "cybersecurity Northern Ontario",
      "business networking",
      "VoIP telephone Sault Ste. Marie",
      "CCTV security systems",
      "Hytera two way radios",
      "managed IT support Ontario",
    ],
    authors: [{ name: settings.companyName }],
    openGraph: {
      type: "website",
      locale: "en_CA",
      siteName: settings.companyName,
      title: `${settings.companyName} — ${settings.tagline}`,
      description: settings.description,
      url: env.siteUrl,
      images: [
        {
          url: settings.ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${settings.companyName} — ${settings.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.companyName} — ${settings.tagline}`,
      description: settings.description,
      images: [settings.ogImageUrl],
    },
    robots: { index: true, follow: true },
    verification: {
      ...(settings.verificationGoogle
        ? { google: settings.verificationGoogle }
        : {}),
      ...(settings.verificationBing ? { other: { "msvalidate.01": settings.verificationBing } } : {}),
    },
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
        { url: settings.faviconUrl, type: "image/svg+xml" },
        { url: "/favicon.png", type: "image/png", sizes: "32x32" },
        { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
        { url: settings.iconPngUrl, type: "image/png", sizes: "512x512" },
      ],
      apple: [{ url: settings.appleIconUrl, sizes: "180x180", type: "image/png" }],
      shortcut: "/favicon.ico",
    },
    appleWebApp: {
      capable: true,
      title: settings.companyName,
      statusBarStyle: "default",
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const timeZone = bindDisplayTimeZone(settings.displayTimeZone);
  // Retints the accent/brand ramps when an admin has picked custom colors.
  const theme = themeCss(settings);

  // Do not render a <head> here. Next.js injects metadata into head; a
  // manual head tag hydrates against that text and then drops the CSS link.
  return (
    <html
      lang="en-CA"
      data-timezone={timeZone}
      className={`${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        {theme ? (
          <style
            id="wc-theme"
            dangerouslySetInnerHTML={{ __html: theme }}
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
