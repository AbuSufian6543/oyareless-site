import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PROVINCES } from "@/lib/internet-availability/catalog";
import {
  DEFAULT_AVAILABILITY_CITY,
  DEFAULT_AVAILABILITY_PROVINCE,
} from "@/lib/internet-availability/place";

/**
 * A small availability panel. It sits on the hero photograph, so the fill
 * is the same navy as the photo scrim and stays translucent enough to keep
 * the building in the corner.
 */
export function HomeAvailabilityCard() {
  return (
    <section
      aria-label="Internet availability"
      className="rounded-xl border border-white/20 bg-navy-950/80 p-3 text-white shadow-[0_16px_40px_rgb(4_19_37_/_0.45)] backdrop-blur-md"
    >
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-accent-300">
        Internet at your address
      </p>
      <h2 className="mt-1 text-[0.9375rem] font-bold leading-snug tracking-tight text-white">
        Check internet availability at your location
      </h2>
      <p className="mt-1 text-xs leading-snug text-navy-100">
        City and province start here. The street is next, and we show the
        speeds for that address.
      </p>

      <form action="/internet-availability" method="get" className="mt-2.5">
        <div className="grid grid-cols-[minmax(0,1fr)_6.75rem] gap-2">
          <label className="block min-w-0">
            <span className="mb-1 block text-[0.6875rem] font-semibold text-white">
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
          <label className="block min-w-0">
            <span className="mb-1 block text-[0.6875rem] font-semibold text-white">
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
        </div>
        <Button type="submit" variant="primary" size="sm" className="mt-2 w-full">
          Check availability
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Button>
      </form>
    </section>
  );
}
