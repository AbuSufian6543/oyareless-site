import { ArrowRight, Wifi } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";

export function HomeAvailabilityBand() {
  return (
    <section className="bg-white py-10 lg:py-14">
      <div className="container-page">
        <div className="surface-card flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Wifi className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-navy-900">
                Check internet availability at your location
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
                See which fibre and copper speeds WirelessCom can deliver to your street before you call.
              </p>
            </div>
          </div>
          <ButtonLink href="/internet-services#availability" variant="primary" size="md" className="shrink-0">
            Check availability
            <ArrowRight className="size-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
