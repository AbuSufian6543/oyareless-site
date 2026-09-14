import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Clock,
  HeartHandshake,
  MapPin,
  Wallet,
} from "lucide-react";

import { CareerApplyForm } from "@/components/careers/career-apply-form";
import { PageHero } from "@/components/site/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { GENERAL_APPLICATION_TITLE } from "@/lib/careers";
import { prisma } from "@/lib/prisma";
import { getResolvedTurnstile } from "@/lib/turnstile";
import { formatDate } from "@/lib/utils";
import { JsonLd } from "@/components/site/json-ld";
import { collectionPageJsonLd, publicMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = publicMetadata({
  title: "Careers",
  description:
    "Join WirelessCom.Ca Inc. in Sault Ste. Marie. Field technicians, network engineers, and security specialists serving Northern Ontario.",
  path: "/careers",
});

const BENEFITS = [
  {
    icon: HeartHandshake,
    title: "Local and long-standing",
    description:
      "A Sault Ste. Marie business with two decades of relationships across Northern Ontario.",
  },
  {
    icon: Building2,
    title: "Varied, hands-on work",
    description:
      "Networking, structured cabling, video surveillance, alarm systems and IT support — rarely two identical days.",
  },
  {
    icon: Briefcase,
    title: "Training and certification",
    description:
      "We invest in manufacturer training and certifications so your skills keep pace with the industry.",
  },
];

export default async function CareersPage() {
  const [jobs, turnstile] = await Promise.all([
    prisma.jobPosting
      .findMany({
        // Expired postings are excluded in the query rather than in render so
        // the page never has to reason about the current time itself.
        where: {
          status: "PUBLISHED",
          OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }],
        },
        orderBy: { postedAt: "desc" },
      })
      .catch(() => []),
    getResolvedTurnstile(),
  ]);

  const open = jobs;

  return (
    <>
      <JsonLd
        data={collectionPageJsonLd({
          name: "Careers",
          description:
            "Join WirelessCom.Ca Inc. in Sault Ste. Marie. Field technicians, network engineers, and security specialists serving Northern Ontario.",
          path: "/careers",
        })}
      />
      <PageHero
        eyebrow="Careers"
        title="Build Networks That Keep The North Connected"
        description="We are a team of technicians, engineers and support specialists delivering IT, networking, surveillance and alarm systems to businesses across Northern Ontario."
      />

      <section className="bg-white py-16 lg:py-20">
        <div className="container-page">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="surface-card p-6"
              >
                <span className="mb-4 flex size-11 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <benefit.icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="font-bold text-navy-800">{benefit.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 lg:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-navy-900 lg:text-3xl">
              Open positions
            </h2>

            {open.length === 0 ? (
              <div className="surface-empty mt-7">
                <Briefcase
                  className="mx-auto mb-3 size-8 text-slate-300"
                  aria-hidden="true"
                />
                <p className="font-semibold text-navy-800">
                  No positions are posted right now
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                  We still like to hear from good people. Send your résumé below
                  and we will keep it on file for the next opening.
                </p>
                <ButtonLink href="#apply" className="mt-5">
                  Send us your résumé
                </ButtonLink>
              </div>
            ) : (
              <ul className="mt-7 space-y-3">
                {open.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/careers/${job.slug}`}
                      className="group flex flex-col gap-3 surface-card surface-card-hover p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <h3 className="font-bold text-navy-900 group-hover:text-brand-700">
                          {job.title}
                        </h3>
                        {job.summary && (
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                            {job.summary}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
                          {job.department && (
                            <span className="flex items-center gap-1.5">
                              <Building2 className="size-3.5" aria-hidden="true" />
                              {job.department}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-3.5" aria-hidden="true" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3.5" aria-hidden="true" />
                            {job.employmentType}
                          </span>
                          {job.salaryRange && (
                            <span className="flex items-center gap-1.5">
                              <Wallet className="size-3.5" aria-hidden="true" />
                              {job.salaryRange}
                            </span>
                          )}
                          <span>Posted {formatDate(job.postedAt)}</span>
                        </div>
                      </div>

                      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600">
                        View role
                        <ArrowUpRight
                          className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section id="apply" className="scroll-mt-24 bg-white py-16 lg:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-navy-900 lg:text-3xl">
              {open.length === 0 ? "Send a résumé" : "Don’t see a fit?"}
            </h2>
            <p className="mt-3 text-slate-600">
              Upload a PDF résumé. We review every application in our hiring
              inbox — there is no public email address for applications.
            </p>
            <div className="mt-7">
              <CareerApplyForm
                jobTitle={GENERAL_APPLICATION_TITLE}
                turnstileSiteKey={turnstile.siteKey}
                successMessage="Thank you. We have your résumé on file and will be in touch if a role opens that matches."
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
