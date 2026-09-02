import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Clock, Download, MapPin } from "lucide-react";

import { ContactFormBlock } from "@/components/blocks/contact-form";
import { JsonLd } from "@/components/site/json-ld";
import { PageBreadcrumbs } from "@/components/site/page-breadcrumbs";
import { prisma } from "@/lib/prisma";
import {
  absoluteUrl,
  BUSINESS_ID,
  crumbs,
  jobEmploymentType,
  postalAddressJsonLd,
  publicMetadata,
} from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

async function loadJob(slug: string) {
  return prisma.jobPosting
    .findFirst({ where: { slug, status: "PUBLISHED" } })
    .catch(() => null);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await loadJob(slug);
  if (!job) return { title: "Position Not Found" };

  return publicMetadata({
    title: `${job.title} — Careers`,
    description: job.summary ?? `${job.title} at WirelessCom.Ca Inc. in Sault Ste. Marie.`,
    path: `/careers/${job.slug}`,
  });
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params;
  const job = await loadJob(slug);
  if (!job) notFound();

  const settings = await getSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description || job.summary || job.title,
    datePosted: job.postedAt.toISOString(),
    url: absoluteUrl(`/careers/${job.slug}`),
    ...(job.closesAt ? { validThrough: job.closesAt.toISOString() } : {}),
    employmentType: jobEmploymentType(job.employmentType),
    hiringOrganization: {
      "@id": BUSINESS_ID,
      "@type": "Organization",
      name: settings.companyName,
      sameAs: absoluteUrl("/"),
      logo: absoluteUrl(settings.logoUrl),
    },
    jobLocation: {
      "@type": "Place",
      address: postalAddressJsonLd(settings),
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageBreadcrumbs
        items={crumbs(
          { name: "Careers", href: "/careers" },
          { name: job.title, href: `/careers/${job.slug}` },
        )}
      />

      <section className="border-b border-slate-200 bg-slate-50 py-12 lg:py-16">
        <div className="container-page">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/careers"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              All openings
            </Link>

            <h1 className="mt-5 text-balance-tight text-3xl text-navy-900 lg:text-[2.5rem]">
              {job.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
              {job.department && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="size-4 text-brand-600" aria-hidden="true" />
                  {job.department}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4 text-brand-600" aria-hidden="true" />
                {job.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-brand-600" aria-hidden="true" />
                {job.employmentType}
              </span>
              {job.salaryRange && (
                <span className="font-semibold text-navy-800">
                  {job.salaryRange}
                </span>
              )}
            </div>

            <p className="mt-4 text-sm text-slate-500">
              Posted {formatDate(job.postedAt)}
              {job.closesAt ? ` · Closes ${formatDate(job.closesAt)}` : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 lg:py-20">
        <div className="container-page">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-3 lg:gap-14">
            <div className="lg:col-span-2">
              {job.summary && (
                <p className="text-lg leading-relaxed text-slate-600">
                  {job.summary}
                </p>
              )}

              {job.description && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-navy-900">
                    About the role
                  </h2>
                  <div className="prose-wc mt-3 whitespace-pre-line">
                    {job.description}
                  </div>
                </div>
              )}

              {job.requirements && (
                <div className="mt-8">
                  <h2 className="text-xl font-bold text-navy-900">
                    What we are looking for
                  </h2>
                  <div className="prose-wc mt-3 whitespace-pre-line">
                    {job.requirements}
                  </div>
                </div>
              )}

              {job.attachmentUrl && (
                <a
                  href={job.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-navy-800 transition-colors hover:border-brand-300"
                >
                  <Download className="size-4 text-brand-600" aria-hidden="true" />
                  Download the full job posting
                </a>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <h2 className="mb-4 text-lg font-bold text-navy-900">
                  Apply for this role
                </h2>
                <ContactFormBlock
                  config={{
                    formType: "CONTACT",
                    showCompany: false,
                    showAddress: false,
                    showServiceInterest: false,
                    successMessage:
                      "Thank you for applying. We review every application and will be in touch if there is a fit.",
                    sourcePage: `/careers/${job.slug}`,
                  }}
                />
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  Please mention <strong>{job.title}</strong> in your message and
                  email your r&eacute;sum&eacute; to service@wirelesscom.ca.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
