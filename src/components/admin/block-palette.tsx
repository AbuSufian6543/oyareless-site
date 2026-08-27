"use client";

import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Search, X } from "lucide-react";

import {
  BLOCK_CATEGORIES,
  BLOCK_DEFINITIONS,
  type BlockCategory,
} from "@/lib/block-registry";
import type { BlockType } from "@/lib/blocks";
import { cn } from "@/lib/utils";

/** Resolves a registry icon name to a lucide component. */
function RegistryIcon({ name, className }: { name: string; className?: string }) {
  const Component =
    (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
      name
    ] ?? Icons.Square;
  return <Component className={className} />;
}

export function BlockPalette({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (type: BlockType) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BlockCategory | "All">("All");

  // Each opening starts from a clean filter state. Handled during render rather
  // than in an effect so the stale filters are never briefly visible.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setCategory("All");
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const results = BLOCK_DEFINITIONS.filter((definition) => {
    const matchesCategory =
      category === "All" || definition.category === category;
    const matchesQuery =
      !query ||
      `${definition.label} ${definition.description}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 bg-navy-950/70"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-bold text-navy-900">Add a section</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Pick a section type to insert into the page.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 border-b border-slate-200 px-5 py-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sections…"
              autoFocus
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(["All", ...BLOCK_CATEGORIES] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  category === item
                    ? "bg-brand-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-4">
          {results.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No sections match your search.
            </p>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {results.map((definition) => (
                <button
                  key={definition.type}
                  type="button"
                  onClick={() => {
                    onPick(definition.type);
                    onClose();
                  }}
                  className="group flex items-start gap-3 rounded-lg border border-slate-200 p-3.5 text-left transition-all hover:border-brand-400 hover:bg-brand-50/50 hover:shadow-sm"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <RegistryIcon name={definition.icon} className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-navy-800">
                      {definition.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                      {definition.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { RegistryIcon };
