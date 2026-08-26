import type { Metadata, Viewport } from "next";

import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a2a4e",
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
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.companyName} — ${settings.tagline}`,
      description: settings.description,
    },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/brand/logo.jpg", type: "image/jpeg" },
      ],
      apple: "/brand/logo.jpg",
    },
    alternates: { canonical: "/" },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-CA">
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  );
}
