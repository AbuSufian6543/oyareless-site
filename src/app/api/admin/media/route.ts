import { NextResponse } from "next/server";

import { recordAudit } from "@/lib/audit";
import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storeUpload, UploadError } from "@/lib/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MEDIA_FIELDS = {
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
} as const;

export async function GET(request: Request) {
  const guard = await authorise("EDITOR");
  if (guard) return guard;

  const url = new URL(request.url);
  const folder = url.searchParams.get("folder");
  const query = url.searchParams.get("q")?.trim();

  const items = await prisma.mediaAsset.findMany({
    where: {
      ...(folder && folder !== "all" ? { folder } : {}),
      ...(query
        ? {
            OR: [
              { originalName: { contains: query, mode: "insensitive" as const } },
              { altText: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: MEDIA_FIELDS,
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await requireRole("EDITOR").catch(() => null);
  if (!user) {
    return NextResponse.json({ message: "Not authorised." }, { status: 401 });
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

  const folder = String(formData.get("folder") ?? "general");
  const altText = String(formData.get("altText") ?? "").trim();

  try {
    const stored = await storeUpload(file, folder);

    const asset = await prisma.mediaAsset.create({
      data: {
        filename: stored.filename,
        originalName: file.name.slice(0, 200),
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        width: stored.width,
        height: stored.height,
        url: stored.url,
        altText: altText || null,
        folder: folder.toLowerCase().replace(/[^a-z0-9-]/g, "") || "general",
        uploadedById: user.id,
      },
      select: MEDIA_FIELDS,
    });

    await recordAudit({
      action: "media.uploaded",
      userId: user.id,
      entityType: "MediaAsset",
      entityId: asset.id,
      summary: asset.originalName,
    });

    return NextResponse.json({ item: asset }, { status: 201 });
  } catch (caught) {
    if (caught instanceof UploadError) {
      return NextResponse.json({ message: caught.message }, { status: 400 });
    }
    console.error("[media] upload failed", caught);
    return NextResponse.json(
      { message: "The upload failed. Please try again." },
      { status: 500 },
    );
  }
}

async function authorise(role: "EDITOR" | "ADMIN"): Promise<Response | null> {
  try {
    await requireRole(role);
    return null;
  } catch (caught) {
    const status =
      caught instanceof AuthError && caught.code === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ message: "Not authorised." }, { status });
  }
}
