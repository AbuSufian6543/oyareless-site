"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a headline number up when it scrolls into view. Years such as 2005
 * and mixed labels such as 24/7 stay readable: only the leading integer
 * animates, and reduced-motion users see the final value immediately.
 */

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function parseValue(value: string): {
  target: number;
  rest: string;
  animate: boolean;
} {
  const trimmed = value.trim();
  const year = /^((?:19|20)\d{2})$/.exec(trimmed);
  if (year) {
    return { target: Number(year[1]), rest: "", animate: false };
  }

  const leading = /^(\d+)(.*)$/.exec(trimmed);
  if (!leading) {
    return { target: 0, rest: trimmed, animate: false };
  }

  return {
    target: Number(leading[1]),
    rest: leading[2],
    animate: true,
  };
}

export function StatCounter({
  value,
  suffix = "",
  className,
}: {
  value: string;
  suffix?: string;
  className?: string;
}) {
  const parsed = parseValue(value);
  const [display, setDisplay] = useState(parsed.target);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!parsed.animate) return;

    const node = ref.current;
    if (!node) return;

    if (prefersReducedMotion()) {
      setDisplay(parsed.target);
      return;
    }

    let frame = 0;
    let running = false;

    const play = () => {
      if (running) return;
      running = true;
      setDisplay(0);
      const duration = parsed.target >= 100 ? 1400 : 1100;
      const origin = performance.now();

      const tick = (now: number) => {
        const progress = Math.min(1, (now - origin) / duration);
        setDisplay(Math.round(parsed.target * easeOutCubic(progress)));
        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        }
      };

      frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          play();
          observer.disconnect();
        }
      },
      { threshold: 0.45 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [parsed.animate, parsed.target]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
      <span aria-hidden="true">
        {display}
        {parsed.rest}
        {suffix ? <span className="text-[0.65em]">{suffix}</span> : null}
      </span>
    </span>
  );
}
