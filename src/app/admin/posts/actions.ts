"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { blocksSchema } from "@/lib/blocks";
import { prisma } from "@/lib/prisma";
import { readingMinutes, slugify, stripHtml } from "@/lib/utils";

const postPayload = z.object({
  title: z.string().trim().min(1, "A title is required.").max(200),
  slug: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  coverImageUrl: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  metaTitle: z.string().trim().max(200).optional().or(z.literal("")),
  metaDescription: z.string().trim().max(400).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  blocks: z.unknown(),
});

export type SavePostResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function savePostAction(
  postId: string,
  payload: unknown,
): Promise<SavePostResult> {
  const user = await requireRole("EDITOR").catch(() => null);
  if (!user) return { ok: false, error: "You are not signed in." };

  const parsed = postPayload.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Some fields are invalid.",
    };
  }

  const blocks = blocksSchema.safeParse(parsed.data.blocks);
  if (!blocks.success) {
    return { ok: false, error: "Some sections contain invalid values." };
  }

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) return { ok: false, error: "This article no longer exists." };

  const data = parsed.data;
  const slug = slugify(data.slug) || existing.slug;

  if (slug !== existing.slug) {
    const clash = await prisma.post.findUnique({ where: { slug } });
    if (clash) return { ok: false, error: `Another article uses "/${slug}".` };
  }

  const bodyText = blocks.data
    .map((block) => {
      const record = block.data as Record<string, unknown>;
      return typeof record.html === "string" ? stripHtml(record.html) : "";
    })
    .join(" ");

  const becomingPublished =
    data.status === "PUBLISHED" && existing.status !== "PUBLISHED";

  await prisma.post.update({
    where: { id: postId },
    data: {
      title: data.title,
      slug,
      excerpt: data.excerpt || null,
      coverImageUrl: data.coverImageUrl || null,
      status: data.status,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      tags: data.tags,
      blocks: blocks.data as never,
      readingMinutes: readingMinutes(bodyText),
      publishedAt:
        becomingPublished && !existing.publishedAt
          ? new Date()
          : existing.publishedAt,
      authorId: existing.authorId ?? user.id,
    },
  });

  await recordAudit({
    action: "post.updated",
    userId: user.id,
    entityType: "Post",
    entityId: postId,
    summary: data.title,
  });

  revalidatePath("/news");
  revalidatePath(`/news/${slug}`);

  return { ok: true, slug };
}

export async function createPostAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) redirect("/admin/posts/new?error=title");

  let slug = slugify(String(formData.get("slug") ?? "") || title);
  let attempt = 2;
  while (await prisma.post.findUnique({ where: { slug } })) {
    slug = `${slug}-${attempt}`;
    attempt += 1;
  }

  const post = await prisma.post.create({
    data: {
      title,
      slug,
      status: "DRAFT",
      excerpt: String(formData.get("excerpt") ?? "").trim() || null,
      blocks: [
        {
          id: `b_${Math.random().toString(36).slice(2, 10)}`,
          type: "richText",
          settings: {},
          data: { html: "<p>Write the article here.</p>", columns: "1" },
        },
      ] as never,
      authorId: user.id,
    },
  });

  await recordAudit({
    action: "post.created",
    userId: user.id,
    entityType: "Post",
    entityId: post.id,
    summary: title,
  });

  redirect(`/admin/posts/${post.id}`);
}

export async function deletePostAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) redirect("/admin/posts");

  await prisma.post.delete({ where: { id } });

  await recordAudit({
    action: "post.deleted",
    userId: user.id,
    entityType: "Post",
    entityId: id,
    summary: post.title,
  });

  revalidatePath("/news");
  redirect("/admin/posts?deleted=1");
}
