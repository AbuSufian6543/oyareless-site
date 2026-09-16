import type { Metadata } from "next";

import { BlockList } from "@/components/blocks/block-renderer";
import { JsonLd } from "@/components/site/json-ld";
import { CmsPageFrame } from "@/components/site/cms-page-frame";
import { MobileSecurityTrailerView } from "@/components/site/mobile-security-trailer-view";
import {
  MOBILE_TRAILER_IMAGES,
  MOBILE_TRAILER_META,
  MOBILE_TRAILER_PATH,
  resolveTrailerFlyerUrl,
} from "@/lib/mobile-security-trailer";
import { getPublishedPage, pageJsonLd, pageMetadata } from "@/lib/pages";
import {
  publicMetadata,
  serviceJsonLd,
  webPageJsonLd,
} from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage("mobile-security-trailer");
  if (page) return pageMetadata(page);

  return publicMetadata({
    title: MOBILE_TRAILER_META.metaTitle,
    description: MOBILE_TRAILER_META.description,
    path: MOBILE_TRAILER_PATH,
    image: MOBILE_TRAILER_IMAGES.hero,
    imageAlt:
      "WirelessCom.Ca Mobile Security Trailer with a 30-foot camera tower and solar array",
  });
}

export default async function MobileSecurityTrailerPage() {
  const [page, settings] = await Promise.all([
    getPublishedPage("mobile-security-trailer"),
    getSettings(),
  ]);

  if (page) {
    return (
      <CmsPageFrame slug={page.slug} enabled={page.visitorThemeToggle}>
        <JsonLd data={pageJsonLd(page)} />
        <BlockList blocks={page.blocks} sourcePage={MOBILE_TRAILER_PATH} />
      </CmsPageFrame>
    );
  }

  const flyerUrl = resolveTrailerFlyerUrl(settings.mobileTrailerFlyerUrl);

  return (
    <>
      <JsonLd
        data={serviceJsonLd({
          name: MOBILE_TRAILER_META.title,
          description: MOBILE_TRAILER_META.description,
          path: MOBILE_TRAILER_PATH,
        })}
      />
      <JsonLd
        data={webPageJsonLd({
          name: MOBILE_TRAILER_META.title,
          description: MOBILE_TRAILER_META.description,
          path: MOBILE_TRAILER_PATH,
        })}
      />
      <MobileSecurityTrailerView
        flyerUrl={flyerUrl}
        phone={settings.phone}
        logoUrl={settings.logoInverseUrl || "/brand/logo-inverse.png"}
      />
    </>
  );
}
