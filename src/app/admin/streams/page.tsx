import Link from "next/link";
import { Lock, Plus, Radio, SquarePen } from "lucide-react";

import {
  Alert,
  Badge,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Live streams" };

export default async function AdminStreamsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams;

  const streams = await prisma.stream.findMany({
    orderBy: [{ order: "asc" }, { title: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Live streams"
        description="Cameras and live video that can be embedded on any page."
        actions={
          <Link
            href="/admin/streams/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add stream
          </Link>
        }
      />

      {params.deleted && (
        <div className="mb-5">
          <Alert tone="success">The stream was deleted.</Alert>
        </div>
      )}

      {streams.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Radio className="size-8" aria-hidden="true" />}
            title="No streams configured"
            description="Add an HLS camera, a YouTube live event, or paste a Mist / VideoStreamCanada player snippet."
            action={
              <Link
                href="/admin/streams/new"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <Plus className="size-4" aria-hidden="true" />
                Add stream
              </Link>
            }
          />
        </Card>
      ) : (
        <DataTable
          headers={["Stream", "Type", "Status", "Access", "Actions"]}
        >
          {streams.map((stream) => (
            <tr key={stream.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3.5">
                <Link
                  href={`/admin/streams/${stream.id}`}
                  className="font-semibold text-navy-900 hover:text-brand-700"
                >
                  {stream.title}
                </Link>
                <span className="mt-0.5 block text-xs text-slate-500">
                  /live/{stream.slug}
                  {stream.location ? ` · ${stream.location}` : ""}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <span className="font-mono text-xs text-slate-600">
                  {stream.type}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={stream.status} />
                  {stream.isLive && stream.status === "PUBLISHED" && (
                    <Badge tone="danger">Live</Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {stream.accessPasswordHash && (
                    <Badge tone="warning">
                      <Lock className="size-3" aria-hidden="true" />
                      Password
                    </Badge>
                  )}
                  {!stream.isPublic && <Badge tone="neutral">Unlisted</Badge>}
                  {stream.isPublic && !stream.accessPasswordHash && (
                    <span className="text-xs text-slate-500">Public</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3.5">
                <Link
                  href={`/admin/streams/${stream.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-navy-800 transition-colors hover:bg-white"
                >
                  <SquarePen className="size-3.5" aria-hidden="true" />
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
