import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

import { AiFocusPanel } from "@/components/visuals/ai-focus-panel";
import { TechBackdrop } from "@/components/visuals/tech-backdrop";

/**
 * Safety net for the home route. It only appears if the database has not been
 * seeded yet or an admin unpublished the home page, so it stays intentionally
 * close to the seeded tech hero without pulling blocks from the CMS.
 */
export function FallbackHome() {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 py-24 text-white lg:py-36">
      <TechBackdrop network density={1} glow="right" mood="ai" />

      <div className="container-page relative">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,22rem)] lg:gap-16">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent-300">
              Practical AI · Sault Ste. Marie, Ontario
            </p>
            <h1 className="text-balance-tight text-4xl leading-[1.08] font-bold text-white sm:text-5xl lg:text-[3.5rem]">
              <span className="text-accent-300">AI</span> on the cameras and
              phones you already run
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy-200">
              Find a person in last night&apos;s recording. Route a caller
              without a maze of menus. We turn those features on in the camera
              and telephone systems we design — on equipment you own — then the
              same Sault Ste. Marie team stays on them.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/request-quote"
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
          <AiFocusPanel />
        </div>
      </div>
    </section>
  );
}
