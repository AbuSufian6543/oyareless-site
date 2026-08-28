import { Phone } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
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
            <p className="eyebrow-pill mb-4">
              Practical AI · Sault Ste. Marie, Ontario
            </p>
            <h1 className="text-balance-tight text-4xl leading-[1.08] font-bold text-white sm:text-5xl lg:text-[3.5rem]">
              <span className="text-accent-300">AI</span> we implement on
              cameras and phones
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy-200">
              Find a person in last night&apos;s recording. Route a caller
              without a maze of menus. We implement those features in camera
              and telephone systems we design and install — then the same Sault
              Ste. Marie team stays on them. Firewalls, Wi-Fi, cabling and
              support are still ours.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/request-quote" variant="accent" size="lg">
                Request a quote
              </ButtonLink>
              <ButtonLink href="tel:18007053189" variant="onDark" size="lg">
                <Phone className="size-4" aria-hidden="true" />
                1-800-705-3189
              </ButtonLink>
            </div>
          </div>
          <AiFocusPanel />
        </div>
      </div>
    </section>
  );
}
