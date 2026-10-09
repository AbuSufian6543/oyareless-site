import { ArrowRight, MapPin, Wifi } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";

const POINTS = [
  { icon: MapPin, label: "Street address" },
  { icon: Wifi, label: "Ontario and Quebec" },
  { icon: ArrowRight, label: "Speeds for that site" },
] as const;

/**
 * A short invitation under the home hero. The address form lives on its own page.
 */
export function HomeAvailabilityBand() {
  return (
    <section aria-label="Internet availability" className="bg-slate-50">
      <div className="container-page py-10 sm:py-12">
        <div className="surface-card flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
          <div className="min-w-0">
            <p className="eyebrow text-brand-700">Internet at your address</p>
            <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
              Check internet availability at your location
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
              Enter the street address. We will show the internet speeds
              WirelessCom can deliver there.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
              {POINTS.map((point) => (
                <li
                  key={point.label}
                  className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-navy-800"
                >
                  <point.icon className="size-4 text-brand-600" aria-hidden="true" />
                  {point.label}
                </li>
              ))}
            </ul>
          </div>
          <ButtonLink
            href="/internet-availability"
            size="lg"
            className="w-full sm:w-auto lg:shrink-0"
          >
            Check availability
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
