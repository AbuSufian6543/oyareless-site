import type { Metadata } from "next";

import { BlockList } from "@/components/blocks/block-renderer";
import { getPublishedPage, pageMetadata } from "@/lib/pages";
import { FallbackHome } from "@/components/site/fallback-home";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage("home");
  if (!page) return {};

  const metadata = pageMetadata(page);
  return { ...metadata, alternates: { canonical: "/" } };
}

export default async function HomePage() {
  const page = await getPublishedPage("home");

  // Shown before the seed runs, or if an admin unpublishes the home page.
  if (!page || page.blocks.length === 0) {
    return <FallbackHome />;
  }

  return <BlockList blocks={page.blocks} slideshow={page.slideshow} sourcePage="/" />;
}
