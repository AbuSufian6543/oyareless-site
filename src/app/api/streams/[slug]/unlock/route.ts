import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { issueStreamUnlock } from "@/lib/streams";

const schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ip = clientIp(request);

  // Password guessing protection, keyed per stream and per IP.
  const limit = rateLimit(`stream-unlock:${slug}:${ip}`, 10, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { message: "Too many attempts. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please enter the password." },
      { status: 400 },
    );
  }

  const stream = await prisma.stream
    .findFirst({
      where: { slug, status: "PUBLISHED" },
      select: { accessPasswordHash: true },
    })
    .catch(() => null);

  if (!stream?.accessPasswordHash) {
    return NextResponse.json(
      { message: "This stream is not available." },
      { status: 404 },
    );
  }

  const matches = await bcrypt.compare(
    parsed.data.password,
    stream.accessPasswordHash,
  );

  if (!matches) {
    return NextResponse.json({ message: "Incorrect password." }, { status: 401 });
  }

  await issueStreamUnlock(slug);
  return NextResponse.json({ ok: true });
}
