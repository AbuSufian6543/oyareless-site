import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  LEGACY_WEEBLY_LOGO_FILE,
  LEGACY_WEEBLY_LOGO_PATH,
} from "@/lib/legacy-weebly-logo";

export const runtime = "nodejs";

const JPEG_HEADERS = {
  "Content-Type": "image/jpeg",
  "Content-Disposition": 'inline; filename="416823.jpg"',
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
  "X-Content-Type-Options": "nosniff",
};

function logoPath() {
  return path.join(
    process.cwd(),
    "public",
    LEGACY_WEEBLY_LOGO_FILE.replace(/^\//, ""),
  );
}

async function jpegResponse(includeBody: boolean) {
  const file = await readFile(logoPath());
  return new NextResponse(includeBody ? file : null, {
    status: 200,
    headers: {
      ...JPEG_HEADERS,
      "Content-Length": String(file.byteLength),
    },
  });
}

export async function GET() {
  try {
    return await jpegResponse(true);
  } catch {
    return NextResponse.json(
      { error: `Missing ${LEGACY_WEEBLY_LOGO_PATH}` },
      { status: 404 },
    );
  }
}

export async function HEAD() {
  try {
    return await jpegResponse(false);
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: JPEG_HEADERS,
  });
}
