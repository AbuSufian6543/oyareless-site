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
    <div className="mb-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
            item.active
              ? "bg-navy-900 text-white"
              : "border border-slate-200 bg-white text-navy-800 hover:border-brand-300",
          )}
        >
          {item.label}
          {typeof item.count === "number" ? ` (${item.count})` : ""}
        </Link>
      ))}
    </div>
  );
}
