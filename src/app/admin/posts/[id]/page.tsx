import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deletePostAction } from "@/app/admin/posts/actions";
import { PostEditor, type PostEditorData } from "@/components/admin/post-editor";
import { Card, CardTitle } from "@/components/admin/ui";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { parseBlocks } from "@/lib/blocks";
import { prisma } from "@/lib/prisma";
import { toStreamPickerOptions } from "@/lib/stream-picker";

export const metadata = { title: "Edit article" };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, post, streams] = await Promise.all([
    getCurrentUser(),
    prisma.post.findUnique({ where: { id } }),
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

  if (!post) notFound();

  const data: PostEditorData = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    coverImageUrl: post.coverImageUrl ?? "",
    status: post.status,
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? "",
    tags: post.tags,
    blocks: parseBlocks(post.blocks),
  };

  return (
    <div>
      <PostEditor post={data} streams={toStreamPickerOptions(streams)} />

      {hasRole(user, "ADMIN") && (
        <Card className="mt-10 max-w-xl border-red-200">
          <CardTitle description="Deleting an article is permanent. Archive it instead to keep the record.">
            Delete this article
          </CardTitle>
          <form action={deletePostAction}>
            <input type="hidden" name="id" value={post.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete article
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
