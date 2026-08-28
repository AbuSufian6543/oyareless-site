import {
  NetworkCanvas,
  type NetworkMood,
} from "@/components/visuals/network-canvas";
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
  mood = "network",
  scrim = "hero",
  className,
}: {
  network?: boolean;
  density?: number;
  glow?: "right" | "left" | "center" | "none";
  /**
   * `ai` warms the navy and adds a second, slow-breathing glow. Used on the
   * home hero only. `ops` keeps the network mesh and adds a faint alarm glow
   * for the footer. No scan line, no viewfinder on the full field.
   */
  mood?: NetworkMood;
  /**
   * `hero` darkens the lower half for headline type. `section` is lighter so
   * a footer or band still shows the particles. `none` leaves the mesh raw.
   */
  scrim?: "hero" | "section" | "none";
  className?: string;
}) {
  const ai = mood === "ai";
  const ops = mood === "ops";

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
      aria-hidden="true"
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950",
          ai && "via-[#062033]",
        )}
      />
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

      {ai && (
        <>
          <div className="animate-ambient-glow absolute -bottom-32 -left-24 size-[36rem] rounded-full blur-3xl bg-[radial-gradient(circle,var(--color-brand-500)_0%,transparent_70%)]" />
          {/* Static depth, not a travelling band. */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(ellipse_at_top,rgb(52_197_228_/_0.08),transparent_58%)]" />
        </>
      )}

      {ops && (
        <div
          className="absolute -bottom-28 left-[18%] size-[26rem] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgb(251 113 133 / 0.55) 0%, transparent 70%)",
          }}
        />
      )}

      {network && (
        <NetworkCanvas
          density={density}
          mood={mood}
          className="absolute inset-0 size-full"
        />
      )}

      {scrim === "hero" && (
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/35 to-transparent" />
      )}
      {scrim === "section" && (
        <div className="absolute inset-0 bg-navy-950/25" />
      )}
    </div>
  );
}
