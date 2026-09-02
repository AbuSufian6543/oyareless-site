import type { Metadata } from "next";

import { QuoteForm } from "@/components/site/quote-form";
import { PageHero } from "@/components/site/page-hero";
import { publicMetadata } from "@/lib/seo";

export const metadata: Metadata = publicMetadata({
  title: "Request a Quote",
  description:
    "Request a quote from WirelessCom.Ca Inc. in Sault Ste. Marie. A person reads every request and replies with a scoped proposal — no automated estimates.",
  path: "/request-quote",
});

export default function RequestQuotePage() {
  return (
    <>
      <PageHero
        eyebrow="Sales"
        title="Request A Quote"
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
