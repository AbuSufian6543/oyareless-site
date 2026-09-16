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

export default async function RequestQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ interest?: string; intent?: string }>;
}) {
  const params = await searchParams;
  const trailer = params.interest === "trailer";
  const custom = params.intent === "custom";

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
            <QuoteForm
              preselected={trailer ? ["Mobile security trailer"] : []}
              defaultDetails={
                custom
                  ? "I would like a Mobile Security Trailer custom-built for our site. Please contact me to specify cameras, recording, communications, and deployment."
                  : trailer
                    ? "I am requesting a quote for a Mobile Security Trailer."
                    : ""
              }
            />
          </div>
        </div>
      </section>
    </>
  );
}
