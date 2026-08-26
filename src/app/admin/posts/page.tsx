import Link from "next/link";
import { Newspaper, Plus, SquarePen } from "lucide-react";

import {
  Alert,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "News & blog" };

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams;

  const posts = await prisma.post.findMany({
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { name: true } } },
  });

  return (
    <div>
      <PageHeader
        title="News & blog"
        description="Announcements, service updates and security advisories."
        actions={
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            New article
          </Link>
        }
      />

      {params.deleted && (
        <div className="mb-5">
          <Alert tone="success">The article was deleted.</Alert>
        </div>
      )}

      {posts.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Newspaper className="size-8" aria-hidden="true" />}
            title="No articles yet"
            description="Publishing regular updates helps customers and search rankings alike."
            action={
              <Link
                href="/admin/posts/new"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <Plus className="size-4" aria-hidden="true" />
                New article
              </Link>
            }
          />
        </Card>
      ) : (
        <DataTable headers={["Article", "Status", "Published", "Actions"]}>
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3.5">
                <Link
                  href={`/admin/posts/${post.id}`}
                  className="font-semibold text-navy-900 hover:text-brand-700"
                >
                  {post.title}
                </Link>
                <span className="mt-0.5 block text-xs text-slate-500">
                  /news/{post.slug}
                  {post.tags.length > 0 && ` · ${post.tags.join(", ")}`}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={post.status} />
              </td>
              <td className="px-4 py-3.5 text-slate-500">
                {post.publishedAt ? formatDate(post.publishedAt) : "—"}
                {post.author?.name && (
                  <span className="block text-xs text-slate-400">
                    by {post.author.name}
                  </span>
                )}
              </td>
              <td className="px-4 py-3.5">
                <Link
                  href={`/admin/posts/${post.id}`}
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
