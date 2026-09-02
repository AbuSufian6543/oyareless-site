"use client";

import { useEffect, useId, useRef, useState } from "react";
import { LoaderCircle, TriangleAlert } from "lucide-react";

import {
  MIST_PLAYER_SCRIPT_URL,
  parseMistEmbed,
  rewriteInsecureMistPlayer,
  uniquifyEmbedIds,
} from "@/lib/html-stream-embed";
import { cn } from "@/lib/utils";

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
) => MistInstance | void;

type MistInstance = {
  unload?: (arg?: unknown) => void;
};

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
      existing.addEventListener("error", () => fail("Unable to load the video player."), {
        once: true,
      });
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

function hostSize(element: HTMLElement): { width: number; height: number } {
  const width = Math.round(element.clientWidth);
  const height = Math.round(element.clientHeight);
  return {
    width: width > 0 ? width : 1280,
    height: height > 0 ? height : 720,
  };
}

/**
 * Plays admin-pasted Mist / VideoStreamCanada HTML. Typical snippets call
 * mistPlay(name, { target, loop, poster }); we parse that and call mistPlay
 * with a React-managed container so ids never collide. Unknown snippets fall
 * back to re-inserting their script tags (innerHTML does not execute them).
 */
export function HtmlStreamPlayer({
  html,
  title,
  aspectClass,
  className,
  posterUrl,
}: {
  html: string;
  title: string;
  aspectClass: string;
  className?: string;
  posterUrl?: string | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<MistInstance | null>(null);
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "") || "embed";
  const parsed = parseMistEmbed(html);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    instanceRef.current = null;
    host.innerHTML = "";
    setStatus("loading");
    setErrorMessage("");
    const call = parseMistEmbed(html);

    const runParsed = async () => {
      if (!call) return false;
      try {
        const play = await loadMistPlayer();
        if (cancelled || !hostRef.current) return true;
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        if (cancelled || !hostRef.current) return true;
        const size = hostSize(hostRef.current);
        const poster = call.poster || posterUrl || undefined;
        const instance = play(call.streamName, {
          target: hostRef.current,
          loop: call.loop,
          poster,
          width: size.width,
          height: size.height,
          maxwidth: size.width,
          maxheight: size.height,
        });
        if (cancelled) {
          instance?.unload?.();
          hostRef.current.innerHTML = "";
          return true;
        }
        instanceRef.current = instance ?? null;
        if (!cancelled) setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to start the video player.",
          );
        }
      }
      return true;
    };

    const runFallback = () => {
      const prepared = uniquifyEmbedIds(rewriteInsecureMistPlayer(html), reactId);
      host.innerHTML = prepared;
      const originals = [...host.querySelectorAll("script")];

      const run = (index: number) => {
        if (cancelled || index >= originals.length) {
          if (!cancelled) setStatus("ready");
          return;
        }
        const old = originals[index];
        if (!old) {
          run(index + 1);
          return;
        }

        const next = document.createElement("script");
        for (const attr of old.attributes) {
          next.setAttribute(attr.name, attr.value);
        }
        if (next.src.startsWith("http://videostreamcanada.ca/")) {
          next.src = next.src.replace(/^http:/, "https:");
        }
        next.textContent = old.textContent;
        old.replaceWith(next);

        if (next.src) {
          next.addEventListener("load", () => run(index + 1), { once: true });
          next.addEventListener("error", () => run(index + 1), { once: true });
          return;
        }

        run(index + 1);
      };

      run(0);
    };

    void (async () => {
      const handled = await runParsed();
      if (!handled && !cancelled) runFallback();
    })();

    return () => {
      cancelled = true;
      try {
        instanceRef.current?.unload?.();
      } catch {
        // Vendor teardown is best-effort; the host is cleared either way.
      }
      instanceRef.current = null;
      host.innerHTML = "";
    };
  }, [html, posterUrl, reactId]);

  const fallbackHref = parsed?.fallbackHref;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-navy-950 shadow-card",
        aspectClass,
        className,
      )}
    >
      <div
        ref={hostRef}
        className="size-full min-h-[12.5rem] [&_a]:text-accent-300 [&_a]:underline [&_.mistvideo]:block [&_.mistvideo]:size-full [&_video]:size-full"
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

      <noscript>
        <p className="p-6 text-center text-sm text-navy-200">
          {fallbackHref ? (
            <a
              href={fallbackHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-300 underline"
            >
              Click here to play this video
            </a>
          ) : (
            "JavaScript is required to play this live stream."
          )}
        </p>
      </noscript>
    </div>
  );
}
