import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hashIp, networkNameFor } from "@/lib/speedtest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ceilings are sanity checks, not capability claims: 10 Gbps is well beyond
 * anything measurable through a browser, so anything above it is a forged post
 * rather than a fast connection.
 */
const resultSchema = z.object({
  downloadMbps: z.number().min(0).max(10_000),
  uploadMbps: z.number().min(0).max(10_000),
  latencyMs: z.number().min(0).max(60_000),
  jitterMs: z.number().min(0).max(60_000),
});

/** Persists a completed run and returns the token its share link uses. */
export async function POST(request: Request) {
  const ip = clientIp(request);

  const limit = rateLimit(`speedtest-result:${ip}`, 20, 3600);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many results saved from this connection." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const parsed = resultSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Those results could not be read." },
      { status: 400 },
    );
  }

  const networkName = await networkNameFor(ip);

  try {
    const result = await prisma.speedTestResult.create({
      data: {
        shareToken: shareToken(),
        downloadMbps: round(parsed.data.downloadMbps),
        uploadMbps: round(parsed.data.uploadMbps),
        latencyMs: round(parsed.data.latencyMs),
        jitterMs: round(parsed.data.jitterMs),
        networkName,
        ipHash: hashIp(ip),
        userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      },
      select: { shareToken: true },
    });

    return NextResponse.json(
      { token: result.shareToken },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { message: "The result could not be saved." },
      { status: 500 },
    );
  }
}

/**
 * Short, URL-safe and unguessable enough for a link that only ever exposes four
 * throughput numbers. Ambiguous characters are excluded so a token can be read
 * down the phone.
 */
function shareToken(): string {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
