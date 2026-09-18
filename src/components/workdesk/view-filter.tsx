import Link from "next/link";

import { cn } from "@/lib/utils";

export function ViewFilter({
  items,
}: {
  items: Array<{
    href: string;
    label: string;
    active: boolean;
    count?: number;
    tone?: "danger" | "success" | "warning";
  }>;
}) {
  return (
    <nav className="mb-5 flex flex-wrap gap-1.5" aria-label="Filter">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors",
            item.active
              ? "border-navy-900 bg-navy-900 text-white shadow-sm"
              : "border-slate-200 bg-white text-navy-700 hover:border-brand-300 hover:bg-brand-50 hover:text-navy-900",
          )}
        >
          {item.label}
          {typeof item.count === "number" ? (
            <span
              className={cn(
                "ml-1.5 tabular-nums",
                item.active
                  ? "text-sky-200"
                  : item.tone === "danger"
                    ? "text-rose-600"
                    : item.tone === "success"
                      ? "text-emerald-600"
                      : item.tone === "warning"
                        ? "text-amber-600"
                        : "text-slate-500",
              )}
            >
              {item.count}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );
}
