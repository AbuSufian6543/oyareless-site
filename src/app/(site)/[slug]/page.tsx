import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { BlockList } from "@/components/blocks/block-renderer";
import { JsonLd } from "@/components/site/json-ld";
import { CmsPageFrame } from "@/components/site/cms-page-frame";
import { InternetAvailabilityChecker } from "@/components/site/internet-availability";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { getPublishedPage, pageJsonLd, pageMetadata } from "@/lib/pages";
import { crumbs } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return { title: "Page Not Found" };
  return pageMetadata(page);
}

export default async function CmsPage({ params }: Props) {
  const { slug } = await params;

  // "home" is served at "/", so avoid a duplicate URL for SEO.
  if (slug === "home") permanentRedirect("/");

  const page = await getPublishedPage(slug);

  if (!page) {
    // Fall back to an admin-managed redirect before giving up.
    const redirect = await prisma.redirect
      .findFirst({ where: { source: `/${slug}`, isActive: true } })
      .catch(() => null);

    if (redirect) {
      await prisma.redirect
        .update({ where: { id: redirect.id }, data: { hits: { increment: 1 } } })
        .catch(() => undefined);
      permanentRedirect(redirect.destination);
    }

    notFound();
  }

  let checkerAt = -1;
  if (slug === "internet-services") {
    for (let index = page.blocks.length - 1; index >= 0; index -= 1) {
      if (page.blocks[index]?.type === "cta") {
        checkerAt = index;
        break;
      }
    }
  }
  const beforeChecker = checkerAt > 0 ? page.blocks.slice(0, checkerAt) : page.blocks;
  const afterChecker = checkerAt > 0 ? page.blocks.slice(checkerAt) : [];

  return (
    <CmsPageFrame slug={page.slug} enabled={page.visitorThemeToggle}>
      <PageBreadcrumbs items={crumbs({ name: page.title, href: `/${slug}` })} />
      <JsonLd data={pageJsonLd(page)} />
      <BlockList blocks={beforeChecker} slideshow={page.slideshow} sourcePage={`/${slug}`} />
      {slug === "internet-services" ? <InternetAvailabilityChecker /> : null}
      {afterChecker.length > 0 ? (
        <BlockList blocks={afterChecker} sourcePage={`/${slug}`} />
      ) : null}
    </CmsPageFrame>
  );
}
