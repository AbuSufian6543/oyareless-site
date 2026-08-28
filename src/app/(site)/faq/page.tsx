import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";

import { PageHero } from "@/components/site/page-hero";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Answers about managed IT, cybersecurity, networking, VoIP, alarms and two-way radios from WirelessCom.Ca Inc.",
  alternates: { canonical: `${env.siteUrl}/faq` },
};

export default async function FaqPage() {
  const items = await prisma.faqItem
    .findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ category: "asc" }, { order: "asc" }],
    })
    .catch(() => []);

  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        eyebrow="Help"
        title="Frequently asked questions"
        description="Short answers we give most often. If yours is not here, call 1-800-705-3189 or open a ticket."
      />
      <section className="bg-white py-14 lg:py-16">
        <div className="container-page max-w-3xl space-y-10">
          {items.length === 0 && (
            <p className="surface-empty">
              FAQ entries will appear here once published in the admin.
            </p>
          )}
          {[...groups.entries()].map(([category, group]) => (
            <div key={category}>
              <h2 className="eyebrow text-slate-500">{category}</h2>
              <div className="mt-4 space-y-3">
                {group.map((item) => (
                  <details
                    key={item.id}
                    className="group surface-card open:border-brand-200"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-navy-900">
                      {item.question}
                      <ChevronDown
                        className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                        aria-hidden="true"
                      />
                    </summary>
                    <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
