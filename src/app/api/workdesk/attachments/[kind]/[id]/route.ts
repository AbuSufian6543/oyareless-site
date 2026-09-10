import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getPortalUser } from "@/lib/portal-auth";
import { diskPathFromUploadUrl } from "@/lib/workdesk/attachments";
import {
  assertTaskAccess,
  assertTicketAccess,
  requireWorkdeskStaff,
} from "@/lib/workdesk/access";

export const dynamic = "force-dynamic";

function uploadRoot(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), env.uploads.dir);
}

async function streamStoredFile(url: string, filename: string, mimeType: string) {
  const relative = diskPathFromUploadUrl(url);
  if (!relative) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const target = path.resolve(uploadRoot(), relative);
  if (!target.startsWith(uploadRoot())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    await stat(target);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const stream = Readable.toWeb(createReadStream(target)) as ReadableStream;
  return new NextResponse(stream, {
    headers: {
      "Content-Type": mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await context.params;

  try {
    if (kind === "ticket") {
      const attachment = await prisma.ticketAttachment.findUnique({
        where: { id },
        include: { message: { select: { ticketId: true, isInternal: true } } },
      });
      if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const portal = await getPortalUser();
      if (portal) {
        if (attachment.message.isInternal) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const ticket = await prisma.ticket.findUnique({
          where: { id: attachment.message.ticketId },
          select: { customerId: true },
        });
        if (!ticket || ticket.customerId !== portal.customerId) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return streamStoredFile(attachment.url, attachment.filename, attachment.mimeType);
      }

      const staff = await requireWorkdeskStaff();
      await assertTicketAccess(staff, attachment.message.ticketId);
      return streamStoredFile(attachment.url, attachment.filename, attachment.mimeType);
    }

    if (kind === "task") {
      const attachment = await prisma.internalTaskAttachment.findUnique({
        where: { id },
      });
      if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const staff = await requireWorkdeskStaff();
      await assertTaskAccess(staff, attachment.taskId);
      return streamStoredFile(attachment.url, attachment.filename, attachment.mimeType);
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
