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

/** Featured = one player on a page. Grid = a cell in a multi-stream layout. */
export type StreamLayout = "feature" | "grid";

export function streamFrameClass(layout: StreamLayout = "feature"): string {
  return layout === "grid"
    ? "w-full min-w-0"
    : "mx-auto w-full min-w-0 max-w-5xl";
}

export function streamAspectClass(ratio: string): string {
  if (ratio === "4/3") return "aspect-[4/3]";
  if (ratio === "21/9") return "aspect-[21/9]";
  if (ratio === "1/1") return "aspect-square";
  return "aspect-video";
}

export function isHtmlStreamType(type: string): boolean {
  return type === "HTML";
}
