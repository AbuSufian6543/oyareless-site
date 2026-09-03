"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";

import { MIST_PLAYER_SCRIPT_URL } from "@/lib/mist-config";

type MistPlayFn = (
  streamName: string,
  options: {
    target: HTMLElement;
    loop?: boolean;
    poster?: string;
    width?: number;
    height?: number;
    maxwidth?: number;
    maxheight?: number;
  },
) => { unload?: (arg?: unknown) => void } | void;

declare global {
  interface Window {
    mistPlay?: MistPlayFn;
    mistplayers?: unknown;
  }
}

let mistLoader: Promise<MistPlayFn> | null = null;

function loadMistPlayer(): Promise<MistPlayFn> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("The video player only runs in the browser."));
  }
  if (typeof window.mistPlay === "function") {
    return Promise.resolve(window.mistPlay);
  }
  if (mistLoader) return mistLoader;

  mistLoader = new Promise((resolve, reject) => {
    const fail = (message: string) => {
      mistLoader = null;
      reject(new Error(message));
    };

    const finish = () => {
      if (typeof window.mistPlay === "function") {
        resolve(window.mistPlay);
        return;
      }
      fail("The video player loaded but did not start.");
    };

    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-wc-mist-player]",
    );
    if (existing) {
      if (typeof window.mistPlay === "function") {
        finish();
        return;
      }
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener(
        "error",
        () => fail("Unable to load the video player."),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = MIST_PLAYER_SCRIPT_URL;
    script.async = true;
    script.dataset.wcMistPlayer = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => fail("Unable to load the video player."), {
      once: true,
    });
    document.head.appendChild(script);
  });

  return mistLoader;
}

function hostSize(element: HTMLElement): { width: number; height: number } | null {
  const width = Math.round(element.clientWidth);
  const height = Math.round(element.clientHeight);
  if (width < 32 || height < 32) return null;
  return { width, height };
}

function waitForHostSize(element: HTMLElement): Promise<{ width: number; height: number }> {
  const immediate = hostSize(element);
  if (immediate) return Promise.resolve(immediate);

  return new Promise((resolve) => {
    let observer: ResizeObserver | undefined;
    const finish = (size: { width: number; height: number }) => {
      observer?.disconnect();
      window.clearTimeout(timer);
      resolve(size);
    };

    observer = new ResizeObserver(() => {
      const size = hostSize(element);
      if (size) finish(size);
    });
    observer.observe(element);

    const timer = window.setTimeout(() => {
      finish(hostSize(element) ?? { width: 1024, height: 576 });
    }, 800);
  });
}

export type MistPlayerProps = {
  streamName: string;
  loop: boolean;
  poster: string;
  title: string;
  fallbackHref: string;
};

/**
 * Browser-only Mist / VideoStreamCanada player. Props are plain strings so
 * the live page never serializes vendor HTML (script tags) into the RSC payload.
 */
export function MistPlayer({
  streamName,
  loop,
  poster,
  title,
  fallbackHref,
}: MistPlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<{ unload?: (arg?: unknown) => void } | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !streamName) return;

    let cancelled = false;
    instanceRef.current = null;
    host.innerHTML = "";
    setStatus("loading");
    setErrorMessage("");

    void (async () => {
      try {
        const play = await loadMistPlayer();
        if (cancelled || !hostRef.current) return;
        const size = await waitForHostSize(hostRef.current);
        if (cancelled || !hostRef.current) return;
        const instance = play(streamName, {
          target: hostRef.current,
          loop,
          poster: poster || undefined,
          width: size.width,
          height: size.height,
          maxwidth: size.width,
          maxheight: size.height,
        });
        if (cancelled) {
          instance?.unload?.();
          hostRef.current.innerHTML = "";
          return;
        }
        instanceRef.current = instance ?? null;
        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to start the video player.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        instanceRef.current?.unload?.();
      } catch {
        // Vendor teardown is best-effort.
      }
      instanceRef.current = null;
      host.innerHTML = "";
    };
  }, [streamName, loop, poster]);

  return (
    <div className="absolute inset-0">
      <div
        ref={hostRef}
        className="wc-mist-host [&_a]:text-accent-300 [&_a]:underline"
        aria-label={title}
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
          {fallbackHref ? (
            <a
              href={fallbackHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Open the stream on the source site
            </a>
          ) : (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
