import type { Metadata } from "next";

import { PageHero } from "@/components/site/page-hero";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { searchSite } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
  alternates: { canonical: `${env.siteUrl}/search` },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const hits = q ? await searchSite(q) : [];

  return (
    <>
      <PageHero
        eyebrow="Find"
        title="Search"
        description="Pages, tools, FAQ, knowledge base, brands and case studies. Nothing is sent to a third-party search service."
      />
      <section className="bg-white py-10">
        <div className="container-page max-w-3xl">
          <form action="/search" method="get" className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search the site…"
              className="field min-w-0 flex-1"
            />
            <Button type="submit">Search</Button>
          </form>
          {q && (
            <ul className="mt-8 space-y-4">
              {hits.map((hit) => (
                <li key={`${hit.kind}-${hit.href}-${hit.title}`} className="surface-card p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{hit.kind}</p>
                  <a href={hit.href} className="font-bold text-navy-900 hover:text-brand-700">
                    {hit.title}
                  </a>
                  {hit.snippet && <p className="text-sm text-slate-600">{hit.snippet}</p>}
                </li>
              ))}
              {hits.length === 0 && (
                <li className="text-sm text-slate-600">No published matches for “{q}”.</li>
              )}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
