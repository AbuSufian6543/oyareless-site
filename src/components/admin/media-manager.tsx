"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Check,
  Copy,
  ImageIcon,
  LoaderCircle,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
  Upload,
} from "lucide-react";

import type { MediaItem } from "@/components/admin/media-picker";
import { inputClass } from "@/components/admin/ui";
import { cn, formatBytes } from "@/lib/utils";

type Item = MediaItem & { folder: string; createdAt: string };

/**
 * Suggested folders. Admins can still type their own, but offering the sections
 * the site actually has means most uploads land somewhere sensible.
 */
const FOLDER_SUGGESTIONS = [
  "general",
  "brand",
  "services",
  "cybersecurity",
  "networking",
  "radio",
  "case-studies",
  "knowledge-base",
  "team",
  "documents",
];

export function MediaManager({
  canDelete,
  initialItems,
}: {
  canDelete: boolean;
  initialItems: Item[];
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [folder, setFolder] = useState("all");
  const [needsAltOnly, setNeedsAltOnly] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("general");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // Replace-in-place deliberately keeps the URL, so previews need a version
  // marker or the browser keeps painting the old bytes from cache.
  const [cacheBust, setCacheBust] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);

  // The list arrives with the page, so this only runs after an upload or a
  // failed edit needs the server's version of the truth back.
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const data = (await response.json()) as { items: Item[] };
      setItems(data.items);
    } catch {
      setError("Could not refresh the media library.");
    }
  }, []);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const folders = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.folder, (counts.get(item.folder) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const missingAlt = useMemo(
    () =>
      items.filter(
        (item) => item.mimeType.startsWith("image/") && !item.altText,
      ).length,
    [items],
  );

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        body.append("folder", uploadFolder);
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

  async function replace(item: Item, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setReplacing(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(`/api/admin/media/${item.id}`, {
        method: "PUT",
        body,
      });
      const data = (await response.json().catch(() => ({}))) as {
        item?: Item;
        message?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "The replacement failed.");
      }
      const replaced = data.item;
      setItems((current) =>
        current.map((entry) => (entry.id === replaced.id ? replaced : entry)),
      );
      setCacheBust(Date.now());
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setReplacing(false);
      if (replaceInput.current) replaceInput.current.value = "";
    }
  }

  async function patch(item: Item, changes: { altText?: string; folder?: string }) {
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, ...changes } : entry,
      ),
    );
    const response = await fetch(`/api/admin/media/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    }).catch(() => null);
    if (!response?.ok) {
      setError("That change could not be saved.");
      await load();
    }
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
      setSelectedId(null);
    } else {
      setError("The file could not be deleted.");
    }
  }

  async function copyUrl(item: Item) {
    await navigator.clipboard.writeText(item.url).catch(() => undefined);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 1800);
  }

  const filtered = items.filter((item) => {
    if (folder !== "all" && item.folder !== folder) return false;
    if (needsAltOnly && (item.altText || !item.mimeType.startsWith("image/"))) {
      return false;
    }
    if (!query) return true;
    return `${item.originalName} ${item.altText ?? ""} ${item.folder}`
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  const preview = (item: Item) =>
    cacheBust ? `${item.url}?v=${cacheBust}` : item.url;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
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

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="hidden sm:inline">Upload to</span>
          <input
            list="media-folders"
            value={uploadFolder}
            onChange={(event) =>
              setUploadFolder(
                event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
              )
            }
            className={cn(inputClass, "w-36")}
            aria-label="Upload folder"
          />
        </label>
        <datalist id="media-folders">
          {[...new Set([...FOLDER_SUGGESTIONS, ...folders.map(([name]) => name)])].map(
            (name) => (
              <option key={name} value={name} />
            ),
          )}
        </datalist>

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

      {folders.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <FolderTab
            label={`All (${items.length})`}
            active={folder === "all"}
            onClick={() => setFolder("all")}
          />
          {folders.map(([name, count]) => (
            <FolderTab
              key={name}
              label={`${name} (${count})`}
              active={folder === name}
              onClick={() => setFolder(name)}
            />
          ))}
          {missingAlt > 0 && (
            <button
              type="button"
              onClick={() => setNeedsAltOnly((current) => !current)}
              className={cn(
                "ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                needsAltOnly
                  ? "bg-amber-500 text-white"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100",
              )}
              aria-pressed={needsAltOnly}
            >
              <TriangleAlert className="size-3.5" aria-hidden="true" />
              {missingAlt} without alt text
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 py-20 text-center">
          <ImageIcon className="size-9 text-slate-300" aria-hidden="true" />
          <p className="text-sm text-slate-500">
            {items.length === 0
              ? "No files yet. Upload logos, photos or PDF datasheets."
              : "No files match those filters."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "overflow-hidden rounded-lg border bg-white text-left transition-all hover:shadow-md",
                  selectedId === item.id
                    ? "border-brand-500 ring-1 ring-brand-500"
                    : "border-slate-200 hover:border-brand-300",
                )}
              >
                <span className="block aspect-[4/3] bg-slate-100">
                  {item.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview(item)}
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
                    src={preview(selected)}
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
                  key={`alt-${selected.id}`}
                  type="text"
                  defaultValue={selected.altText ?? ""}
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    if (value !== (selected.altText ?? "")) {
                      void patch(selected, { altText: value });
                    }
                  }}
                  className={inputClass}
                />
                {!selected.altText && selected.mimeType.startsWith("image/") && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700">
                    <TriangleAlert
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    Describe what the image shows. Leave it blank only if the
                    image is purely decorative.
                  </p>
                )}

                <label
                  htmlFor="media-folder"
                  className="mt-4 mb-1.5 block text-sm font-semibold text-navy-800"
                >
                  Folder
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    organizes the library only — the address never changes
                  </span>
                </label>
                <input
                  id="media-folder"
                  key={`folder-${selected.id}`}
                  list="media-folders"
                  defaultValue={selected.folder}
                  onBlur={(event) => {
                    const value = event.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "");
                    if (value && value !== selected.folder) {
                      void patch(selected, { folder: value });
                    }
                  }}
                  className={inputClass}
                />

                <p className="mt-4 truncate rounded-lg bg-slate-50 px-2.5 py-2 font-mono text-[0.6875rem] text-slate-600">
                  {selected.url}
                </p>

                <div className="mt-3 flex gap-2">
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

                <input
                  ref={replaceInput}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(event) => void replace(selected, event.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => replaceInput.current?.click()}
                  disabled={replacing}
                  className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-navy-800 hover:bg-slate-50 disabled:opacity-60"
                >
                  {replacing ? (
                    <LoaderCircle
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                  )}
                  Replace file
                </button>
                <p className="mt-1.5 text-xs text-slate-500">
                  Swaps the artwork everywhere it is already used. The
                  replacement must be the same file type.
                </p>
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

function FolderTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-navy-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      )}
    >
      {label}
    </button>
  );
}
