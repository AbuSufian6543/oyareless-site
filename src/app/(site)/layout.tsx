import { AnnouncementBar } from "@/components/site/announcement-bar";
import { CookieBanner } from "@/components/site/cookie-banner";
import { JsonLd } from "@/components/site/json-ld";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { TawkChat } from "@/components/site/tawk-chat";
import { getFooterNav, getHeaderNav } from "@/lib/navigation";
import { siteGraphJsonLd } from "@/lib/seo";
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

  // LocalBusiness + WebSite JSON-LD (with SearchAction) helps a single-location
  // service business rank for "near me" queries without repeating fake claims.
  const jsonLd = siteGraphJsonLd(settings);

  return (
    <>
      <JsonLd data={jsonLd} />

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

      {settings.showLiveChatCta ? <TawkChat /> : null}

      {settings.analyticsSnippet ? (
        <script dangerouslySetInnerHTML={{ __html: settings.analyticsSnippet }} />
      ) : null}

      {settings.headEmbedCode ? (
        <script dangerouslySetInnerHTML={{ __html: settings.headEmbedCode }} />
      ) : null}

      {settings.bodyEndEmbedCode ? (
        <script dangerouslySetInnerHTML={{ __html: settings.bodyEndEmbedCode }} />
      ) : null}
    </>
  );
}

export const dynamic = "force-dynamic";
