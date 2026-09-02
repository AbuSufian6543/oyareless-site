"use client";

import { useEffect, useId, useRef } from "react";

import { uniquifyEmbedIds } from "@/lib/html-stream-embed";
import { cn } from "@/lib/utils";

/**
 * Runs admin-pasted player HTML (Mist / VideoStreamCanada). Script tags in
 * innerHTML do not execute, so each script is re-inserted into the document.
 */
export function HtmlStreamPlayer({
  html,
  title,
  aspectClass,
  className,
}: {
  html: string;
  title: string;
  aspectClass: string;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "") || "embed";

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    host.innerHTML = uniquifyEmbedIds(html, reactId);
    const originals = [...host.querySelectorAll("script")];
    let cancelled = false;

    const run = (index: number) => {
      if (cancelled || index >= originals.length) return;
      const old = originals[index];
      if (!old) {
        run(index + 1);
        return;
      }

      const next = document.createElement("script");
      for (const attr of old.attributes) {
        next.setAttribute(attr.name, attr.value);
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

    return () => {
      cancelled = true;
      host.innerHTML = "";
    };
  }, [html, reactId]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-navy-950 shadow-card",
        aspectClass,
        className,
      )}
    >
      <div
        ref={hostRef}
        className="size-full min-h-[12.5rem] [&_a]:text-accent-300 [&_a]:underline [&_.mistvideo]:block [&_.mistvideo]:size-full [&_video]:size-full"
        aria-label={title}
      />
    </div>
  );
}
