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
    <div className="mb-5 overflow-x-auto pb-1">
      <div className="inline-flex min-w-full gap-1 rounded-xl border border-slate-200 bg-white p-1 sm:min-w-0">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors",
              item.active
                ? "bg-navy-900 text-white shadow-sm"
                : "text-navy-700 hover:bg-white/80 hover:text-navy-900",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  item.active
                    ? "text-accent-200"
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
      </div>
    </div>
  );
}
