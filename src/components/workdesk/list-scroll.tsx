"use client";

import { useEffect } from "react";

export function ListScroll({ storageKey }: { storageKey: string }) {
  useEffect(() => {
    const saved = window.sessionStorage.getItem(storageKey);
    if (saved) window.scrollTo(0, Number(saved) || 0);
    function remember(event: MouseEvent) {
      const link = (event.target as HTMLElement | null)?.closest("a[href*='/admin/tasks/']");
      if (!link) return;
      window.sessionStorage.setItem(storageKey, String(window.scrollY));
    }
    document.addEventListener("click", remember);
    return () => document.removeEventListener("click", remember);
  }, [storageKey]);
  return null;
}
