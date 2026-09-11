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
  }>;
}) {
  return (
    <div className="mb-5 overflow-x-auto pb-1">
      <div className="inline-flex min-w-full gap-1 rounded-2xl border border-slate-200 bg-slate-100/80 p-1 sm:min-w-0">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors",
              item.active
                ? "bg-white text-navy-900 shadow-sm"
                : "text-navy-700 hover:bg-white/70 hover:text-navy-900",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span className={cn("ml-1.5 tabular-nums", item.active ? "text-brand-700" : "text-slate-500")}>
                {item.count}
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
