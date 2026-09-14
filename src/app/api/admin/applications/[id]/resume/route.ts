import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { AuthError, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  contentDispositionName,
  resumeDiskPath,
} from "@/lib/resume-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("EDITOR");
    const { id } = await context.params;
    const download =
      new URL(request.url).searchParams.get("download") === "1";
    const application = await prisma.jobApplication.findUnique({
      where: { id },
      select: {
        originalName: true,
        storagePath: true,
      },
    });
    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const target = resumeDiskPath(application.storagePath);
    if (!target) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
      await stat(target);
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const filename = contentDispositionName(application.originalName);
    const stream = Readable.toWeb(createReadStream(target)) as ReadableStream;
    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
