"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";

import { HtmlStreamPlayer } from "@/components/blocks/html-stream-player";
import type { ParsedMistEmbed } from "@/lib/html-stream-embed";
import {
  streamAspectClass,
  streamFrameClass,
  type PublicStream,
  type StreamLayout,
} from "@/lib/stream-public";
import { cn } from "@/lib/utils";

export type { StreamLayout };
export { streamFrameClass };
export { LiveBadge } from "@/components/blocks/live-badge";

/**
 * Plays HLS/DASH via hls.js (loaded on demand), native video for progressive
 * sources, an <img> for MJPEG camera feeds, and an iframe for hosted platforms.
 */
export function StreamPlayer({
  stream,
  iframeSrc,
  className,
  layout = "feature",
  mist = null,
  html = "",
}: {
  stream: PublicStream;
  iframeSrc: string;
  className?: string;
  layout?: StreamLayout;
  mist?: ParsedMistEmbed | null;
  html?: string;
}) {
  const aspect = streamAspectClass(stream.aspectRatio);
  const isIframe = ["YOUTUBE", "VIMEO", "TWITCH", "FACEBOOK", "IFRAME"].includes(
    stream.type,
  );

  const stage = (child: ReactNode) => (
    <div className={cn(streamFrameClass(layout), className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl bg-navy-950 shadow-card",
          aspect,
        )}
      >
        {child}
      </div>
    </div>
  );

  if (stream.type === "HTML") {
    return stage(
      <HtmlStreamPlayer
        mist={mist}
        html={html}
        title={stream.title}
        posterUrl={stream.posterUrl ?? mist?.poster}
      />,
    );
  }

  if (isIframe) {
    return stage(
      <iframe
        src={iframeSrc}
        title={stream.title}
        className="absolute inset-0 size-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />,
    );
  }

  if (stream.type === "MJPEG") {
    return stage(
      // MJPEG feeds are a continuous multipart image response, so the image
      // optimizer cannot handle them.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={stream.source}
        alt={stream.title}
        className="absolute inset-0 size-full object-contain"
      />,
    );
  }

  return stage(<HlsPlayer stream={stream} />);
}

function HlsPlayer({ stream }: { stream: PublicStream }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream.source) return;

    let destroyed = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let hls: any = null;

    const isHlsSource =
      stream.type === "HLS" || /\.m3u8(\?|$)/i.test(stream.source);

    async function setup() {
      // Safari and iOS play HLS natively; no library needed there.
      const nativeHls = video!.canPlayType("application/vnd.apple.mpegurl");

      if (isHlsSource && !nativeHls) {
        try {
          const { default: Hls } = await import("hls.js");
          if (destroyed) return;

          if (!Hls.isSupported()) {
            setStatus("error");
            setErrorMessage("This browser cannot play the stream format.");
            return;
          }

          hls = new Hls({
            lowLatencyMode: true,
            enableWorker: true,
            backBufferLength: 30,
          });

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!destroyed) setStatus("ready");
          });

          hls.on(
            Hls.Events.ERROR,
            (_event: unknown, data: { fatal?: boolean; type?: string }) => {
              if (!data.fatal || destroyed) return;
              // Network errors are common with cameras; try to recover once.
              if (data.type === "networkError") {
                hls.startLoad();
                return;
              }
              setStatus("error");
              setErrorMessage("The stream is currently unavailable.");
            },
          );

          hls.loadSource(stream.source);
          hls.attachMedia(video!);
          return;
        } catch {
          if (!destroyed) {
            setStatus("error");
            setErrorMessage("Unable to load the stream player.");
          }
          return;
        }
      }

      video!.src = stream.source;
      const onLoaded = () => !destroyed && setStatus("ready");
      const onError = () => {
        if (destroyed) return;
        setStatus("error");
        setErrorMessage("The stream is currently unavailable.");
      };
      video!.addEventListener("loadeddata", onLoaded);
      video!.addEventListener("error", onError);
    }

    void setup();

    return () => {
      destroyed = true;
      if (hls) hls.destroy();
    };
  }, [stream.source, stream.type]);

  return (
    <>
      <video
        ref={videoRef}
        poster={stream.posterUrl ?? undefined}
        autoPlay={stream.autoplay}
        muted={stream.muted}
        controls={stream.showControls}
        playsInline
        loop={false}
        className="absolute inset-0 size-full object-contain"
        aria-label={stream.title}
      />

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-navy-950/70">
          <div className="flex items-center gap-2.5 text-sm text-navy-200">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Connecting to stream…
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-navy-950/90 p-6 text-center">
          <TriangleAlert className="size-8 text-amber-400" aria-hidden="true" />
          <p className="text-sm font-medium text-white">{errorMessage}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      )}
    </>
  );
}

