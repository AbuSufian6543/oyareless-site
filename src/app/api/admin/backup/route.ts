import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, stat, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { recordAudit } from "@/lib/audit";
import { AuthError, requireRole, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  BackupError,
  backupFilePath,
  createSiteBackup,
  keepIncomingBackup,
  restoreSiteBackupFromFile,
  restoreStoredSnapshot,
} from "@/lib/site-backup";
import {
  isBackupFileName,
  SITE_BACKUP_CONFIRM,
  SITE_BACKUP_MAX_BYTES,
} from "@/lib/site-backup-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 3600;

function fail(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}

async function superadmin() {
  try {
    return await requireRole("SUPERADMIN");
  } catch (error) {
    if (error instanceof AuthError && error.code === "UNAUTHENTICATED") {
      return fail(401, "Sign in as a super admin to manage backups.");
    }
    return fail(403, "Only a super admin can download or restore a site backup.");
  }
}

async function confirmRestore(userId: string, confirm: string, password: string) {
  if (confirm.trim() !== SITE_BACKUP_CONFIRM) {
    throw new BackupError(`Type ${SITE_BACKUP_CONFIRM} to replace the live site with a backup.`);
  }
  if (!password) {
    throw new BackupError("Enter your password to restore.");
  }
  const row = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!row || !(await verifyPassword(password, row.passwordHash))) {
    throw new BackupError("That password was not accepted.");
  }
}

export async function GET(request: Request) {
  const gate = await superadmin();
  if (gate instanceof NextResponse) return gate;
  const user = gate;

  const limit = rateLimit(`backup-download:${user.id}:${clientIp(request)}`, 6, 3600);
  if (!limit.allowed) {
    return fail(429, "Wait before downloading another backup.");
  }

  try {
    const snapshot = await createSiteBackup();
    await recordAudit({
      action: "backup.downloaded",
      userId: user.id,
      entityType: "SiteBackup",
      entityId: snapshot.name,
      summary: snapshot.name,
      details: { bytes: snapshot.bytes },
    });
    const file = createReadStream(backupFilePath(snapshot.name));
    return new NextResponse(Readable.toWeb(file) as ReadableStream, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${snapshot.name}"`,
        "Content-Length": String(snapshot.bytes),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof BackupError ? error.message : "The backup could not be created.";
    return fail(500, message);
  }
}

export async function POST(request: Request) {
  const gate = await superadmin();
  if (gate instanceof NextResponse) return gate;
  const user = gate;

  const limit = rateLimit(`backup-restore:${user.id}:${clientIp(request)}`, 4, 3600);
  if (!limit.allowed) {
    return fail(429, "Wait before running another restore.");
  }

  const type = (request.headers.get("content-type") ?? "").toLowerCase();

  try {
    if (type.includes("application/json")) {
      const body = (await request.json()) as {
        name?: string;
        confirm?: string;
        password?: string;
      };
      await confirmRestore(user.id, String(body.confirm ?? ""), String(body.password ?? ""));
      const name = String(body.name ?? "");
      if (!isBackupFileName(name)) {
        return fail(400, "Choose a backup that is already stored on this server.");
      }
      await restoreStoredSnapshot(name);
      await recordAudit({
        action: "backup.restored",
        userId: user.id,
        entityType: "SiteBackup",
        entityId: name,
        summary: `Restored ${name}`,
      });
      revalidatePath("/", "layout");
      return NextResponse.json({ ok: true, restored: name });
    }

    const confirm =
      request.headers.get("x-wc-confirm") ??
      "";
    const password = request.headers.get("x-wc-password") ?? "";
    await confirmRestore(user.id, confirm, password);

    if (!request.body) {
      return fail(400, "No backup file was received.");
    }

    const work = await mkdtemp(path.join(tmpdir(), "wc-upload-"));
    const temp = path.join(work, `incoming-${randomBytes(6).toString("hex")}.tar.gz`);
    let received = 0;
    const limitBytes = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        received += chunk.length;
        if (received > SITE_BACKUP_MAX_BYTES) {
          callback(new BackupError("That backup is larger than 2 GB."));
          return;
        }
        callback(null, chunk);
      },
    });

    try {
      await pipeline(
        Readable.fromWeb(request.body as Parameters<typeof Readable.fromWeb>[0]),
        limitBytes,
        createWriteStream(temp),
      );
      const info = await stat(temp);
      if (info.size < 24) {
        throw new BackupError("That file is too small to be a site backup.");
      }
      await restoreSiteBackupFromFile(temp);
      const stored = await keepIncomingBackup(temp);
      await recordAudit({
        action: "backup.restored",
        userId: user.id,
        entityType: "SiteBackup",
        entityId: stored,
        summary: `Restored uploaded ${stored}`,
      });
      revalidatePath("/", "layout");
      return NextResponse.json({ ok: true, restored: stored });
    } catch (error) {
      await unlink(temp).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    const message =
      error instanceof BackupError ? error.message : "The restore could not be completed.";
    const status =
      message.includes("password") || message.includes("RESTORE") ? 400 : 500;
    return fail(status, message);
  }
}
