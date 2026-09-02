import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { SectionImage } from "@/components/visuals/section-image";
import { prisma } from "@/lib/prisma";
import { JsonLd } from "@/components/site/json-ld";
import { collectionPageJsonLd, publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Brands We Deploy and Support",
  description:
    "Technologies WirelessCom.Ca Inc. installs and supports in Sault Ste. Marie. Vendor names describe equipment we work with; a formal partnership is stated only where one exists.",
  path: "/brands",
});

export default async function BrandsPage() {
  const brands = await prisma.brand
    .findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
    })
    .catch(() => []);

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: "Brands We Deploy and Support",
          description:
            "Technologies WirelessCom.Ca Inc. installs and supports in Sault Ste. Marie. Vendor names describe equipment we work with; a formal partnership is stated only where one exists.",
          path: "/brands",
        })}
      />
      <PageHero
        eyebrow="Catalogue"
        title="Technologies We Deploy And Support"
        description="We design around equipment we are trained on and can support long term. Names below describe what we install, unless a formal relationship is stated."
      />
      <section className="bg-white py-14">
        <div className="container-page">
          {brands.length === 0 ? (
            <p className="text-slate-600">
              Brand entries are managed in the admin catalog and will appear
              here once published.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand) => (
                <li
                  key={brand.id}
                  className="surface-card p-5"
                >
                  {brand.logoUrl ? (
                    <div className="mb-4 flex h-16 items-center justify-center rounded-md bg-white px-3 py-2">
                      <SectionImage
                        src={brand.logoUrl}
                        alt={brand.name}
                        width={180}
                        height={64}
                        sizes="180px"
                        className="max-h-10 w-auto max-w-[10.5rem] object-contain"
                      />
                    </div>
                  ) : null}
                  <h2 className="font-bold text-navy-900">{brand.name}</h2>
                  {brand.relationship && (
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
                      {brand.relationship}
                    </p>
                  )}
                  {brand.category && (
                    <p className="mt-1 text-sm text-slate-500">{brand.category}</p>
                  )}
                  {brand.description && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {brand.description}
                    </p>
                  )}
                  {brand.websiteUrl && (
                    <Link
                      href={brand.websiteUrl}
                      className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
                    >
                      Vendor site
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
