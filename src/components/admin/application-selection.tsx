"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SelectionValue = {
  selected: ReadonlySet<string>;
  toggle: (id: string) => void;
};

const SelectionContext = createContext<SelectionValue | null>(null);

export function ApplicationSelectBox({ id, label }: { id: string; label: string }) {
  const selection = useContext(SelectionContext);
  if (!selection) return null;
  const checked = selection.selected.has(id);
  return (
    <label className="flex size-9 cursor-pointer items-center justify-center rounded-lg hover:bg-slate-100">
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

function ConfirmSubmit({
  label,
  message,
  disabled,
  className,
}: {
  label: string;
  message: string;
  disabled?: boolean;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={className}
    >
      {label}
    </button>
  );
}

const deleteClass =
  "rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40";

export function ApplicationSelection({
  ids,
  deleteAction,
  deleteAllAction,
  returnTo,
  filter,
  query,
  matchingCount,
  children,
}: {
  ids: string[];
  deleteAction: (formData: FormData) => void | Promise<void>;
  deleteAllAction: (formData: FormData) => void | Promise<void>;
  returnTo: string;
  filter: string;
  query: string;
  matchingCount: number;
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

  const chosen = ids.filter((id) => selected.has(id));
  const allMarked = ids.length > 0 && chosen.length === ids.length;
  const deleteLabel =
    chosen.length === 1 ? "Delete 1 application" : `Delete ${chosen.length} applications`;
  const allLabel =
    matchingCount === 1
      ? "Delete all (1 application)"
      : `Delete all (${matchingCount} applications)`;

  return (
    <SelectionContext.Provider value={value}>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
        <button
          type="button"
          onClick={() => setSelected(allMarked ? new Set() : new Set(ids))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50"
        >
          {allMarked ? "Clear" : "Mark all"}
        </button>
        <p className="min-w-0 text-sm text-slate-500" aria-live="polite">
          {chosen.length > 0 ? (
            <span className="font-semibold text-navy-800">{chosen.length} selected</span>
          ) : (
            "Select one, or mark all, then delete."
          )}
          {matchingCount > ids.length ? (
            <span className="text-slate-400">
              {" "}
              · Showing {ids.length} of {matchingCount}
            </span>
          ) : null}
        </p>
        <form action={deleteAction} className="sm:ml-auto">
          <input type="hidden" name="returnTo" value={returnTo} />
          {chosen.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <ConfirmSubmit
            label="Delete"
            message={
              chosen.length === 0
                ? "Select at least one application."
                : `${deleteLabel} and their résumés? This cannot be undone.`
            }
            disabled={chosen.length === 0}
            className={deleteClass}
          />
        </form>
        <form action={deleteAllAction}>
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="status" value={filter} />
          <input type="hidden" name="q" value={query} />
          <input type="hidden" name="scope" value="filter" />
          <ConfirmSubmit
            label="Delete all"
            message={`${allLabel} in this list and their résumés? This cannot be undone.`}
            disabled={matchingCount === 0}
            className={deleteClass}
          />
        </form>
      </div>
      {children}
    </SelectionContext.Provider>
  );
}
