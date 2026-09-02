import { notFound } from "next/navigation";
import { History, Trash2 } from "lucide-react";

import {
  deletePageAction,
  restoreRevisionAction,
} from "@/app/admin/pages/actions";
import { PageEditor, type PageEditorData } from "@/components/admin/page-editor";
import { Alert, Card, CardTitle } from "@/components/admin/ui";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { parseBlocks } from "@/lib/blocks";
import { parseSlideshow } from "@/lib/slideshow";
import { prisma } from "@/lib/prisma";
import { toStreamPickerOptions } from "@/lib/stream-picker";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Edit page" };

export default async function EditPagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ restored?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const [user, page, streams] = await Promise.all([
    getCurrentUser(),
    prisma.page.findUnique({
      where: { id },
      include: {
        revisions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { author: { select: { name: true } } },
        },
      },
    }),
    prisma.stream.findMany({
      orderBy: { title: "asc" },
      select: {
        slug: true,
        title: true,
        isPublic: true,
        accessPasswordHash: true,
      },
    }),
  ]);

  if (!page) notFound();

  const data: PageEditorData = {
    id: page.id,
    title: page.title,
    slug: page.slug,
    navLabel: page.navLabel ?? "",
    status: page.status,
    metaTitle: page.metaTitle ?? "",
    metaDescription: page.metaDescription ?? "",
    ogImageUrl: page.ogImageUrl ?? "",
    noIndex: page.noIndex,
    showInHeaderNav: page.showInHeaderNav,
    showInFooterNav: page.showInFooterNav,
    navOrder: page.navOrder,
    blocks: parseBlocks(page.blocks),
    slideshow: parseSlideshow(page.slideshow),
    isSystem: page.isSystem,
  };

  const canDelete = hasRole(user, "ADMIN") && !page.isSystem;

  return (
    <div>
      {query.restored && (
        <div className="mb-5">
          <Alert tone="success">
            The earlier version of this page has been restored.
          </Alert>
        </div>
      )}

      <PageEditor page={data} streams={toStreamPickerOptions(streams)} />

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle description="Every save keeps a snapshot so you can roll back a mistake.">
            Version history
          </CardTitle>

          {page.revisions.length === 0 ? (
            <p className="text-sm text-slate-500">
              No earlier versions yet. One is stored each time you save.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {page.revisions.map((revision) => (
                <li
                  key={revision.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold text-navy-800">
                      <History
                        className="size-3.5 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                      {formatDateTime(revision.createdAt)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {revision.title}
                      {revision.author?.name && ` · ${revision.author.name}`}
                    </p>
                  </div>
                  <form action={restoreRevisionAction}>
                    <input
                      type="hidden"
                      name="revisionId"
                      value={revision.id}
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-navy-800 transition-colors hover:bg-slate-50"
                    >
                      Restore
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {canDelete && (
          <Card className="border-red-200">
            <CardTitle description="Deleting a page is permanent. Set it to Archived instead if you may need it later.">
              Delete this page
            </CardTitle>
            <form action={deletePageAction}>
              <input type="hidden" name="pageId" value={page.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete “{page.title}”
              </button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
