import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PROVINCES } from "@/lib/internet-availability/catalog";
import {
  DEFAULT_AVAILABILITY_CITY,
  DEFAULT_AVAILABILITY_PROVINCE,
} from "@/lib/internet-availability/place";

/**
 * The action under the home photograph. City and province travel to the
 * address form. The street stays on that page.
 */
export function HomeAvailabilityBand() {
  return (
    <section aria-label="Internet availability" className="relative z-20 bg-white">
      <div className="container-page">
        <div className="relative -mt-3 overflow-hidden rounded-2xl bg-navy-950 text-white shadow-[0_22px_50px_rgb(4_19_37_/_0.28)] ring-1 ring-navy-950/10">
          <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:p-8">
            <div className="max-w-lg">
              <p className="eyebrow text-accent-300">Internet at your address</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">
                Check internet availability at your location
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-navy-200 sm:text-base">
                City and province start here. The street is next, and we show
                the speeds for that address.
              </p>
            </div>

            <form action="/internet-availability" method="get" className="w-full lg:max-w-xl">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9.5rem] lg:grid-cols-[minmax(0,1fr)_8.5rem_auto] lg:items-end">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-white">
                    City
                  </span>
                  <input
                    name="city"
                    required
                    maxLength={80}
                    defaultValue={DEFAULT_AVAILABILITY_CITY}
                    autoComplete="address-level2"
                    className="field-dark"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-white">
                    Province
                  </span>
                  <select
                    name="province"
                    required
                    defaultValue={DEFAULT_AVAILABILITY_PROVINCE}
                    autoComplete="address-level1"
                    className="field-dark"
                  >
                    {PROVINCES.map((province) => (
                      <option key={province.value} value={province.value}>
                        {province.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full sm:col-span-2 lg:col-span-1 lg:w-auto"
                >
                  Check availability
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
