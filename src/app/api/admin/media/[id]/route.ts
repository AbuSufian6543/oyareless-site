import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUpload, replaceUpload, UploadError } from "@/lib/uploads";

export const runtime = "nodejs";

const patchSchema = z.object({
  altText: z.string().trim().max(300).optional(),
  folder: z
    .string()
    .trim()
    .max(40)
    .regex(/^[a-z0-9-]*$/, "Folders may only use lowercase letters and dashes.")
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole("EDITOR").catch(() => null);
  if (!user) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const asset = await prisma.mediaAsset.update({
    where: { id },
    data: {
      ...(parsed.data.altText !== undefined
        ? { altText: parsed.data.altText || null }
        : {}),
      ...(parsed.data.folder ? { folder: parsed.data.folder } : {}),
    },
    select: { id: true, altText: true, folder: true },
  });

  return NextResponse.json({ item: asset });
}

/**
 * Replace-in-place: new bytes, same URL, so every page already pointing at this
 * asset shows the new artwork without an editor hunting down references.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole("EDITOR").catch(() => null);
  if (!user) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { id: true, filename: true, originalName: true },
  });
  if (!existing) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { message: "The upload could not be read." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "No file received." }, { status: 400 });
  }

  try {
    const stored = await replaceUpload(existing.filename, file);

    const asset = await prisma.mediaAsset.update({
      where: { id },
      data: {
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        width: stored.width,
        height: stored.height,
        originalName: file.name.slice(0, 200),
      },
      select: {
        id: true,
        url: true,
        filename: true,
        originalName: true,
        altText: true,
        mimeType: true,
        sizeBytes: true,
        width: true,
        height: true,
        folder: true,
        createdAt: true,
      },
    });

    await recordAudit({
      action: "media.replaced",
      userId: user.id,
      entityType: "MediaAsset",
      entityId: id,
      summary: `${existing.originalName} → ${asset.originalName}`,
    });

    return NextResponse.json({ item: asset });
  } catch (caught) {
    if (caught instanceof UploadError) {
      return NextResponse.json({ message: caught.message }, { status: 400 });
    }
    console.error("[media] replace failed", caught);
    return NextResponse.json(
      { message: "The replacement failed. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole("ADMIN").catch(() => null);
  if (!user) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  await prisma.mediaAsset.delete({ where: { id } });
  await deleteUpload(asset.filename);

  await recordAudit({
    action: "media.deleted",
    userId: user.id,
    entityType: "MediaAsset",
    entityId: id,
    summary: asset.originalName,
  });

  return NextResponse.json({ ok: true });
}
