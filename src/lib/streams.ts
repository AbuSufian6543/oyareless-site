import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { Stream } from "@/generated/prisma/client";
import type { PublicStream, PublicStreamType, StreamAccess } from "@/lib/stream-public";

export type { PublicStream, PublicStreamType, StreamAccess } from "@/lib/stream-public";

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
    type: stream.type as PublicStream["type"],
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
 * Resolves a stream for public display. Password-protected streams return
 * `locked` without the source (including Mist HTML) until the visitor
 * supplies the password. Unlisted streams without a password remain
 * watchable by URL; they are only omitted from public directories.
 */
export async function getStreamAccess(slug: string): Promise<StreamAccess> {
  try {
    const stream = await prisma.stream
      .findFirst({ where: { slug, status: "PUBLISHED" } })
      .catch(() => null);

    if (!stream) return { state: "missing" };

    if (await isPasswordLocked(stream.slug, stream.accessPasswordHash)) {
      return {
        state: "locked",
        slug: stream.slug,
        title: stream.title,
        description: stream.description,
      };
    }

    return { state: "ok", stream: toPublicStream(stream) };
  } catch {
    return { state: "missing" };
  }
}

async function isPasswordLocked(
  slug: string,
  accessPasswordHash: string | null,
): Promise<boolean> {
  if (!accessPasswordHash) return false;
  return !(await hasStreamUnlock(slug));
}

export async function listStreamAccess(options: {
  slugs?: string[];
  featuredOnly?: boolean;
  limit?: number;
  /**
   * When true and no slugs are given, hide unlisted streams from directories
   * such as /live. Password-protected public streams still appear as a gate.
   */
  listedOnly?: boolean;
}): Promise<StreamAccess[]> {
  try {
    const hasSlugs = Boolean(options.slugs && options.slugs.length > 0);
    const streams = await prisma.stream
      .findMany({
        where: {
          status: "PUBLISHED",
          ...(hasSlugs ? { slug: { in: options.slugs } } : {}),
          ...(options.featuredOnly ? { featured: true } : {}),
          ...(options.listedOnly && !hasSlugs ? { isPublic: true } : {}),
        },
        orderBy: [{ featured: "desc" }, { order: "asc" }, { title: "asc" }],
        take: options.limit,
      })
      .catch(() => []);

    return await Promise.all(
      streams.map(async (stream): Promise<StreamAccess> => {
        if (await isPasswordLocked(stream.slug, stream.accessPasswordHash)) {
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
  } catch {
    return [];
  }
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

export const IFRAME_STREAM_TYPES: PublicStreamType[] = [
  "YOUTUBE",
  "VIMEO",
  "TWITCH",
  "FACEBOOK",
  "IFRAME",
];
