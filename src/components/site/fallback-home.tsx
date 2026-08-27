import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

/**
 * Safety net for the home route. It only appears if the database has not been
 * seeded yet or an admin unpublished the home page, so it stays intentionally
 * minimal while still giving visitors a way to make contact.
 */
export function FallbackHome() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-900">
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900"
        aria-hidden="true"
      />
      <div className="bg-tech-grid absolute inset-0 -z-10" aria-hidden="true" />

      <div className="container-page py-28 lg:py-40">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent-300">
            WirelessCom.Ca Inc.
          </p>
          <h1 className="text-balance-tight text-4xl leading-[1.08] text-white sm:text-5xl lg:text-[3.5rem]">
            Technology Service Provider for Northern Ontario
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy-200">
            IT services, cybersecurity, networking, telephone systems, security
            and alarm systems, internet, and structured cabling — designed,
            installed, and supported by our team in Sault Ste. Marie. Firewalls
            we support include Barracuda, Fortinet, and Juniper. Cameras and
            phones can include practical AI analytics and attendants.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-6 py-3.5 font-semibold text-navy-950 transition-colors hover:bg-accent-400"
            >
              Request a quote
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="tel:18007053189"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-white/35 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Phone className="size-4" aria-hidden="true" />
              1-800-705-3189
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
