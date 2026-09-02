"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ImageIcon,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import { MediaPicker, MediaThumb, type MediaItem } from "@/components/admin/media-picker";
import { inputClass, Label } from "@/components/admin/ui";
import { IMAGE_UPLOAD_ACCEPT } from "@/lib/upload-accept";
import {
  isPromoVideoUrl,
  type SlideshowItem,
} from "@/lib/slideshow";
import { cn } from "@/lib/utils";

/**
 * Ordered photos and YouTube/Vimeo links for the public page slideshow.
 */
export function SlideshowEditor({
  items,
  onChange,
}: {
  items: SlideshowItem[];
  onChange: (items: SlideshowItem[]) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  function setItems(next: SlideshowItem[]) {
    onChange(next);
  }

  function appendImages(files: MediaItem[]) {
    const slides: SlideshowItem[] = files
      .filter((file) => file.mimeType.startsWith("image/"))
      .map((file) => ({
        kind: "image" as const,
        url: file.url,
        alt: file.altText ?? "",
        caption: "",
      }));
    if (slides.length === 0) {
      setError("Only photos can be added to the slideshow. Use Add video link for YouTube or Vimeo.");
      return;
    }
    setError("");
    setItems([...items, ...slides]);
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    const uploaded: MediaItem[] = [];

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "services");
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
      appendImages(uploaded);
    } catch (caught) {
      setError((caught as Error).message);
      if (uploaded.length > 0) appendImages(uploaded);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-bold text-navy-900">Photos and promo videos</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            These play in the hero picture on this page — the same panel
            beside the headline. Upload several photos at once, add YouTube
            or Vimeo links, and change the order with the arrows.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <input
            ref={fileInput}
            type="file"
            accept={IMAGE_UPLOAD_ACCEPT}
            multiple
            onChange={(event) => void upload(event.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {uploading ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="size-3.5" aria-hidden="true" />
            )}
            Upload photos
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-navy-800 transition-colors hover:bg-slate-50"
          >
            <ImageIcon className="size-3.5" aria-hidden="true" />
            Library
          </button>
          <button
            type="button"
            onClick={() =>
              setItems([...items, { kind: "video", url: "", title: "" }])
            }
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-navy-800 transition-colors hover:bg-slate-50"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add video link
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          No slides yet. Upload photos or add a YouTube or Vimeo link.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item.kind}-${index}-${item.kind === "image" ? item.url : item.title}`}
              className="flex items-start gap-2 rounded-lg border border-slate-200 p-2.5"
            >
              {item.kind === "image" ? (
                <MediaThumb url={item.url} />
              ) : (
                <span className="flex size-11 shrink-0 items-center justify-center rounded border border-slate-200 bg-navy-950 text-accent-400">
                  <Video className="size-4" aria-hidden="true" />
                </span>
              )}

              <div className="min-w-0 flex-1 space-y-2">
                {item.kind === "image" ? (
                  <>
                    <p className="truncate text-xs font-semibold text-navy-800">
                      {item.url || "No photo chosen"}
                    </p>
                    <input
                      type="text"
                      value={item.alt}
                      placeholder="Alt text — describe the photo"
                      onChange={(event) =>
                        setItems(
                          items.map((slide, i) =>
                            i === index && slide.kind === "image"
                              ? { ...slide, alt: event.target.value }
                              : slide,
                          ),
                        )
                      }
                      className={cn(inputClass, "text-xs")}
                    />
                    <input
                      type="text"
                      value={item.caption}
                      placeholder="Caption (optional)"
                      onChange={(event) =>
                        setItems(
                          items.map((slide, i) =>
                            i === index && slide.kind === "image"
                              ? { ...slide, caption: event.target.value }
                              : slide,
                          ),
                        )
                      }
                      className={cn(inputClass, "text-xs")}
                    />
                  </>
                ) : (
                  <>
                    <Label hint="YouTube or Vimeo only.">
                      Promo video URL
                    </Label>
                    <input
                      type="url"
                      value={item.url}
                      placeholder="https://www.youtube.com/watch?v=…"
                      onChange={(event) =>
                        setItems(
                          items.map((slide, i) =>
                            i === index && slide.kind === "video"
                              ? { ...slide, url: event.target.value }
                              : slide,
                          ),
                        )
                      }
                      className={inputClass}
                    />
                    {item.url.trim() && !isPromoVideoUrl(item.url) && (
                      <p className="text-xs text-red-700">
                        That does not look like a YouTube or Vimeo link.
                      </p>
                    )}
                    <input
                      type="text"
                      value={item.title}
                      placeholder="Title (optional)"
                      onChange={(event) =>
                        setItems(
                          items.map((slide, i) =>
                            i === index && slide.kind === "video"
                              ? { ...slide, title: event.target.value }
                              : slide,
                          ),
                        )
                      }
                      className={cn(inputClass, "text-xs")}
                    />
                  </>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => setItems(move(items, index, index - 1))}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => setItems(move(items, index, index + 1))}
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setItems(items.filter((_, i) => i !== index))
                  }
                  className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => appendImages([item])}
        onSelectMany={appendImages}
      />
    </div>
  );
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
