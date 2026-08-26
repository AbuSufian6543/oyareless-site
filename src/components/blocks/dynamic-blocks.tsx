import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Briefcase, Clock, MapPin } from "lucide-react";

import { Section, SectionHeading, isDarkBackground } from "@/components/blocks/section";
import type { BlockOf } from "@/lib/blocks";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";

export async function PostsBlock({ block }: { block: BlockOf<"posts"> }) {
  const dark = isDarkBackground(block.settings);

  const posts = await prisma.post
    .findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: block.data.limit,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImageUrl: true,
        publishedAt: true,
        readingMinutes: true,
        tags: true,
      },
    })
    .catch(() => []);

  if (posts.length === 0) return null;

  return (
    <Section settings={block.settings} defaultBackground="light">
      <SectionHeading
        heading={block.data.heading}
        description={block.data.description}
        dark={dark}
      />

      <div
        className={cn(
          "grid gap-6",
          block.data.columns === "2" ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/news/${post.slug}`}
            className={cn(
              "group flex flex-col overflow-hidden rounded-xl border transition-all",
              dark
                ? "border-navy-700 bg-navy-800/60 hover:border-accent-500/40"
                : "border-slate-200 bg-white hover:-translate-y-1 hover:shadow-lift",
            )}
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
              {post.coverImageUrl ? (
                <Image
                  src={post.coverImageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="bg-tech-grid-light size-full bg-slate-100" />
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-semibold",
                      dark
                        ? "bg-accent-500/15 text-accent-300"
                        : "bg-brand-50 text-brand-700",
                    )}
                  >
                    {tag}
                  </span>
                ))}
                <span className={dark ? "text-navy-400" : "text-slate-500"}>
                  {formatDate(post.publishedAt, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <h3
                className={cn(
                  "mt-3 text-[1.0625rem] font-bold leading-snug",
                  dark ? "text-white" : "text-navy-800",
                )}
              >
                {post.title}
              </h3>
              {post.excerpt && (
                <p
                  className={cn(
                    "mt-2 flex-1 text-sm leading-relaxed",
                    dark ? "text-navy-300" : "text-slate-600",
                  )}
                >
                  {post.excerpt}
                </p>
              )}
              <span
                className={cn(
                  "mt-4 inline-flex items-center gap-1.5 text-sm font-semibold",
                  dark ? "text-accent-400" : "text-brand-600",
                )}
              >
                Read article
                <ArrowUpRight
                  className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

export async function JobsBlock({ block }: { block: BlockOf<"jobs"> }) {
  const dark = isDarkBackground(block.settings);

  const jobs = await prisma.jobPosting
    .findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ closesAt: null }, { closesAt: { gte: new Date() } }],
      },
      orderBy: { postedAt: "desc" },
    })
    .catch(() => []);

  return (
    <Section settings={block.settings}>
      <SectionHeading
        heading={block.data.heading}
        description={block.data.description}
        dark={dark}
      />

      {jobs.length === 0 ? (
        <div
          className={cn(
            "rounded-xl border-2 border-dashed p-10 text-center text-sm",
            dark
              ? "border-navy-700 text-navy-400"
              : "border-slate-300 bg-slate-50 text-slate-500",
          )}
        >
          {block.data.emptyMessage}
        </div>
      ) : (
        <ul className="space-y-4">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/careers/${job.slug}`}
                className={cn(
                  "group flex flex-col gap-4 rounded-xl border p-5 transition-all sm:flex-row sm:items-center sm:justify-between",
                  dark
                    ? "border-navy-700 bg-navy-800/60 hover:border-accent-500/40"
                    : "border-slate-200 bg-white hover:border-brand-200 hover:shadow-card",
                )}
              >
                <div className="min-w-0">
                  <h3
                    className={cn(
                      "text-[1.0625rem] font-bold",
                      dark ? "text-white" : "text-navy-800",
                    )}
                  >
                    {job.title}
                  </h3>
                  <div
                    className={cn(
                      "mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm",
                      dark ? "text-navy-300" : "text-slate-600",
                    )}
                  >
                    {job.department && (
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="size-3.5" aria-hidden="true" />
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
                  </div>
                  {job.summary && (
                    <p
                      className={cn(
                        "mt-2.5 text-sm leading-relaxed",
                        dark ? "text-navy-300" : "text-slate-600",
                      )}
                    >
                      {job.summary}
                    </p>
                  )}
                </div>

                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold",
                    dark ? "text-accent-400" : "text-brand-600",
                  )}
                >
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
    </Section>
  );
}
