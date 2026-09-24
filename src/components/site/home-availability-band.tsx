import { ArrowRight, Wifi } from "lucide-react";
import Link from "next/link";

/**
 * A single chip on the seam under the home hero. The full address form lives
 * on Internet services; this only points there.
 */
export function HomeAvailabilityBand() {
  return (
    <div className="relative z-20 -mt-5">
      <div className="container-page flex justify-center px-4">
        <Link
          href="/internet-availability"
          className="group inline-flex max-w-full items-center gap-2.5 rounded-full border border-white/15 bg-navy-950/90 py-1.5 pl-1.5 pr-3.5 text-sm text-white shadow-[0_12px_32px_rgb(4_19_37_/_0.38)] backdrop-blur-md transition-colors hover:border-accent-400/45"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-500/15 text-accent-300">
            <Wifi className="size-3.5" aria-hidden="true" />
          </span>
          <span className="truncate text-white/85">Fibre and copper at your address</span>
          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-accent-300">
            Check
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </Link>
      </div>
    </div>
  );
}
