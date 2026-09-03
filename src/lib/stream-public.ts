/**
 * Client-safe stream shapes. Do not import `@/lib/streams` from client
 * components — that module is `server-only` (Prisma, cookies, jose) and
 * pulling it into the player crashes /live and /video-services.
 */

export type PublicStreamType =
  | "HLS"
  | "DASH"
  | "YOUTUBE"
  | "VIMEO"
  | "TWITCH"
  | "FACEBOOK"
  | "IFRAME"
  | "MJPEG"
  | "WEBRTC"
  | "HTML"
  | "MP4"
  | "WEBM";

/** Shape sent to the client player. Never includes the password hash. */
export type PublicStream = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: PublicStreamType;
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
