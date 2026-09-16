import type { Metadata } from "next";

import { JsonLd } from "@/components/site/json-ld";
import { MobileSecurityTrailerView } from "@/components/site/mobile-security-trailer-view";
import {
  MOBILE_TRAILER_IMAGES,
  MOBILE_TRAILER_META,
  MOBILE_TRAILER_PATH,
  resolveTrailerFlyerUrl,
} from "@/lib/mobile-security-trailer";
import {
  publicMetadata,
  serviceJsonLd,
  webPageJsonLd,
} from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = publicMetadata({
  title: MOBILE_TRAILER_META.metaTitle,
  description: MOBILE_TRAILER_META.description,
  path: MOBILE_TRAILER_PATH,
  image: MOBILE_TRAILER_IMAGES.hero,
  imageAlt:
    "WirelessCom.Ca Mobile Security Trailer with a 30-foot camera tower and solar array",
});

export default async function MobileSecurityTrailerPage() {
  const settings = await getSettings();
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
      <MobileSecurityTrailerView flyerUrl={flyerUrl} phone={settings.phone} />
    </>
  );
}