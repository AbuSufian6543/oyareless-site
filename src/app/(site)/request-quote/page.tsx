import type { Metadata } from "next";

import { QuoteForm } from "@/components/site/quote-form";
import { PageHero } from "@/components/site/page-hero";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Request a quote",
  description:
    "Tell WirelessCom.Ca Inc. about your project. We will reply with a scoped proposal — no automated estimates.",
  alternates: { canonical: `${env.siteUrl}/request-quote` },
};

export default function RequestQuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Sales"
        title="Request a quote"
        description="Describe the site, the work and the timeframe. A person reads every request. For a service outage, call 1-800-705-3189 instead."
      />
      <section className="bg-slate-50 py-12 lg:py-16">
        <div className="container-page max-w-2xl">
          <div className="surface-card p-6 sm:p-8">
            <QuoteForm />
          </div>
        </div>
      </section>
    </>
  );
}
