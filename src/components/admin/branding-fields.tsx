"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon, RotateCcw } from "lucide-react";

import { MediaPicker } from "@/components/admin/media-picker";
import { inputClass, Label } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/**
 * Colour input paired with a hex text box. Both controls write to the same
 * hidden-free single field, so the settings action needs no special handling.
 */
export function ColorField({
  label,
  name,
  defaultValue,
  hint,
  fallback,
}: {
  label: string;
  name: string;
  defaultValue: string;
  hint?: string;
  fallback: string;
}) {
  const [value, setValue] = useState(defaultValue || fallback);
  // <input type="color"> rejects anything that is not a 6-digit hex.
  const swatch = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;

  return (
    <div>
      <Label htmlFor={name} hint={hint}>
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} color picker`}
          value={swatch}
          onChange={(event) => setValue(event.target.value)}
          className="size-10 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
        />
        <input
          id={name}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          spellCheck={false}
          className={cn(inputClass, "font-mono")}
        />
        {value !== fallback && (
          <button
            type="button"
            onClick={() => setValue(fallback)}
            className="shrink-0 rounded-lg border border-slate-300 p-2.5 text-slate-500 transition-colors hover:bg-slate-50 hover:text-navy-800"
            title="Reset to the default color"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span className="sr-only">Reset {label}</span>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Image URL field with a media-library picker and a live preview, so branding
 * can be changed entirely from the admin.
 */
export function ImageUrlField({
  label,
  name,
  defaultValue,
  hint,
  previewOnDark = false,
  placeholder = "/brand/logo.png",
}: {
  label: string;
  name: string;
  defaultValue: string;
  hint?: string;
  previewOnDark?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      <Label
        htmlFor={name}
        hint={
          hint ??
          "Upload a new file or pick a replacement from the media library."
        }
      >
        {label}
      </Label>
      <div className="flex gap-2">
        <input
          id={name}
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          spellCheck={false}
          placeholder={placeholder}
          className={cn(inputClass, "font-mono text-xs")}
        />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
        >
          <ImageIcon className="size-4" aria-hidden="true" />
          {value ? "Change photo" : "Choose photo"}
        </button>
      </div>

      {value && (
        <div
          className={cn(
            "mt-2 inline-flex max-w-full items-center justify-center rounded-lg border p-3",
            previewOnDark
              ? "border-navy-700 bg-navy-900"
              : "border-slate-200 bg-slate-50",
          )}
        >
          {/* Unoptimised: the preview is admin-only and the source may be an
              off-site URL an admin just pasted. */}
          <Image
            src={value}
            alt=""
            width={260}
            height={80}
            unoptimized
            className="h-12 w-auto object-contain"
          />
        </div>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => {
          setValue(item.url);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
