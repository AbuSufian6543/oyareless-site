"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

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
      <div className={cn("wc-collapse grid transition-[grid-template-rows] duration-200", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className={cn("min-h-0", open ? "overflow-visible" : "overflow-hidden")}>{children}</div>
      </div>
    </div>
  );
}
