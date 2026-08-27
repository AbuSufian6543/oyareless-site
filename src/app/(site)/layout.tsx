import Script from "next/script";

import { AnnouncementBar } from "@/components/site/announcement-bar";
import { CookieBanner } from "@/components/site/cookie-banner";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { env } from "@/lib/env";
import { getFooterNav, getHeaderNav } from "@/lib/navigation";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, headerNav, footerNav] = await Promise.all([
    getSettings(),
    getHeaderNav(),
    getFooterNav(),
  ]);

  // LocalBusiness schema materially helps a single-location service business
  // rank for "near me" queries.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    name: settings.companyName,
    description: settings.description,
    url: env.siteUrl,
    telephone: settings.phone,
    email: settings.email,
    image: `${env.siteUrl}${settings.ogImageUrl}`,
    logo: `${env.siteUrl}${settings.logoUrl}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.addressLine1,
      addressLocality: settings.city,
      addressRegion: settings.province,
      postalCode: settings.postalCode,
      addressCountry: "CA",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 46.5136,
      longitude: -84.3358,
    },
    areaServed: [
      { "@type": "City", name: "Sault Ste. Marie" },
      { "@type": "AdministrativeArea", name: "Northern Ontario" },
      { "@type": "AdministrativeArea", name: "Ontario" },
    ],
    priceRange: "$$",
    foundingDate: "2005",
    knowsAbout: [
      "Information Technology Services",
      "Cybersecurity",
      "Network Infrastructure",
      "VoIP Telephony",
      "Video Surveillance",
      "Access Control",
      "Alarm Monitoring",
      "Fiber Optic Splicing",
      "Two-Way Radio Communications",
      "EV Charging Installation",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: settings.phone,
      contactType: "customer service",
      areaServed: "CA",
      availableLanguage: ["English"],
    },
  };

  return (
    <>
      <Script
        id="ld-local-business"
        type="application/ld+json"
        // Serialised server-side from trusted settings, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {settings.announcementEnabled && settings.announcementText && (
        <AnnouncementBar
          text={settings.announcementText}
          href={settings.announcementLink || undefined}
        />
      )}

      <SiteHeader
        nav={headerNav}
        phone={settings.phone}
        email={settings.email}
        companyName={settings.companyName}
        tagline={settings.tagline}
        logoUrl={settings.logoUrl}
      />

      <main id="main" className="flex-1">
        {children}
      </main>

      <SiteFooter nav={footerNav} settings={settings} />

      {settings.cookieBannerEnabled && <CookieBanner />}

      {settings.analyticsSnippet && (
        <Script
          id="site-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: settings.analyticsSnippet }}
        />
      )}

      {/* Admin-managed third-party snippets. Only ever loaded on the public
          site, never inside /admin. */}
      {settings.headEmbedCode && (
        <Script
          id="site-head-embed"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: settings.headEmbedCode }}
        />
      )}

      {settings.bodyEndEmbedCode && (
        <Script
          id="site-body-embed"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{ __html: settings.bodyEndEmbedCode }}
        />
      )}
    </>
  );
}

export const dynamic = "force-dynamic";
