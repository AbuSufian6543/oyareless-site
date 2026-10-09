import type { Metadata } from "next";

import { QuoteForm } from "@/components/site/quote-form";
import { PageHero } from "@/components/site/page-hero";
import { clampQuoteDetails, clampQuoteText } from "@/lib/quote-prefill";
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
  searchParams: Promise<{ interest?: string; intent?: string; address?: string; details?: string }>;
}) {
  const params = await searchParams;
  const trailer = params.interest === "trailer";
  const custom = params.intent === "custom";
  const internet = params.interest === "internet";
  const address = clampQuoteText(params.address, 300);
  const carriedDetails = clampQuoteDetails(params.details);

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
              preselected={
                trailer ? ["Mobile security trailer"] : internet ? ["Internet"] : []
              }
              defaultSiteAddress={address}
              notice={
                internet && address
                  ? "This quote includes the address and the speeds from your availability check. Change anything that is not right."
                  : address
                    ? `This quote is for a site in ${address}. Add the work you want done.`
                    : ""
              }
              defaultDetails={
                custom
                  ? "I would like a Mobile Security Trailer custom-built for our site. Please contact me to specify cameras, recording, communications, and deployment."
                  : trailer
                    ? "I am requesting a quote for a Mobile Security Trailer."
                    : carriedDetails
              }
            />
          </div>
        </div>
      </section>
    </>
  );
}
