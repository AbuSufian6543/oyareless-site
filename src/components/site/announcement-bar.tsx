"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

/**
 * Dismissal is remembered per message so editing the text re-shows the bar to
 * everyone (useful for outage notices).
 */
export function AnnouncementBar({
  text,
  href,
}: {
  text: string;
  href?: string;
}) {
  const storageKey = `wc_announce_${hashText(text)}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(storageKey) !== "dismissed");
    } catch {
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible || !text) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(storageKey, "dismissed");
    } catch {
      // Private browsing — dismissal simply won't persist.
    }
  };

  return (
    <div className="relative bg-accent-500 text-navy-950">
      <div className="container-page flex items-center justify-center gap-3 py-2 pr-8 text-center text-sm font-medium">
        <Megaphone className="hidden size-4 shrink-0 sm:block" aria-hidden="true" />
        <p>
          {text}
          {href && (
            <a
              href={href}
              className="ml-2 font-bold underline underline-offset-2 hover:no-underline"
            >
              Learn more
            </a>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 transition-colors hover:bg-navy-950/10"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function hashText(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
