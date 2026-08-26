import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";

import {
  deleteStreamAction,
  updateStreamAction,
} from "@/app/admin/streams/actions";
import { StreamForm } from "@/components/admin/stream-form";
import { Alert, Card, CardTitle, PageHeader } from "@/components/admin/ui";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Edit stream" };

const MESSAGES: Record<string, { tone: "success" | "danger"; text: string }> = {
  created: { tone: "success", text: "The stream was created." },
  saved: { tone: "success", text: "Changes saved." },
  invalid: {
    tone: "danger",
    text: "Please check the form — a title and source are required.",
  },
  duplicate: {
    tone: "danger",
    text: "Another stream already uses that slug.",
  },
};

export default async function EditStreamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const [user, stream] = await Promise.all([
    getCurrentUser(),
    prisma.stream.findUnique({ where: { id } }),
  ]);

  if (!stream) notFound();

  const messageKey = query.error ?? (query.created ? "created" : query.saved ? "saved" : null);
  const message = messageKey ? MESSAGES[messageKey] : null;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={stream.title}
        description={`Public address: /live/${stream.slug}`}
        breadcrumb={{ href: "/admin/streams", label: "Live streams" }}
        actions={
          <Link
            href={`/live/${stream.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            View
          </Link>
        }
      />

      {message && (
        <div className="mb-5">
          <Alert tone={message.tone}>{message.text}</Alert>
        </div>
      )}

      <StreamForm
        action={updateStreamAction}
        submitLabel="Save changes"
        values={{
          id: stream.id,
          title: stream.title,
          slug: stream.slug,
          description: stream.description ?? "",
          type: stream.type,
          source: stream.source,
          posterUrl: stream.posterUrl ?? "",
          location: stream.location ?? "",
          status: stream.status,
          aspectRatio: stream.aspectRatio,
          order: stream.order,
          isLive: stream.isLive,
          featured: stream.featured,
          isPublic: stream.isPublic,
          autoplay: stream.autoplay,
          muted: stream.muted,
          showControls: stream.showControls,
          hasPassword: Boolean(stream.accessPasswordHash),
        }}
      />

      {hasRole(user, "ADMIN") && (
        <Card className="mt-6 border-red-200">
          <CardTitle description="This cannot be undone. Any page embedding this stream will show an empty player.">
            Delete this stream
          </CardTitle>
          <form action={deleteStreamAction}>
            <input type="hidden" name="id" value={stream.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete stream
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
