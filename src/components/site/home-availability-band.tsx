import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * A quiet line under the home hero. The address form lives on its own page.
 */
export function HomeAvailabilityBand() {
  return (
    <section aria-label="Internet availability" className="bg-white">
      <div className="container-page">
        <div className="flex flex-col gap-3 border-b border-slate-200 py-5 sm:flex-row sm:items-center sm:justify-between sm:py-6">
          <p className="text-base font-semibold text-navy-900">
            Check internet availability at your location
          </p>
          <Link
            href="/internet-availability"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Check availability
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
