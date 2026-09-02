import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StreamCard } from "@/components/blocks/stream-blocks";
import { prisma } from "@/lib/prisma";
import { publicMetadata } from "@/lib/seo";
import { getStreamAccess } from "@/lib/streams";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const stream = await prisma.stream
    .findFirst({
      where: { slug, status: "PUBLISHED" },
      select: { title: true, description: true, isPublic: true },
    })
    .catch(() => null);

  if (!stream) return { title: "Stream Not Found" };

  return {
    ...publicMetadata({
      title: stream.title,
      description: stream.description || `${stream.title} live video from WirelessCom.Ca Inc.`,
      path: `/live/${slug}`,
      index: stream.isPublic,
      follow: stream.isPublic,
    }),
  };
}

export default async function StreamPage({ params }: Props) {
  const { slug } = await params;
  const access = await getStreamAccess(slug);

  if (access.state === "missing") notFound();

  const title = access.state === "ok" ? access.stream.title : access.title;

  return (
    <section className="bg-navy-900 py-12 lg:py-16">
      <div className="container-page">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/live"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400 hover:text-accent-300"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            All streams
          </Link>

          <h1 className="mt-4 mb-7 text-balance-tight text-3xl text-white lg:text-4xl">
            {title}
          </h1>

          <StreamCard access={access} showTitle={false} />

          {access.state === "ok" && (
            <div className="mt-6 space-y-2">
              {access.stream.location && (
                <p className="text-sm text-navy-300">
                  Location: {access.stream.location}
                </p>
              )}
              {access.stream.description && (
                <p className="leading-relaxed text-navy-200">
                  {access.stream.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
