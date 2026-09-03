"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

import type { MistPlayerProps } from "@/components/blocks/mist-player";

const Player = dynamic(
  () => import("@/components/blocks/mist-player").then((mod) => mod.MistPlayer),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-navy-950 text-sm text-navy-200">
        Connecting to stream…
      </div>
    ),
  },
);

/**
 * Client wrapper so the Mist player is never server-rendered. Next.js rejects
 * `ssr: false` from a Server Component; this file is the required boundary.
 */
export function MistPlayerSlot({
  aspectClass = "aspect-video",
  className,
  ...player
}: MistPlayerProps & { aspectClass?: string; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-navy-950 shadow-card",
        aspectClass,
        className,
      )}
    >
      <Player {...player} />
    </div>
  );
}
