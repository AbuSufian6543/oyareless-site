import Link from "next/link";

import { cn } from "@/lib/utils";

type FilterItem = {
  href: string;
  label: string;
  active: boolean;
  count?: number;
  tone?: "danger" | "success" | "warning";
};

function FilterChip({ item }: { item: FilterItem }) {
  return (
    <Link
      href={item.href}
      aria-current={item.active ? "page" : undefined}
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
  );
}

export function ViewFilter({
  items,
  groups,
}: {
  items?: FilterItem[];
  groups?: Array<{ label: string; items: FilterItem[] }>;
}) {
  if (groups && groups.length > 0) {
    return (
      <nav aria-label="Filter">
        {groups.map((group) => (
          <div
            key={group.label}
            className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center"
          >
            <p className="w-28 shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((item) => (
                <FilterChip key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="mb-5 flex flex-wrap gap-1.5" aria-label="Filter">
      {(items ?? []).map((item) => (
        <FilterChip key={item.href} item={item} />
      ))}
    </nav>
  );
}
