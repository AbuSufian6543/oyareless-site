import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { BlockList } from "@/components/blocks/block-renderer";
import { JsonLd } from "@/components/site/json-ld";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { getPublishedPage, pageJsonLd, pageMetadata } from "@/lib/pages";
import { crumbs } from "@/lib/seo";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

  return (
    <>
      <PageBreadcrumbs items={crumbs({ name: page.title, href: `/${slug}` })} />
      <JsonLd data={pageJsonLd(page)} />
      <BlockList blocks={page.blocks} slideshow={page.slideshow} sourcePage={`/${slug}`} />
    </>
  );
}
