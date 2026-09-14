import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { RESUME_MAX_BYTES, RESUME_MAX_MB } from "@/lib/careers";
import { env } from "@/lib/env";
import { UploadError } from "@/lib/uploads";

const PDF_MAGIC = Buffer.from("%PDF-", "latin1");

/**
 * Names that mean the PDF can run code, open local files, or embed other
 * files. A legitimate résumé should not need any of these. The cap is 3 MB,
 * so scanning the whole buffer is cheap.
 */
const DANGEROUS_PDF_TOKENS = [
  "/JavaScript",
  "/JS ",
  "/JS(",
  "/JS[",
  "/Launch",
  "/RichMedia",
  "/OpenAction",
  "/EmbeddedFile",
  "/SubmitForm",
  "/ImportData",
];

export type PreparedResume = {
  buffer: Buffer;
  originalName: string;
  sha256: string;
  sizeBytes: number;
};

function uploadRoot(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), env.uploads.dir);
}

function sanitiseDownloadName(originalName: string): string {
  const base = path.basename(originalName).replace(/[^\w.\- ()[\]]+/g, "_");
  const trimmed = base.slice(0, 80).trim() || "resume.pdf";
  return trimmed.toLowerCase().endsWith(".pdf") ? trimmed : `${trimmed}.pdf`;
}

/**
 * PDF-only, 3 MB, magic-byte check, and a conservative scan for active content.
 * The stored filename is random — the visitor's name is kept only in the database.
 */
export async function prepareResumePdf(file: File): Promise<PreparedResume> {
  if (!(file instanceof File) || file.size === 0) {
    throw new UploadError("Please attach a PDF résumé.");
  }
  if (file.size > RESUME_MAX_BYTES) {
    throw new UploadError(`Résumés must be a PDF smaller than ${RESUME_MAX_MB} MB.`);
  }

  const declared = file.type.toLowerCase().trim();
  if (declared && declared !== "application/pdf" && declared !== "application/x-pdf") {
    throw new UploadError("Please upload a PDF file.");
  }

  const extension = path.extname(file.name).toLowerCase();
  if (extension && extension !== ".pdf") {
    throw new UploadError("Please upload a PDF file.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0 || buffer.length > RESUME_MAX_BYTES) {
    throw new UploadError(`Résumés must be a PDF smaller than ${RESUME_MAX_MB} MB.`);
  }
  if (buffer.length < PDF_MAGIC.length || !buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    throw new UploadError("That file is not a valid PDF.");
  }

  const haystack = buffer.toString("latin1");
  if (DANGEROUS_PDF_TOKENS.some((token) => haystack.includes(token))) {
    throw new UploadError(
      "That PDF contains active content and was rejected. Please export a static PDF and try again.",
    );
  }

  return {
    buffer,
    originalName: sanitiseDownloadName(file.name),
    sha256: createHash("sha256").update(buffer).digest("hex"),
    sizeBytes: buffer.length,
  };
}

export async function storePrivateResume(buffer: Buffer): Promise<string> {
  const directory = path.join(
    /* turbopackIgnore: true */ uploadRoot(),
    "private",
    "resumes",
  );
  await mkdir(directory, { recursive: true });

  const filename = `${randomBytes(16).toString("hex")}.pdf`;
  const target = path.join(directory, filename);
  await writeFile(target, buffer, { flag: "wx" });
  return `private/resumes/${filename}`;
}

export function resumeDiskPath(storagePath: string): string | null {
  if (!storagePath.startsWith("private/resumes/")) return null;
  if (storagePath.includes("..") || storagePath.includes("\\") || storagePath.includes("\0")) {
    return null;
  }
  const root = uploadRoot();
  const target = path.resolve(/* turbopackIgnore: true */ root, storagePath);
  const prefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (target !== root && !target.startsWith(prefix)) return null;
  return target;
}

export async function deletePrivateResume(storagePath: string): Promise<void> {
  const target = resumeDiskPath(storagePath);
  if (!target) return;
  await unlink(target).catch(() => undefined);
}

export function contentDispositionName(originalName: string): string {
  return sanitiseDownloadName(originalName).replace(/"/g, "");
}
