"use client";

import Link from "next/link";

export default function SiteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="bg-navy-900 py-24">
      <div className="container-page max-w-xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent-300">
          Error
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-white">
          This page could not be shown
        </h1>
        <p className="mt-3 text-navy-200">
          Something failed while loading this screen. Try again, or go back to
          the home page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:bg-accent-400"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Home
          </Link>
        </div>
      </div>
    </section>
  );
}
