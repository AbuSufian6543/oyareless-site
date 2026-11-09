"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";

import {
  FLASH_EVENT,
  FLASH_MESSAGES,
  clearFlashCookie,
  parseFlashNotice,
  parseFlashValue,
  type FlashKind,
  type FlashNotice,
} from "@/lib/flash-client";
import { cn } from "@/lib/utils";

const QUERY_FLASH: Record<string, FlashKind> = {
  saved: "saved",
  created: "created",
  deleted: "deleted",
  updated: "updated",
  restored: "saved",
  tested: "saved",
  reset: "saved",
};

function noticeFrom(flash: string | null | undefined, queryKind: FlashKind | null): FlashNotice | null {
  const custom = parseFlashNotice(flash);
  if (custom) return custom;
  const kind = parseFlashValue(flash) ?? queryKind;
  if (!kind) return null;
  return { tone: "ok", message: FLASH_MESSAGES[kind] };
}

export function SavedToast({ flash }: { flash?: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [notice, setNotice] = useState<FlashNotice | null>(null);
  const [busy, setBusy] = useState(false);
  const hideTimer = useRef<number | null>(null);

  const queryKind = (() => {
    for (const [key, kind] of Object.entries(QUERY_FLASH)) {
      if (searchParams.get(key)) return kind;
    }
    return null;
  })();
  const incoming = noticeFrom(flash, queryKind);
  const token = flash || (queryKind ? `${queryKind}:${searchParams.toString()}` : "");
  const route = `${pathname}?${searchParams.toString()}`;

  function show(next: FlashNotice) {
    setBusy(false);
    setNotice(next);
    clearFlashCookie();
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setNotice(null), 3800);
  }

  useEffect(() => {
    if (!incoming || !token) return;
    show(incoming);
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- token is the retrigger
  }, [token]);

  useEffect(() => {
    setBusy(false);
  }, [route, token]);

  useEffect(() => {
    const onFlash = (event: Event) => {
      const detail = String((event as CustomEvent<string>).detail ?? "");
      const next = noticeFrom(detail, null);
      if (next) show(next);
    };
    const onSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const method = (form.getAttribute("method") || "get").toLowerCase();
      if (method === "get") return;
      setNotice(null);
      setBusy(true);
    };
    window.addEventListener(FLASH_EVENT, onFlash);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      window.removeEventListener(FLASH_EVENT, onFlash);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => {
      setBusy(false);
      setNotice({ tone: "err", message: "That didn't finish. Try again." });
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [busy]);

  if (!notice && !busy) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-200 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6">
      {busy && !notice ? (
        <p
          role="status"
          className="pointer-events-auto flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <LoaderCircle className="size-4 animate-spin text-sky-300" aria-hidden="true" />
          Working…
        </p>
      ) : null}
      {notice ? (
        <p
          role={notice.tone === "err" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg",
            notice.tone === "err" ? "bg-rose-800" : "bg-navy-900",
          )}
        >
          {notice.tone === "err" ? (
            <CircleAlert className="size-4 text-rose-200" aria-hidden="true" />
          ) : (
            <CircleCheck className="size-4 text-accent-400" aria-hidden="true" />
          )}
          {notice.message}
        </p>
      ) : null}
    </div>
  );
}
