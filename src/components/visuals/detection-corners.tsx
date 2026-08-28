import { cn } from "@/lib/utils";

/**
 * Decorative corner brackets. They read as a viewfinder, not as live
 * detections — there is no telemetry behind them.
 */
export function DetectionCorners({
  className,
  inset = false,
}: {
  className?: string;
  inset?: boolean;
}) {
  const arm =
    "absolute size-5 border-accent-400/70 sm:size-6 " +
    (inset ? "border-[1.5px]" : "border-2");

  return (
    <div
      className={cn("pointer-events-none absolute inset-3 sm:inset-4", className)}
      aria-hidden="true"
    >
      <span className={cn(arm, "left-0 top-0 rounded-tl-sm border-b-0 border-r-0")} />
      <span className={cn(arm, "right-0 top-0 rounded-tr-sm border-b-0 border-l-0")} />
      <span className={cn(arm, "bottom-0 left-0 rounded-bl-sm border-t-0 border-r-0")} />
      <span className={cn(arm, "bottom-0 right-0 rounded-br-sm border-t-0 border-l-0")} />
    </div>
  );
}
