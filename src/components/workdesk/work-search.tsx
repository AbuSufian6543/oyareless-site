import { Search, X } from "lucide-react";

export function WorkSearch({
  action,
  query,
  kind,
}: {
  action: string;
  query: string;
  kind: "task" | "ticket";
}) {
  const placeholder =
    kind === "task" ? "Search by name or WT number" : "Search by name or WC number";

  return (
    <form action={action} method="get" className="mb-4" role="search">
      <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-500/15">
        <Search className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
        <span className="sr-only">{placeholder}</span>
        <input
          name="q"
          defaultValue={query}
          placeholder={placeholder}
          autoComplete="off"
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Search
        </button>
        {query ? (
          <a
            href={action}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-navy-800"
          >
            <X className="size-3.5" aria-hidden="true" />
            Clear
          </a>
        ) : null}
      </label>
      {query ? (
        <p className="mt-2 text-xs text-slate-500">
          Matches for “{query}” across every {kind} you can open, including closed ones.
        </p>
      ) : null}
    </form>
  );
}
