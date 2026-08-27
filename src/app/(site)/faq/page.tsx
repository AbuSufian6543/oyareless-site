import type { Metadata } from "next";

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
      <section className="bg-white py-14">
        <div className="container-page max-w-3xl space-y-10">
          {items.length === 0 && (
            <p className="text-slate-600">FAQ entries will appear here once published in the admin.</p>
          )}
          {[...groups.entries()].map(([category, group]) => (
            <div key={category}>
              <h2 className="text-lg font-bold text-navy-900">{category}</h2>
              <dl className="mt-4 divide-y divide-slate-200">
                {group.map((item) => (
                  <div key={item.id} className="py-4">
                    <dt className="font-semibold text-navy-900">{item.question}</dt>
                    <dd className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
