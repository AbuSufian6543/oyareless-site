"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Megaphone, X } from "lucide-react";

const DISMISS_EVENT = "wc:announcement-dismissed";

/** Fallback for private browsing, where localStorage writes throw. */
const dismissedThisSession = new Set<string>();

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

  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener(DISMISS_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(DISMISS_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    if (dismissedThisSession.has(storageKey)) return true;
    try {
      return window.localStorage.getItem(storageKey) === "dismissed";
    } catch {
      return false;
    }
  }, [storageKey]);

  // The server has no way to know whether this visitor already dismissed the
  // notice, so it renders visible and hydration hides it if they have.
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, () => false);

  if (dismissed || !text) return null;

  const dismiss = () => {
    dismissedThisSession.add(storageKey);
    try {
      window.localStorage.setItem(storageKey, "dismissed");
    } catch {
      // Dismissal simply won't outlast the tab.
    }
    window.dispatchEvent(new Event(DISMISS_EVENT));
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
