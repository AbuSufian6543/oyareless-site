import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { Stream, StreamType } from "@/generated/prisma/client";

/** Shape sent to the client. Never includes the password hash. */
export type PublicStream = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: StreamType;
  source: string;
  posterUrl: string | null;
  location: string | null;
  isLive: boolean;
  autoplay: boolean;
  muted: boolean;
  showControls: boolean;
  aspectRatio: string;
};

export type StreamAccess =
  | { state: "ok"; stream: PublicStream }
  | { state: "locked"; slug: string; title: string; description: string | null }
  | { state: "missing" };

function unlockCookieName(slug: string): string {
  return `wc_stream_${slug.replace(/[^a-z0-9_-]/gi, "")}`;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env.authSecret);
}

export async function issueStreamUnlock(slug: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 12 * 3_600_000);
  const token = await new SignJWT({ slug, scope: "stream" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("wirelesscom.ca")
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(unlockCookieName(slug), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction && !env.allowInsecureCookies,
    path: "/",
    expires: expiresAt,
  });
}

async function hasStreamUnlock(slug: string): Promise<boolean> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(unlockCookieName(slug))?.value;
  if (!raw) return false;
  try {
    const { payload } = await jwtVerify(raw, secretKey(), {
      issuer: "wirelesscom.ca",
    });
    return payload.scope === "stream" && payload.slug === slug;
  } catch {
    return false;
  }
}

function toPublicStream(stream: Stream): PublicStream {
  return {
    id: stream.id,
    slug: stream.slug,
    title: stream.title,
    description: stream.description,
    type: stream.type,
    source: stream.source,
    posterUrl: stream.posterUrl,
    location: stream.location,
    isLive: stream.isLive,
    autoplay: stream.autoplay,
    muted: stream.muted,
    showControls: stream.showControls,
    aspectRatio: stream.aspectRatio,
  };
}

/**
 * Resolves a stream for public display. Protected streams return `locked`
 * without the source URL until the visitor supplies the password, so the
 * camera endpoint is never exposed in the HTML.
 */
export async function getStreamAccess(slug: string): Promise<StreamAccess> {
  const stream = await prisma.stream
    .findFirst({ where: { slug, status: "PUBLISHED" } })
    .catch(() => null);

  if (!stream) return { state: "missing" };

  const needsPassword = Boolean(stream.accessPasswordHash) || !stream.isPublic;
  if (needsPassword && !(await hasStreamUnlock(slug))) {
    return {
      state: "locked",
      slug: stream.slug,
      title: stream.title,
      description: stream.description,
    };
  }

  return { state: "ok", stream: toPublicStream(stream) };
}

export async function listStreamAccess(options: {
  slugs?: string[];
  featuredOnly?: boolean;
  limit?: number;
}): Promise<StreamAccess[]> {
  const streams = await prisma.stream
    .findMany({
      where: {
        status: "PUBLISHED",
        ...(options.slugs && options.slugs.length > 0
          ? { slug: { in: options.slugs } }
          : {}),
        ...(options.featuredOnly ? { featured: true } : {}),
      },
      orderBy: [{ featured: "desc" }, { order: "asc" }, { title: "asc" }],
      take: options.limit,
    })
    .catch(() => []);

  return Promise.all(
    streams.map(async (stream): Promise<StreamAccess> => {
      const needsPassword = Boolean(stream.accessPasswordHash) || !stream.isPublic;
      if (needsPassword && !(await hasStreamUnlock(stream.slug))) {
        return {
          state: "locked",
          slug: stream.slug,
          title: stream.title,
          description: stream.description,
        };
      }
      return { state: "ok", stream: toPublicStream(stream) };
    }),
  );
}

/** Converts a stored source into the URL an iframe player should load. */
export function iframeSourceFor(stream: PublicStream): string {
  const { type, source } = stream;
  const trimmed = source.trim();

  switch (type) {
    case "YOUTUBE": {
      const id =
        trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([\w-]{11})/)?.[1] ??
        (/^[\w-]{11}$/.test(trimmed) ? trimmed : null);
      if (!id) return trimmed;
      const params = new URLSearchParams({
        autoplay: stream.autoplay ? "1" : "0",
        mute: stream.muted ? "1" : "0",
        controls: stream.showControls ? "1" : "0",
        rel: "0",
        playsinline: "1",
      });
      return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
    }
    case "VIMEO": {
      const id = trimmed.match(/vimeo\.com\/(?:video\/|event\/)?(\d+)/)?.[1] ?? trimmed;
      return `https://player.vimeo.com/video/${id}?autoplay=${
        stream.autoplay ? 1 : 0
      }&muted=${stream.muted ? 1 : 0}`;
    }
    case "TWITCH": {
      const channel =
        trimmed.match(/twitch\.tv\/([\w_]+)/)?.[1] ?? trimmed.replace(/^@/, "");
      const parent =
        env.siteUrl.replace(/^https?:\/\//, "").split(":")[0] || "localhost";
      return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=${
        stream.autoplay
      }&muted=${stream.muted}`;
    }
    case "FACEBOOK":
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        trimmed,
      )}&autoplay=${stream.autoplay ? "true" : "false"}`;
    default:
      return trimmed;
  }
}

export const IFRAME_STREAM_TYPES: StreamType[] = [
  "YOUTUBE",
  "VIMEO",
  "TWITCH",
  "FACEBOOK",
  "IFRAME",
];
