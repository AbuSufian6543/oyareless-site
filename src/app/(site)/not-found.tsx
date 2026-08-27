import Link from "next/link";

import { PageHero } from "@/components/site/page-hero";

export default function SiteNotFound() {
  return (
    <>
      <PageHero
        eyebrow="404"
        title="We could not find that page"
        description="The page may have been moved or renamed. Try search, or start from the home page."
      />
      <section className="bg-white py-12">
        <div className="container-page flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Home
          </Link>
          <Link
            href="/search"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-slate-50"
          >
            Search
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-slate-50"
          >
            Contact
          </Link>
        </div>
      </section>
    </>
  );
}
