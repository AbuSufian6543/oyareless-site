"use client";

import { useRouter } from "next/navigation";

export function SortSelect({
  value,
  options,
}: {
  value: string;
  options: Array<{ value: string; label: string; href: string }>;
}) {
  const router = useRouter();
  return (
    <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-500">
      Sort
      <select
        aria-label="Sort tasks"
        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-navy-800"
        value={value || "default"}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.target.value);
          if (next) router.push(next.href);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
