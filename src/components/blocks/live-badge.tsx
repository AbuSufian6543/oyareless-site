"use client";

import { cn } from "@/lib/utils";

export function LiveBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-white",
        className,
      )}
    >
      <span
        className="size-1.5 rounded-full bg-white animate-live-dot"
        aria-hidden="true"
      />
      Live
    </span>
  );
}
