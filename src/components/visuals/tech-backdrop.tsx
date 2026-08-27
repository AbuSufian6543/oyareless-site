import { NetworkCanvas } from "@/components/visuals/network-canvas";
import { cn } from "@/lib/utils";

/**
 * Layered background for dark sections: navy gradient, faint circuit grid, a
 * soft cyan glow, and optionally the animated node mesh.
 *
 * Everything is absolutely positioned and `aria-hidden`, so callers only need a
 * positioned, `isolate`d parent.
 */
export function TechBackdrop({
  network = true,
  density = 1,
  glow = "right",
  className,
}: {
  network?: boolean;
  density?: number;
  glow?: "right" | "left" | "center" | "none";
  className?: string;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950" />
      <div className="bg-tech-grid absolute inset-0" />

      {glow !== "none" && (
        <div
          className={cn(
            "absolute size-[46rem] max-w-none rounded-full opacity-45 blur-3xl",
            "bg-[radial-gradient(circle,var(--color-accent-600)_0%,transparent_68%)]",
            glow === "right" && "-right-40 -top-56",
            glow === "left" && "-left-40 -top-56",
            glow === "center" && "-top-72 left-1/2 -translate-x-1/2",
          )}
        />
      )}

      {network && (
        <NetworkCanvas
          density={density}
          className="absolute inset-0 size-full"
        />
      )}

      {/* Keeps text legible where the mesh is densest. */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/35 to-transparent" />
    </div>
  );
}
