"use client";

import { useEffect, useRef } from "react";

/**
 * Drifting node-and-link field with occasional pulses travelling along links,
 * used behind dark hero and section backgrounds.
 *
 * Deliberately restrained: low node count, thin lines, slow speeds. The goal is
 * "network diagram" rather than "screensaver".
 *
 * Performance and accessibility guards:
 *   - `prefers-reduced-motion` renders one static frame and stops.
 *   - An IntersectionObserver halts the loop while the canvas is off-screen.
 *   - The loop also stops when the tab is hidden.
 *   - Device pixel ratio is capped at 2 and node count scales with area up to a
 *     hard ceiling, so large monitors do not multiply the work.
 */

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  sensor: boolean;
};

type Pulse = {
  from: number;
  to: number;
  progress: number;
  speed: number;
};

type Ring = {
  node: number;
  radius: number;
  max: number;
  speed: number;
};

export type NetworkMood = "network" | "ai" | "ops";

const LINK_DISTANCE = 148;
const MAX_NODES = 68;
const MIN_NODES = 18;
const NODE_AREA = 17000; // one node per this many CSS pixels²
const MAX_PULSES = 5;
const MAX_RINGS = 4;

export function NetworkCanvas({
  className,
  density = 1,
  mood = "network",
}: {
  className?: string;
  /** Multiplier on the computed node count, for calmer or busier sections. */
  density?: number;
  /**
   * `ai` uses a few slightly larger nodes so the mesh reads a little closer.
   * `ops` adds quiet sensor pings — security / alarm heartbeats on the same
   * network mesh — used in the site footer.
   * No detection boxes — those read as a scanner on the page background.
   */
  mood?: NetworkMood;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Pull the palette from the live CSS variables so an admin theme change is
    // reflected without touching this file.
    const styles = getComputedStyle(canvas);
    const nodeColor = styles.getPropertyValue("--wc-net-node").trim() || "#34c5e4";
    const linkColor = styles.getPropertyValue("--wc-net-link").trim() || "#22b8d8";
    const alertColor =
      styles.getPropertyValue("--wc-net-alert").trim() || "#fb7185";

    let nodes: Node[] = [];
    let pulses: Pulse[] = [];
    let rings: Ring[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.round(((width * height) / NODE_AREA) * density);
      const count = Math.max(MIN_NODES, Math.min(MAX_NODES, target));

      nodes = Array.from({ length: count }, (_, index) => {
        const sensor = mood === "ops" && index % 9 === 0;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * (mood === "ops" ? 0.12 : 0.19),
          vy: (Math.random() - 0.5) * (mood === "ops" ? 0.12 : 0.19),
          r: sensor
            ? 2.1 + Math.random() * 0.6
            : mood === "ai" && index % 7 === 0
              ? 2.2 + Math.random() * 0.8
              : 1 + Math.random() * 1.5,
          sensor,
        };
      });
      pulses = [];
      rings = [];
    };

    const spawnPulse = () => {
      if (nodes.length < 2 || pulses.length >= MAX_PULSES) return;
      const from = Math.floor(Math.random() * nodes.length);

      // Only pulse along links that are actually drawn.
      const candidates: number[] = [];
      for (let i = 0; i < nodes.length; i += 1) {
        if (i === from) continue;
        const dx = nodes[i].x - nodes[from].x;
        const dy = nodes[i].y - nodes[from].y;
        if (dx * dx + dy * dy < LINK_DISTANCE * LINK_DISTANCE) candidates.push(i);
      }
      if (candidates.length === 0) return;

      pulses.push({
        from,
        to: candidates[Math.floor(Math.random() * candidates.length)],
        progress: 0,
        speed: 0.006 + Math.random() * 0.009,
      });
    };

    const spawnRing = () => {
      if (mood !== "ops" || rings.length >= MAX_RINGS) return;
      const sensors = nodes
        .map((node, index) => (node.sensor ? index : -1))
        .filter((index) => index >= 0);
      if (sensors.length === 0) return;
      rings.push({
        node: sensors[Math.floor(Math.random() * sensors.length)],
        radius: 2,
        max: 28 + Math.random() * 22,
        speed: 0.22 + Math.random() * 0.12,
      });
    };

    const draw = (animate: boolean) => {
      context.clearRect(0, 0, width, height);

      if (animate) {
        for (const node of nodes) {
          node.x += node.vx;
          node.y += node.vy;
          // Bounce rather than wrap: wrapping makes links pop in and out.
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
          node.x = Math.max(0, Math.min(width, node.x));
          node.y = Math.max(0, Math.min(height, node.y));
        }
      }

      // Links. Opacity falls off with distance so the mesh looks depth-sorted.
      context.lineWidth = 1;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared > LINK_DISTANCE * LINK_DISTANCE) continue;

          const distance = Math.sqrt(distanceSquared);
          context.globalAlpha = (1 - distance / LINK_DISTANCE) * 0.3;
          context.strokeStyle = linkColor;
          context.beginPath();
          context.moveTo(nodes[i].x, nodes[i].y);
          context.lineTo(nodes[j].x, nodes[j].y);
          context.stroke();
        }
      }

      // Nodes. Sensor nodes sit on the same mesh in a warmer alarm colour.
      for (const node of nodes) {
        context.globalAlpha = node.sensor ? 0.88 : 0.72;
        context.fillStyle = node.sensor ? alertColor : nodeColor;
        context.beginPath();
        context.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        context.fill();
      }

      // Quiet radar pings from alarm / camera sensors.
      if (mood === "ops") {
        if (animate) {
          for (const ring of rings) {
            ring.radius += ring.speed;
          }
          rings = rings.filter((ring) => ring.radius < ring.max);
          if (Math.random() < 0.012) spawnRing();
        }

        context.lineWidth = 1.15;
        context.strokeStyle = alertColor;
        for (const ring of rings) {
          const origin = nodes[ring.node];
          if (!origin) continue;
          context.globalAlpha = (1 - ring.radius / ring.max) * 0.45;
          context.beginPath();
          context.arc(origin.x, origin.y, ring.radius, 0, Math.PI * 2);
          context.stroke();
        }
      }

      // Data pulses travelling along links.
      if (animate) {
        for (const pulse of pulses) {
          pulse.progress += pulse.speed;
        }
        pulses = pulses.filter((pulse) => pulse.progress < 1);

        for (const pulse of pulses) {
          const a = nodes[pulse.from];
          const b = nodes[pulse.to];
          if (!a || !b) continue;

          const x = a.x + (b.x - a.x) * pulse.progress;
          const y = a.y + (b.y - a.y) * pulse.progress;
          // Fade in and out across the trip.
          context.globalAlpha = Math.sin(pulse.progress * Math.PI) * 0.9;
          context.fillStyle = nodeColor;
          context.beginPath();
          context.arc(x, y, 2.3, 0, Math.PI * 2);
          context.fill();
        }

        if (Math.random() < 0.014) spawnPulse();
      }

      context.globalAlpha = 1;
    };

    const loop = () => {
      if (!running) return;
      draw(true);
      frame = window.requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduceMotion) return;
      running = true;
      frame = window.requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };

    resize();
    if (mood === "ops") spawnRing();
    draw(false);

    if (reduceMotion) {
      // Static frame only; no observers or listeners needed beyond resize.
      const onResizeStatic = () => {
        resize();
        draw(false);
      };
      window.addEventListener("resize", onResizeStatic);
      return () => window.removeEventListener("resize", onResizeStatic);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    const onResize = () => {
      resize();
      draw(!running);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", onResize);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
    };
  }, [density, mood]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      // Consumed by the effect above via getComputedStyle.
      style={
        {
          "--wc-net-node": "var(--color-accent-400)",
          "--wc-net-link": "var(--color-accent-500)",
          "--wc-net-alert": "#fb7185",
        } as React.CSSProperties
      }
    />
  );
}
