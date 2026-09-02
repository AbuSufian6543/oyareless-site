import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { env } from "@/lib/env";

/**
 * Canonical MIME → stored extension. Anything outside this list is rejected so
 * the media library can never be used to host executable or active content.
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

/** Browser aliases that should be treated as a canonical type above. */
const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "image/x-webp": "image/webp",
};

/** Used when the browser sends an empty `file.type` (common on Windows). */
const EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
};

const UNSUPPORTED_TYPE_MESSAGE =
  "Unsupported file type. Upload a JPG, PNG, WebP, AVIF, GIF, SVG or PDF. iPhone HEIC photos and video files are not accepted — add promo videos as a YouTube or Vimeo link.";

function resolveMimeType(file: File): string | null {
  const declared = file.type.toLowerCase().trim();
  if (declared) {
    const canonical = MIME_ALIASES[declared] ?? declared;
    if (ALLOWED_MIME[canonical]) return canonical;
  }

  const extension = path.extname(file.name).toLowerCase().replace(".", "");
  return EXTENSION_MIME[extension] ?? null;
}

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

type PreparedUpload = {
  buffer: Buffer;
  mimeType: string;
  extension: string;
  width: number | null;
  height: number | null;
};

/**
 * Validates and re-encodes an upload without writing it anywhere.
 *
 * Raster images go through sharp, which both strips metadata (EXIF/GPS) and
 * neutralises files that only pretend to be images.
 */
async function prepareUpload(file: File): Promise<PreparedUpload> {
  if (file.size === 0) throw new UploadError("That file is empty.");
  if (file.size > env.uploads.maxBytes) {
    const limit = Math.round(env.uploads.maxBytes / (1024 * 1024));
    throw new UploadError(`Files must be smaller than ${limit} MB.`);
  }

  const declared = resolveMimeType(file);
  const extension = declared ? ALLOWED_MIME[declared] : undefined;
  if (!declared || !extension) {
    throw new UploadError(UNSUPPORTED_TYPE_MESSAGE);
  }

  let buffer = Buffer.from(await file.arrayBuffer());
  let width: number | null = null;
  let height: number | null = null;
  let mimeType = declared;
  let outputExtension = extension;

  const isRaster = declared.startsWith("image/") && declared !== "image/svg+xml";

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

  return { buffer, mimeType, extension: outputExtension, width, height };
}

/** Writes an uploaded file to the uploads volume under a fresh filename. */
export async function storeUpload(
  file: File,
  folder = "general",
): Promise<StoredUpload> {
  const prepared = await prepareUpload(file);

  const directory = path.join(
    /* turbopackIgnore: true */ uploadRoot(),
    sanitiseFolder(folder),
  );
  await mkdir(directory, { recursive: true });

  const stem = `${safeBaseName(file.name)}-${randomBytes(4).toString("hex")}`;
  const filename = `${stem}.${prepared.extension}`;
  await writeFile(path.join(directory, filename), prepared.buffer);

  const relative = `${sanitiseFolder(folder)}/${filename}`;
  return {
    filename: relative,
    url: `/uploads/${relative}`,
    mimeType: prepared.mimeType,
    sizeBytes: prepared.buffer.byteLength,
    width: prepared.width,
    height: prepared.height,
  };
}

/**
 * Overwrites an existing asset's bytes, keeping its path and therefore its URL.
 *
 * The point of replace-in-place is that pages already referencing the old URL
 * pick up the new artwork, so a format change that would alter the extension is
 * refused rather than silently breaking every reference.
 */
export async function replaceUpload(
  existingFilename: string,
  file: File,
): Promise<Omit<StoredUpload, "filename" | "url">> {
  const target = path.resolve(
    /* turbopackIgnore: true */ uploadRoot(),
    existingFilename,
  );
  if (!target.startsWith(uploadRoot())) {
    throw new UploadError("That file is outside the uploads directory.");
  }

  const prepared = await prepareUpload(file);
  const currentExtension = path.extname(existingFilename).replace(".", "").toLowerCase();

  if (currentExtension !== prepared.extension) {
    throw new UploadError(
      `The replacement must be a .${currentExtension} file so the existing address keeps working. Upload a new file instead if you need a different format.`,
    );
  }

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, prepared.buffer);

  return {
    mimeType: prepared.mimeType,
    sizeBytes: prepared.buffer.byteLength,
    width: prepared.width,
    height: prepared.height,
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
