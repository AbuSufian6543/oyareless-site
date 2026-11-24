"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export function TaskDrawer({
  title,
  fullHref,
  children,
}: {
  title: string;
  fullHref: string;
  children: ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") router.back();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-navy-950/40"
        aria-label="Close task"
        onClick={() => router.back()}
      />
      <aside className="relative flex h-full w-full max-w-3xl flex-col bg-slate-50 shadow-xl">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-sm font-bold text-navy-900">{title}</p>
          <a href={fullHref} className="shrink-0 text-xs font-semibold text-brand-700 hover:underline">
            Open full page
          </a>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-900"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
