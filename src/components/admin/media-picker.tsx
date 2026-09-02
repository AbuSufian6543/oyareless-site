"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ImageIcon, LoaderCircle, Search, Upload, X } from "lucide-react";

import { UPLOAD_ACCEPT } from "@/lib/upload-accept";
import { cn, formatBytes } from "@/lib/utils";

export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  originalName: string;
  altText: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
};

/**
 * Modal browser for the media library with inline upload. Used by every image
 * field in the block editor.
 */
export function MediaPicker({
  open,
  onClose,
  onSelect,
  onSelectMany,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  /** When set, every file chosen in one upload is passed through together. */
  onSelectMany?: (items: MediaItem[]) => void;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to load");
      const data = (await response.json()) as { items: MediaItem[] };
      setItems(data.items);
      setError("");
    } catch {
      setError("Could not load the media library.");
    } finally {
      setLoading(false);
    }
  }, []);

  // The picker is a dialog inside a client editor, so there is no server render
  // to prefetch from: opening it has to go and fetch the library. The lint rule
  // cannot see that every state update happens after the request resolves.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    const uploaded: MediaItem[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });
        const data = (await response.json().catch(() => ({}))) as {
          message?: string;
          item?: MediaItem;
        };
        if (!response.ok) {
          throw new Error(data.message ?? "Upload failed");
        }
        if (data.item) uploaded.push(data.item);
      }
      await load();
      if (uploaded.length === 0) return;
      if (onSelectMany) {
        onSelectMany(uploaded);
      } else {
        onSelect(uploaded[uploaded.length - 1]);
      }
      onClose();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  if (!open) return null;

  const filtered = query
    ? items.filter((item) =>
        `${item.originalName} ${item.altText ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : items;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-navy-950/70"
        onClick={onClose}
      />

      <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-navy-900">Media library</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200 px-5 py-3">
          <div className="relative min-w-0 flex-1">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search files…"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <input
            ref={fileInput}
            type="file"
            accept={UPLOAD_ACCEPT}
            multiple
            onChange={(event) => void upload(event.target.files)}
            className="hidden"
            id="media-upload"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {uploading ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-4" aria-hidden="true" />
            )}
            Upload
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {error && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <LoaderCircle className="size-6 animate-spin" aria-hidden="true" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <ImageIcon className="size-9 text-slate-300" aria-hidden="true" />
              <p className="text-sm text-slate-500">
                {items.length === 0
                  ? "No files yet. Upload an image to get started."
                  : "No files match your search."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                  className="group overflow-hidden rounded-lg border border-slate-200 text-left transition-all hover:border-brand-400 hover:shadow-md"
                >
                  <span className="relative block aspect-[4/3] bg-slate-100">
                    {item.mimeType.startsWith("image/") ? (
                      // Library thumbnails: plain img avoids optimizer round-trips.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={item.altText ?? ""}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-xs font-bold uppercase text-slate-400">
                        {item.mimeType.split("/")[1]}
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-brand-600/0 transition-colors group-hover:bg-brand-600/25">
                      <Check
                        className="size-7 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </span>
                  </span>
                  <span className="block px-2.5 py-2">
                    <span className="block truncate text-xs font-semibold text-navy-800">
                      {item.originalName}
                    </span>
                    <span className="block text-[0.6875rem] text-slate-500">
                      {item.width && item.height
                        ? `${item.width}×${item.height} · `
                        : ""}
                      {formatBytes(item.sizeBytes)}
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

export function MediaThumb({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  if (!url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={cn(
        "size-11 shrink-0 rounded border border-slate-200 object-cover",
        className,
      )}
    />
  );
}
