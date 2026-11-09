"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type SelectionValue = {
  selected: ReadonlySet<string>;
  toggle: (id: string) => void;
};

const SelectionContext = createContext<SelectionValue | null>(null);

const STATUS_CLASS: Record<string, string> = {
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100",
  WAITING: "border-slate-200 bg-white text-navy-800 hover:bg-slate-50",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
  CLOSED: "border-navy-800 bg-navy-900 text-white hover:bg-navy-800",
};

export function WorkSelectBox({ id, label }: { id: string; label: string }) {
  const selection = useContext(SelectionContext);
  if (!selection) return null;
  const checked = selection.selected.has(id);
  return (
    <label className="mt-0.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-white/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => selection.toggle(id)}
        className="size-4 rounded border-slate-300 accent-brand-600"
        aria-label={label}
      />
    </label>
  );
}

function StatusButtons({
  statuses,
  count,
  noun,
}: {
  statuses: Array<{ value: string; label: string }>;
  count: number;
  noun: string;
}) {
  const { pending } = useFormStatus();
  const idle = count === 0 || pending;
  return (
    <div className="flex flex-wrap gap-1.5">
      {statuses.map((status) => {
        const close = status.value === "CLOSED";
        return (
          <button
            key={status.value}
            type="submit"
            name="status"
            value={status.value}
            disabled={idle}
            title={status.value === "RESOLVED" ? "Marks the ticket resolved" : undefined}
            onClick={(event) => {
              if (!close) return;
              const name = count === 1 ? noun : `${noun}s`;
              if (!window.confirm(`Mark ${count} ${name} closed?`)) event.preventDefault();
            }}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40",
              STATUS_CLASS[status.value] ?? "border-slate-200 bg-white text-navy-800",
            )}
          >
            {status.label}
          </button>
        );
      })}
    </div>
  );
}

export function WorkSelection({
  ids,
  action,
  statuses,
  returnTo,
  noun,
  summary,
  empty,
  children,
}: {
  ids: string[];
  action: (formData: FormData) => void | Promise<void>;
  statuses: Array<{ value: string; label: string }>;
  returnTo: string;
  noun: "task" | "ticket";
  summary: string;
  empty: string;
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const idKey = ids.join("\n");

  useEffect(() => {
    setSelected(new Set());
  }, [idKey]);

  const value = useMemo<SelectionValue>(
    () => ({
      selected,
      toggle: (id: string) => {
        setSelected((current) => {
          const next = new Set(current);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
      },
    }),
    [selected],
  );

  if (ids.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-10 text-center text-sm text-slate-500">
        {empty}
      </p>
    );
  }

  const visible = ids.filter((id) => selected.has(id));
  const all = visible.length === ids.length;

  return (
    <SelectionContext.Provider value={value}>
      <form action={action} className="sticky top-14 z-20 mb-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:top-0">
        <input type="hidden" name="returnTo" value={returnTo} />
        {visible.map((id) => (
          <input key={id} type="hidden" name="ids" value={id} />
        ))}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-navy-900">
              <input
                type="checkbox"
                checked={all}
                ref={(node) => {
                  if (node) node.indeterminate = visible.length > 0 && !all;
                }}
                onChange={() => setSelected(all ? new Set() : new Set(ids))}
                className="size-4 rounded border-slate-300 accent-brand-600"
                aria-label={all ? "Clear selection" : "Select all"}
              />
              Select all
            </label>
            <p className="min-w-0 text-sm text-slate-500" aria-live="polite">
              {visible.length > 0 ? (
                <span className="font-semibold text-navy-800">
                  {visible.length} selected
                </span>
              ) : (
                "Select one or all, then set a status."
              )}
              <span className="text-slate-400"> · {summary}</span>
            </p>
          </div>
          <StatusButtons statuses={statuses} count={visible.length} noun={noun} />
        </div>
      </form>
      <ul className="space-y-2.5">{children}</ul>
    </SelectionContext.Provider>
  );
}
