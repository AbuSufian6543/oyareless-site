"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { hashPassword, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const STREAM_TYPES = [
  "HLS",
  "DASH",
  "YOUTUBE",
  "VIMEO",
  "TWITCH",
  "FACEBOOK",
  "IFRAME",
  "MJPEG",
  "WEBRTC",
  "HTML",
] as const;

const streamSchema = z.object({
  title: z.string().trim().min(1, "Give the stream a title.").max(160),
  slug: z.string().trim().max(160).optional(),
  description: z.string().trim().max(1000).optional(),
  type: z.enum(STREAM_TYPES),
  source: z.string().trim().min(1, "A source URL or embed is required.").max(50_000),
  posterUrl: z.string().trim().max(500).optional(),
  location: z.string().trim().max(160).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  aspectRatio: z.string().trim().max(12).default("16/9"),
  order: z.coerce.number().int().min(0).max(999).default(0),
  isLive: z.coerce.boolean().default(false),
  featured: z.coerce.boolean().default(false),
  isPublic: z.coerce.boolean().default(false),
  autoplay: z.coerce.boolean().default(false),
  muted: z.coerce.boolean().default(false),
  showControls: z.coerce.boolean().default(false),
});

function readForm(formData: FormData) {
  const checkbox = (name: string) => formData.get(name) === "on";
  return streamSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug") ?? "",
    description: formData.get("description") ?? "",
    type: formData.get("type"),
    source: formData.get("source"),
    posterUrl: formData.get("posterUrl") ?? "",
    location: formData.get("location") ?? "",
    status: formData.get("status"),
    aspectRatio: formData.get("aspectRatio") || "16/9",
    order: formData.get("order") ?? 0,
    isLive: checkbox("isLive"),
    featured: checkbox("featured"),
    isPublic: checkbox("isPublic"),
    autoplay: checkbox("autoplay"),
    muted: checkbox("muted"),
    showControls: checkbox("showControls"),
  });
}

export async function createStreamAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");
  const parsed = readForm(formData);
  if (!parsed.success) redirect("/admin/streams/new?error=invalid");

  const data = parsed.data;
  let slug = slugify(data.slug || data.title) || `stream-${Date.now()}`;
  let attempt = 2;
  while (await prisma.stream.findUnique({ where: { slug } })) {
    slug = `${slug}-${attempt}`;
    attempt += 1;
  }

  const password = String(formData.get("accessPassword") ?? "").trim();

  const stream = await prisma.stream.create({
    data: {
      slug,
      title: data.title,
      description: data.description || null,
      type: data.type,
      source: data.source,
      posterUrl: data.posterUrl || null,
      location: data.location || null,
      status: data.status,
      aspectRatio: data.aspectRatio,
      order: data.order,
      isLive: data.isLive,
      featured: data.featured,
      isPublic: data.isPublic,
      autoplay: data.autoplay,
      muted: data.muted,
      showControls: data.showControls,
      accessPasswordHash: password ? await hashPassword(password) : null,
    },
  });

  await recordAudit({
    action: "stream.created",
    userId: user.id,
    entityType: "Stream",
    entityId: stream.id,
    summary: stream.title,
  });

  revalidatePath("/live");
  revalidatePath(`/live/${slug}`);
  revalidatePath("/video-services");
  revalidatePath("/live-video-broadcasting");
  revalidatePath("/", "layout");
  redirect(`/admin/streams/${stream.id}?created=1`);
}

export async function updateStreamAction(formData: FormData): Promise<void> {
  const user = await requireRole("EDITOR");
  const id = String(formData.get("id") ?? "");
  const parsed = readForm(formData);
  if (!parsed.success) redirect(`/admin/streams/${id}?error=invalid`);

  const existing = await prisma.stream.findUnique({ where: { id } });
  if (!existing) redirect("/admin/streams");

  const data = parsed.data;
  const slug =
    slugify(data.slug || data.title) || existing.slug;

  if (slug !== existing.slug) {
    const clash = await prisma.stream.findUnique({ where: { slug } });
    if (clash) redirect(`/admin/streams/${id}?error=duplicate`);
  }

  const password = String(formData.get("accessPassword") ?? "").trim();
  const clearPassword = formData.get("clearPassword") === "on";

  await prisma.stream.update({
    where: { id },
    data: {
      slug,
      title: data.title,
      description: data.description || null,
      type: data.type,
      source: data.source,
      posterUrl: data.posterUrl || null,
      location: data.location || null,
      status: data.status,
      aspectRatio: data.aspectRatio,
      order: data.order,
      isLive: data.isLive,
      featured: data.featured,
      isPublic: data.isPublic,
      autoplay: data.autoplay,
      muted: data.muted,
      showControls: data.showControls,
      ...(clearPassword
        ? { accessPasswordHash: null }
        : password
          ? { accessPasswordHash: await hashPassword(password) }
          : {}),
    },
  });

  await recordAudit({
    action: "stream.updated",
    userId: user.id,
    entityType: "Stream",
    entityId: id,
    summary: data.title,
  });

  revalidatePath("/live");
  revalidatePath(`/live/${slug}`);
  revalidatePath("/video-services");
  revalidatePath("/live-video-broadcasting");
  revalidatePath("/", "layout");
  redirect(`/admin/streams/${id}?saved=1`);
}

export async function deleteStreamAction(formData: FormData): Promise<void> {
  const user = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");

  const stream = await prisma.stream.findUnique({ where: { id } });
  if (!stream) redirect("/admin/streams");

  await prisma.stream.delete({ where: { id } });

  await recordAudit({
    action: "stream.deleted",
    userId: user.id,
    entityType: "Stream",
    entityId: id,
    summary: stream.title,
  });

  revalidatePath("/live");
  revalidatePath("/video-services");
  revalidatePath("/live-video-broadcasting");
  revalidatePath("/", "layout");
  redirect("/admin/streams?deleted=1");
}
