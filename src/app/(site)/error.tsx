"use client";

import { Button, ButtonLink } from "@/components/ui/button";

export default function SiteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="bg-navy-900 py-24">
      <div className="container-page max-w-xl text-center">
        <p className="eyebrow-pill mx-auto">Error</p>
        <h1 className="mt-3 text-3xl font-bold text-white">
          This Page Could Not Be Shown
        </h1>
        <p className="mt-3 text-navy-200">
          Something failed while loading this screen. Try again, or go back to
          the home page.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="accent" onClick={reset}>
            Try again
          </Button>
          <ButtonLink href="/" variant="onDark">
            Home
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
