"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  ImageIcon,
  LoaderCircle,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import type { MediaItem } from "@/components/admin/media-picker";
import { inputClass } from "@/components/admin/ui";
import { cn, formatBytes } from "@/lib/utils";

type Item = MediaItem & { folder: string; createdAt: string };

export function MediaManager({ canDelete }: { canDelete: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const data = (await response.json()) as { items: Item[] };
      setItems(data.items);
    } catch {
      setError("Could not load the media library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/media", {
          method: "POST",
          body,
        });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as {
            message?: string;
          };
          throw new Error(data.message ?? "Upload failed.");
        }
      }
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function saveAlt(item: Item, altText: string) {
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, altText } : entry,
      ),
    );
    await fetch(`/api/admin/media/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ altText }),
    }).catch(() => undefined);
  }

  async function remove(item: Item) {
    if (
      !window.confirm(
        `Delete "${item.originalName}"? Any page still using it will show a broken image.`,
      )
    ) {
      return;
    }
    const response = await fetch(`/api/admin/media/${item.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setSelected(null);
    } else {
      setError("The file could not be deleted.");
    }
  }

  async function copyUrl(item: Item) {
    await navigator.clipboard.writeText(item.url).catch(() => undefined);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 1800);
  }

  const filtered = query
    ? items.filter((item) =>
        `${item.originalName} ${item.altText ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : items;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files…"
            className={cn(inputClass, "pl-9")}
          />
        </div>

        <input
          ref={fileInput}
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={(event) => void upload(event.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {uploading ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
          Upload files
        </button>
      </div>

      {error && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <LoaderCircle className="size-7 animate-spin" aria-hidden="true" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 py-20 text-center">
          <ImageIcon className="size-9 text-slate-300" aria-hidden="true" />
          <p className="text-sm text-slate-500">
            {items.length === 0
              ? "No files yet. Upload logos, photos or PDF datasheets."
              : "No files match your search."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item)}
                className={cn(
                  "overflow-hidden rounded-lg border bg-white text-left transition-all hover:shadow-md",
                  selected?.id === item.id
                    ? "border-brand-500 ring-1 ring-brand-500"
                    : "border-slate-200 hover:border-brand-300",
                )}
              >
                <span className="block aspect-[4/3] bg-slate-100">
                  {item.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={item.altText ?? ""}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs font-bold uppercase text-slate-400">
                      {item.mimeType.split("/")[1]}
                    </span>
                  )}
                </span>
                <span className="block px-2.5 py-2">
                  <span className="block truncate text-xs font-semibold text-navy-800">
                    {item.originalName}
                  </span>
                  <span className="block text-[0.6875rem] text-slate-500">
                    {formatBytes(item.sizeBytes)}
                    {!item.altText && item.mimeType.startsWith("image/") && (
                      <span className="ml-1 text-amber-600">· no alt text</span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            {selected ? (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                {selected.mimeType.startsWith("image/") && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.url}
                    alt={selected.altText ?? ""}
                    className="mb-3 w-full rounded-lg border border-slate-200 object-contain"
                  />
                )}
                <p className="truncate text-sm font-bold text-navy-900">
                  {selected.originalName}
                </p>
                <dl className="mt-2 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between gap-2">
                    <dt>Type</dt>
                    <dd className="font-medium text-slate-700">
                      {selected.mimeType}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>Size</dt>
                    <dd className="font-medium text-slate-700">
                      {formatBytes(selected.sizeBytes)}
                    </dd>
                  </div>
                  {selected.width && selected.height && (
                    <div className="flex justify-between gap-2">
                      <dt>Dimensions</dt>
                      <dd className="font-medium text-slate-700">
                        {selected.width}×{selected.height}
                      </dd>
                    </div>
                  )}
                </dl>

                <label
                  htmlFor="alt-text"
                  className="mt-4 mb-1.5 block text-sm font-semibold text-navy-800"
                >
                  Alt text
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    for screen readers
                  </span>
                </label>
                <input
                  id="alt-text"
                  type="text"
                  value={selected.altText ?? ""}
                  onChange={(event) =>
                    setSelected({ ...selected, altText: event.target.value })
                  }
                  onBlur={(event) => void saveAlt(selected, event.target.value)}
                  className={inputClass}
                />

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void copyUrl(selected)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-navy-800 hover:bg-slate-50"
                  >
                    {copied === selected.id ? (
                      <Check className="size-3.5" aria-hidden="true" />
                    ) : (
                      <Copy className="size-3.5" aria-hidden="true" />
                    )}
                    {copied === selected.id ? "Copied" : "Copy URL"}
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => void remove(selected)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center text-sm text-slate-500">
                Select a file to see its details.
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
