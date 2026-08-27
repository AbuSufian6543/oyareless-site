import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Brands we deploy and support",
  description:
    "Technologies WirelessCom.Ca Inc. installs and supports. Vendor names describe equipment we work with; a formal partnership is stated only where one exists.",
  alternates: { canonical: `${env.siteUrl}/brands` },
};

export default async function BrandsPage() {
  const brands = await prisma.brand
    .findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
    })
    .catch(() => []);

  return (
    <>
      <PageHero
        eyebrow="Catalogue"
        title="Technologies we deploy and support"
        description="We design around equipment we are trained on and can support long term. Names below describe what we install, unless a formal relationship is stated."
      />
      <section className="bg-white py-14">
        <div className="container-page">
          {brands.length === 0 ? (
            <p className="text-slate-600">
              Brand entries are managed in the admin catalogue and will appear
              here once published.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand) => (
                <li
                  key={brand.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-5"
                >
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
