import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";

/**
 * Accepted upload types. Anything outside this list is rejected so the media
 * library can never be used to host executable or active content.
 */
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

/** Longest edge for stored raster images; keeps the disk footprint sane. */
const MAX_DIMENSION = 2560;

export type StoredUpload = {
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
};

export class UploadError extends Error {}

function uploadRoot(): string {
  // turbopackIgnore keeps the bundler from tracing the entire project into the
  // standalone output just because this path is resolved at runtime.
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), env.uploads.dir);
}

function safeBaseName(originalName: string): string {
  const base = path.basename(originalName, path.extname(originalName));
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return cleaned || "file";
}

/**
 * Writes an uploaded file to the uploads volume. Raster images are re-encoded
 * with sharp, which both strips metadata (EXIF/GPS) and neutralises files that
 * only pretend to be images.
 */
export async function storeUpload(
  file: File,
  folder = "general",
): Promise<StoredUpload> {
  if (file.size === 0) throw new UploadError("That file is empty.");
  if (file.size > env.uploads.maxBytes) {
    const limit = Math.round(env.uploads.maxBytes / (1024 * 1024));
    throw new UploadError(`Files must be smaller than ${limit} MB.`);
  }

  const declared = file.type.toLowerCase();
  const extension = ALLOWED_MIME[declared];
  if (!extension) {
    throw new UploadError(
      "Unsupported file type. Upload a JPG, PNG, WebP, AVIF, GIF, SVG or PDF.",
    );
  }

  const directory = path.join(/* turbopackIgnore: true */ uploadRoot(), sanitiseFolder(folder));
  await mkdir(directory, { recursive: true });

  const stem = `${safeBaseName(file.name)}-${randomBytes(4).toString("hex")}`;
  let buffer = Buffer.from(await file.arrayBuffer());
  let width: number | null = null;
  let height: number | null = null;
  let mimeType = declared;
  let outputExtension = extension;

  const isRaster =
    declared.startsWith("image/") && declared !== "image/svg+xml";

  if (isRaster) {
    const { default: sharp } = await import("sharp");
    const image = sharp(buffer, { animated: declared === "image/gif" });
    const metadata = await image.metadata().catch(() => null);
    if (!metadata?.width) {
      throw new UploadError("That image could not be read.");
    }

    const needsResize =
      (metadata.width ?? 0) > MAX_DIMENSION ||
      (metadata.height ?? 0) > MAX_DIMENSION;

    let pipeline = image.rotate();
    if (needsResize) {
      pipeline = pipeline.resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    if (declared === "image/gif") {
      pipeline = pipeline.gif();
    } else if (declared === "image/png") {
      pipeline = pipeline.png({ compressionLevel: 9 });
    } else if (declared === "image/avif") {
      pipeline = pipeline.avif({ quality: 62 });
    } else if (declared === "image/webp") {
      pipeline = pipeline.webp({ quality: 84 });
    } else {
      pipeline = pipeline.jpeg({ quality: 84, mozjpeg: true });
      mimeType = "image/jpeg";
      outputExtension = "jpg";
    }

    const result = await pipeline.toBuffer({ resolveWithObject: true });
    buffer = result.data;
    width = result.info.width;
    height = result.info.height;
  } else if (declared === "image/svg+xml") {
    assertSafeSvg(buffer.toString("utf8"));
  }

  const filename = `${stem}.${outputExtension}`;
  await writeFile(path.join(directory, filename), buffer);

  const relative = `${sanitiseFolder(folder)}/${filename}`;
  return {
    filename: relative,
    url: `/uploads/${relative}`,
    mimeType,
    sizeBytes: buffer.byteLength,
    width,
    height,
  };
}

export async function deleteUpload(filename: string): Promise<void> {
  const target = path.resolve(/* turbopackIgnore: true */ uploadRoot(), filename);
  // Guard against traversal in stored filenames.
  if (!target.startsWith(uploadRoot())) return;
  await unlink(target).catch(() => undefined);
}

function sanitiseFolder(folder: string): string {
  const cleaned = folder.toLowerCase().replace(/[^a-z0-9-]/g, "");
  return cleaned || "general";
}

/**
 * SVGs are stored verbatim, so refuse any that carry scripts, event handlers or
 * external references.
 */
function assertSafeSvg(markup: string): void {
  const lowered = markup.toLowerCase();
  const banned = [
    "<script",
    "<foreignobject",
    "javascript:",
    "onload=",
    "onerror=",
    "onclick=",
    "<!entity",
    "<iframe",
    "<embed",
    "<use xlink:href=\"http",
  ];
  if (banned.some((needle) => lowered.includes(needle))) {
    throw new UploadError(
      "That SVG contains scripting or external references and was rejected.",
    );
  }
}
