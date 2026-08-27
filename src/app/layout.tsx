import type { Metadata, Viewport } from "next";

import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import { THEME_COLOR, themeCss } from "@/lib/theme";
import "./globals.css";

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
      "cybersecurity Ontario",
      "business networking",
      "VoIP telephone service",
      "CCTV security systems",
      "alarm monitoring",
      "access control",
      "fiber optic splicing",
      "structured cabling",
      "two way radios Hytera",
      "EV charging installation",
      "managed IT support",
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
        { url: settings.faviconUrl, type: "image/svg+xml" },
        { url: "/icon.png", type: "image/png", sizes: "512x512" },
      ],
      apple: "/apple-icon.png",
    },
    alternates: { canonical: "/" },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  // Retints the accent/brand ramps when an admin has picked custom colors.
  const theme = themeCss(settings);

  // Do not render a <head> here. Next.js injects metadata into head; a
  // manual head tag hydrates against that text and then drops the CSS link.
  return (
    <html lang="en-CA">
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
