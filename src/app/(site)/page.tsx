import type { Metadata } from "next";

import { BlockList } from "@/components/blocks/block-renderer";
import { JsonLd } from "@/components/site/json-ld";
import { FallbackHome } from "@/components/site/fallback-home";
import { getPublishedPage, pageJsonLd, pageMetadata } from "@/lib/pages";
import { publicMetadata, webPageJsonLd } from "@/lib/seo";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage("home");
  if (!page) {
    return publicMetadata({
      title: "IT, Security & Radio in Northern Ontario",
      description: DEFAULT_SETTINGS.description,
      path: "/",
    });
  }

  return pageMetadata(page);
}

export default async function HomePage() {
  const page = await getPublishedPage("home");

  // Shown before the seed runs, or if an admin unpublishes the home page.
  if (!page || page.blocks.length === 0) {
    return (
      <>
        <JsonLd
          data={webPageJsonLd({
            name: "IT, Security & Radio in Northern Ontario",
            description: DEFAULT_SETTINGS.description,
            path: "/",
          })}
        />
        <FallbackHome />
      </>
    );
  }

  return (
    <>
      <JsonLd data={pageJsonLd(page)} />
      <BlockList blocks={page.blocks} slideshow={page.slideshow} sourcePage="/" />
    </>
  );
}
