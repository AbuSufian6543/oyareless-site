"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleCheck } from "lucide-react";

import {
  FLASH_EVENT,
  FLASH_MESSAGES,
  clearFlashCookie,
  parseFlashValue,
  type FlashKind,
} from "@/lib/flash-client";

const QUERY_FLASH: Record<string, FlashKind> = {
  saved: "saved",
  created: "created",
  deleted: "deleted",
  updated: "updated",
  restored: "saved",
  tested: "saved",
  reset: "saved",
};

export function SavedToast({ flash }: { flash?: string | null }) {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const hideTimer = useRef<number | null>(null);

  const queryKind = (() => {
    for (const [key, kind] of Object.entries(QUERY_FLASH)) {
      if (searchParams.get(key)) return kind;
    }
    return null;
  })();
  const kind = parseFlashValue(flash) ?? queryKind;
  const token = flash || (queryKind ? `${queryKind}:${searchParams.toString()}` : "");

  function show(next: FlashKind) {
    setMessage(FLASH_MESSAGES[next]);
    clearFlashCookie();
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setMessage(null), 3500);
  }

  useEffect(() => {
    if (!kind || !token) return;
    show(kind);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- token is the retrigger
  }, [kind, token]);

  useEffect(() => {
    const onFlash = (event: Event) => {
      const detail = parseFlashValue(String((event as CustomEvent<string>).detail ?? ""));
      if (detail) show(detail);
    };
    window.addEventListener(FLASH_EVENT, onFlash);
    return () => window.removeEventListener(FLASH_EVENT, onFlash);
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed right-4 bottom-4 z-200 sm:right-6 sm:bottom-6"
    >
      <p className="pointer-events-auto flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">
        <CircleCheck className="size-4 text-accent-400" aria-hidden="true" />
        {message}
      </p>
    </div>
  );
}
