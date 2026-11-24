"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const STORAGE_KEY = "wc-calendar-open";

export function CollapsibleCalendar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(window.localStorage.getItem(STORAGE_KEY) !== "0");
  }, []);

  function toggle() {
    setOpen((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="mb-2 inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-navy-800 hover:bg-slate-50"
      >
        {open ? <ChevronUp className="size-3.5" aria-hidden="true" /> : <ChevronDown className="size-3.5" aria-hidden="true" />}
        {open ? "Hide calendar" : "Show calendar"}
      </button>
      {open ? children : null}
    </div>
  );
}
