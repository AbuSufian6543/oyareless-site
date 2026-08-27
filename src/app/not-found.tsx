import Link from "next/link";
import { ArrowRight, House, Phone, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <section className="relative isolate flex flex-1 items-center overflow-hidden bg-navy-900">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-900"
          aria-hidden="true"
        />
        <div className="bg-tech-grid absolute inset-0 -z-10" aria-hidden="true" />

        <div className="container-page py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-7xl font-extrabold tracking-tight text-accent-500 lg:text-8xl">
              404
            </p>
            <h1 className="mt-4 text-3xl font-bold text-white lg:text-4xl">
              We could not find that page
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-navy-200">
              The page may have been moved or renamed. Our site was recently
              rebuilt, so if you followed an old bookmark, try starting from the
              home page.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg bg-accent-500 px-6 py-3.5 font-semibold text-navy-950 transition-colors hover:bg-accent-400"
              >
                <House className="size-4" aria-hidden="true" />
                Go to home page
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-white/35 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Contact us
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-12 border-t border-white/10 pt-8">
              <p className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-wider text-navy-400">
                <Search className="size-3.5" aria-hidden="true" />
                Popular pages
              </p>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                {[
                  { href: "/search", label: "Search" },
                  { href: "/speed-test", label: "Speed test" },
                  { href: "/it-services", label: "IT Services" },
                  { href: "/cybersecurity", label: "Cybersecurity" },
                  { href: "/security-services", label: "Security Services" },
                  { href: "/telephone-services", label: "Telephone / VoIP" },
                  { href: "/internet-services", label: "Internet Services" },
                  { href: "/support", label: "Support" },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-navy-200 underline underline-offset-4 transition-colors hover:text-accent-300"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <p className="mt-10 flex items-center justify-center gap-2 text-navy-300">
              <Phone className="size-4 text-accent-400" aria-hidden="true" />
              Need help now? Call
              <a
                href="tel:18007053189"
                className="font-bold text-white hover:text-accent-300"
              >
                1-800-705-3189
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
