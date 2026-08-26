import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteUpload } from "@/lib/uploads";

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
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireRole("ADMIN").catch(() => null);
  if (!user) {
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
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
