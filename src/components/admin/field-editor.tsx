"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ImageIcon, Plus, Trash2 } from "lucide-react";

import { MediaPicker, MediaThumb, type MediaItem } from "@/components/admin/media-picker";
import { inputClass, Label } from "@/components/admin/ui";
import { ICON_NAMES, BlockIcon } from "@/components/ui/icon";
import type { FieldDef } from "@/lib/block-fields";
import { looksLikeMistEmbed } from "@/lib/html-stream-embed";
import type { StreamPickerOption } from "@/lib/stream-picker";
import { cn } from "@/lib/utils";

export type EditorContext = {
  streams: StreamPickerOption[];
};

type Data = Record<string, unknown>;

export function FieldEditor({
  field,
  data,
  onChange,
  context,
}: {
  field: FieldDef;
  data: Data;
  onChange: (key: string, value: unknown) => void;
  context: EditorContext;
}) {
  switch (field.kind) {
    case "text":
      return (
        <div>
          <Label htmlFor={field.key} hint={field.hint}>
            {field.label}
          </Label>
          <input
            id={field.key}
            type="text"
            value={asString(data[field.key])}
            placeholder={field.placeholder}
            onChange={(event) => onChange(field.key, event.target.value)}
            className={inputClass}
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          <Label htmlFor={field.key} hint={field.hint}>
            {field.label}
          </Label>
          <textarea
            id={field.key}
            rows={field.rows ?? 3}
            value={asString(data[field.key])}
            placeholder={field.placeholder}
            onChange={(event) => onChange(field.key, event.target.value)}
            className={cn(inputClass, "resize-y")}
          />
        </div>
      );

    case "richtext":
      return (
        <RichTextField
          label={field.label}
          hint={field.hint}
          value={asString(data[field.key])}
          onChange={(value) => onChange(field.key, value)}
        />
      );

    case "embedCode":
      return (
        <div>
          <Label htmlFor={field.key} hint={field.hint}>
            {field.label}
          </Label>
          <textarea
            id={field.key}
            rows={6}
            value={asString(data[field.key])}
            onChange={(event) => onChange(field.key, event.target.value)}
            className={cn(inputClass, "resize-y font-mono text-xs")}
            placeholder='<iframe src="https://player.vimeo.com/video/123456" allowfullscreen></iframe>'
          />
          {looksLikeMistEmbed(asString(data[field.key])) ? (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              This looks like a Mist / VideoStreamCanada player. Scripts are
              stripped in this block, so the stream will not play. Create it
              under{" "}
              <a
                href="/admin/streams/new"
                className="font-semibold underline underline-offset-2"
              >
                Live Streams
              </a>{" "}
              as an HTML embed, then add a Live stream player section and pick
              that stream.
            </p>
          ) : null}
        </div>
      );

    case "number":
      return (
        <div>
          <Label htmlFor={field.key} hint={field.hint}>
            {field.label}
          </Label>
          <input
            id={field.key}
            type="number"
            min={field.min}
            max={field.max}
            value={asNumber(data[field.key])}
            onChange={(event) =>
              onChange(field.key, Number.parseInt(event.target.value, 10) || 0)
            }
            className={inputClass}
          />
        </div>
      );

    case "boolean":
      return (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50">
          <input
            type="checkbox"
            checked={Boolean(data[field.key])}
            onChange={(event) => onChange(field.key, event.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span>
            <span className="block text-sm font-semibold text-navy-800">
              {field.label}
            </span>
            {field.description && (
              <span className="mt-0.5 block text-xs text-slate-500">
                {field.description}
              </span>
            )}
          </span>
        </label>
      );

    case "select":
      return (
        <div>
          <Label htmlFor={field.key} hint={field.hint}>
            {field.label}
          </Label>
          <select
            id={field.key}
            value={asString(data[field.key])}
            onChange={(event) => onChange(field.key, event.target.value)}
            className={inputClass}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );

    case "icon":
      return (
        <div>
          <Label>{field.label}</Label>
          <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 p-2">
            {ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => onChange(field.key, name)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-md border transition-colors",
                  data[field.key] === name
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-transparent text-slate-500 hover:bg-slate-100",
                )}
              >
                <BlockIcon name={name} className="size-4" />
              </button>
            ))}
          </div>
        </div>
      );

    case "image":
      return (
        <ImageField
          label={field.label}
          hint={field.hint}
          value={asString(data[field.key])}
          onChange={(value) => onChange(field.key, value)}
        />
      );

    case "imageObject": {
      const image = (data[field.key] ?? {}) as Record<string, unknown>;
      const update = (patch: Record<string, unknown>) =>
        onChange(field.key, { ...image, ...patch });

      return (
        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          <p className="text-sm font-semibold text-navy-800">{field.label}</p>
          <ImageField
            label="File"
            value={asString(image.url)}
            onChange={(value) => update({ url: value })}
          />
          <div>
            <Label htmlFor={`${field.key}-alt`} hint="Describes the image for screen readers.">
              Alt text
            </Label>
            <input
              id={`${field.key}-alt`}
              type="text"
              value={asString(image.alt)}
              onChange={(event) => update({ alt: event.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <Label htmlFor={`${field.key}-caption`}>Caption</Label>
            <input
              id={`${field.key}-caption`}
              type="text"
              value={asString(image.caption)}
              onChange={(event) => update({ caption: event.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      );
    }

    case "imageList": {
      const images = asArray(data[field.key]) as Array<Record<string, unknown>>;
      const setImages = (next: Array<Record<string, unknown>>) =>
        onChange(field.key, next);

      return (
        <div>
          <Label>{field.label}</Label>
          <div className="space-y-2">
            {images.map((image, index) => (
              <div
                key={index}
                className="flex items-start gap-2 rounded-lg border border-slate-200 p-2.5"
              >
                <MediaThumb url={asString(image.url)} />
                <div className="min-w-0 flex-1 space-y-2">
                  <ImageField
                    label=""
                    compact
                    value={asString(image.url)}
                    onChange={(value) =>
                      setImages(
                        images.map((item, i) =>
                          i === index ? { ...item, url: value } : item,
                        ),
                      )
                    }
                  />
                  <input
                    type="text"
                    value={asString(image.alt)}
                    placeholder="Alt text"
                    onChange={(event) =>
                      setImages(
                        images.map((item, i) =>
                          i === index ? { ...item, alt: event.target.value } : item,
                        ),
                      )
                    }
                    className={cn(inputClass, "text-xs")}
                  />
                  <input
                    type="text"
                    value={asString(image.caption)}
                    placeholder="Caption (optional)"
                    onChange={(event) =>
                      setImages(
                        images.map((item, i) =>
                          i === index
                            ? { ...item, caption: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={cn(inputClass, "text-xs")}
                  />
                </div>
                <ListButtons
                  index={index}
                  length={images.length}
                  onMove={(to) => setImages(move(images, index, to))}
                  onRemove={() =>
                    setImages(images.filter((_, i) => i !== index))
                  }
                />
              </div>
            ))}
            <AddButton
              label="Add image"
              onClick={() =>
                setImages([...images, { url: "", alt: "", caption: "" }])
              }
            />
          </div>
        </div>
      );
    }

    case "stringList": {
      const values = asArray(data[field.key]).map(asString);
      const setValues = (next: string[]) => onChange(field.key, next);

      return (
        <div>
          <Label hint={field.hint}>{field.label}</Label>
          <div className="space-y-2">
            {values.map((value, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={value}
                  placeholder={field.itemLabel}
                  onChange={(event) =>
                    setValues(
                      values.map((item, i) =>
                        i === index ? event.target.value : item,
                      ),
                    )
                  }
                  className={inputClass}
                />
                <ListButtons
                  index={index}
                  length={values.length}
                  onMove={(to) => setValues(move(values, index, to))}
                  onRemove={() => setValues(values.filter((_, i) => i !== index))}
                />
              </div>
            ))}
            <AddButton
              label={`Add ${field.itemLabel.toLowerCase()}`}
              onClick={() => setValues([...values, ""])}
            />
          </div>
        </div>
      );
    }

    case "links": {
      const links = asArray(data[field.key]) as Array<Record<string, unknown>>;
      const setLinks = (next: Array<Record<string, unknown>>) =>
        onChange(field.key, next);

      return (
        <div>
          <Label hint={field.hint}>{field.label}</Label>
          <div className="space-y-2">
            {links.map((link, index) => (
              <div
                key={index}
                className="space-y-2 rounded-lg border border-slate-200 p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Button {index + 1}
                  </span>
                  <ListButtons
                    index={index}
                    length={links.length}
                    onMove={(to) => setLinks(move(links, index, to))}
                    onRemove={() =>
                      setLinks(links.filter((_, i) => i !== index))
                    }
                  />
                </div>
                <input
                  type="text"
                  value={asString(link.label)}
                  placeholder="Button text"
                  onChange={(event) =>
                    setLinks(
                      links.map((item, i) =>
                        i === index ? { ...item, label: event.target.value } : item,
                      ),
                    )
                  }
                  className={inputClass}
                />
                <input
                  type="text"
                  value={asString(link.href)}
                  placeholder="/contact or https://…"
                  onChange={(event) =>
                    setLinks(
                      links.map((item, i) =>
                        i === index ? { ...item, href: event.target.value } : item,
                      ),
                    )
                  }
                  className={inputClass}
                />
                <div className="flex items-center gap-2">
                  <select
                    value={asString(link.style) || "primary"}
                    onChange={(event) =>
                      setLinks(
                        links.map((item, i) =>
                          i === index
                            ? { ...item, style: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={cn(inputClass, "flex-1")}
                  >
                    <option value="primary">Primary</option>
                    <option value="secondary">Secondary</option>
                    <option value="outline">Outline</option>
                    <option value="ghost">Text only</option>
                  </select>
                  <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(link.openInNewTab)}
                      onChange={(event) =>
                        setLinks(
                          links.map((item, i) =>
                            i === index
                              ? { ...item, openInNewTab: event.target.checked }
                              : item,
                          ),
                        )
                      }
                      className="size-3.5 rounded border-slate-300 text-brand-600"
                    />
                    New tab
                  </label>
                </div>
              </div>
            ))}
            <AddButton
              label="Add button"
              onClick={() =>
                setLinks([
                  ...links,
                  {
                    label: "Learn more",
                    href: "/contact",
                    style: "primary",
                    openInNewTab: false,
                  },
                ])
              }
            />
          </div>
        </div>
      );
    }

    case "objectList": {
      const items = asArray(data[field.key]) as Array<Record<string, unknown>>;
      const setItems = (next: Array<Record<string, unknown>>) =>
        onChange(field.key, next);

      return (
        <div>
          <Label>{field.label}</Label>
          <div className="space-y-2.5">
            {items.map((item, index) => (
              <CollapsibleItem
                key={index}
                title={
                  asString(item.title) ||
                  asString(item.name) ||
                  asString(item.question) ||
                  asString(item.authorName) ||
                  asString(item.label) ||
                  `${field.itemLabel} ${index + 1}`
                }
                onMove={(to) => setItems(move(items, index, to))}
                onRemove={() => setItems(items.filter((_, i) => i !== index))}
                index={index}
                length={items.length}
              >
                <div className="space-y-3">
                  {field.fields.map((subField) => (
                    <FieldEditor
                      key={subField.key}
                      field={subField}
                      data={item}
                      context={context}
                      onChange={(key, value) =>
                        setItems(
                          items.map((entry, i) =>
                            i === index ? { ...entry, [key]: value } : entry,
                          ),
                        )
                      }
                    />
                  ))}
                </div>
              </CollapsibleItem>
            ))}
            <AddButton
              label={`Add ${field.itemLabel.toLowerCase()}`}
              onClick={() => setItems([...items, blankFrom(field.fields)])}
            />
          </div>
        </div>
      );
    }

    case "table":
      return (
        <TableField
          label={field.label}
          hint={field.hint}
          columns={asArray(data.columns).map(asString)}
          rows={(asArray(data.rows) as unknown[][]).map((row) =>
            asArray(row).map(asString),
          )}
          onChange={(columns, rows) => {
            onChange("columns", columns);
            onChange("rows", rows);
          }}
        />
      );

    case "streamPicker":
      return (
        <div>
          <Label htmlFor={field.key} hint={field.hint}>
            {field.label}
          </Label>
          <select
            id={field.key}
            value={asString(data[field.key])}
            onChange={(event) => onChange(field.key, event.target.value)}
            className={inputClass}
          >
            <option value="">Select a stream…</option>
            {context.streams.map((stream) => (
              <option key={stream.slug} value={stream.slug}>
                {streamPickerLabel(stream)}
              </option>
            ))}
          </select>
          {context.streams.length === 0 && (
            <p className="mt-1.5 text-xs text-amber-600">
              No streams exist yet.{" "}
              <a
                href="/admin/streams/new"
                className="font-semibold underline underline-offset-2"
              >
                Create one under Live Streams
              </a>{" "}
              first, then return here to pick it.
            </p>
          )}
        </div>
      );

    case "streamMultiPicker": {
      const selected = asArray(data[field.key]).map(asString);
      return (
        <div>
          <Label hint={field.hint}>{field.label}</Label>
          <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {context.streams.length === 0 ? (
              <p className="px-1 py-2 text-xs text-slate-500">
                No streams available.
              </p>
            ) : (
              context.streams.map((stream) => (
                <label
                  key={stream.slug}
                  className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(stream.slug)}
                    onChange={(event) =>
                      onChange(
                        field.key,
                        event.target.checked
                          ? [...selected, stream.slug]
                          : selected.filter((slug) => slug !== stream.slug),
                      )
                    }
                    className="size-4 rounded border-slate-300 text-brand-600"
                  />
                  <span className="truncate text-navy-800">
                    {streamPickerLabel(stream)}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ImageField({
  label,
  value,
  onChange,
  hint,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  compact?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div>
      {label && (
        <Label
          hint={
            hint ??
            "Upload a new file or pick a replacement from the media library."
          }
        >
          {label}
        </Label>
      )}
      <div className="flex gap-2">
        {!compact && value && <MediaThumb url={value} />}
        <input
          type="text"
          value={value}
          placeholder="/uploads/example.jpg"
          onChange={(event) => onChange(event.target.value)}
          className={cn(inputClass, compact && "text-xs")}
        />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold text-navy-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
        >
          <ImageIcon className="size-3.5" aria-hidden="true" />
          {value ? "Change photo" : "Choose photo"}
        </button>
      </div>

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item: MediaItem) => onChange(item.url)}
      />
    </div>
  );
}

function RichTextField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <textarea
        rows={10}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(inputClass, "resize-y font-mono text-xs leading-relaxed")}
        placeholder="<p>Paragraph text…</p>"
      />
      <p className="mt-1.5 text-xs text-slate-500">
        Basic HTML is supported:{" "}
        <code className="rounded bg-slate-100 px-1">&lt;p&gt;</code>{" "}
        <code className="rounded bg-slate-100 px-1">&lt;strong&gt;</code>{" "}
        <code className="rounded bg-slate-100 px-1">&lt;ul&gt;&lt;li&gt;</code>{" "}
        <code className="rounded bg-slate-100 px-1">&lt;a href&gt;</code>{" "}
        <code className="rounded bg-slate-100 px-1">&lt;h3&gt;</code>. Anything
        unsafe is removed automatically.
      </p>
    </div>
  );
}

function TableField({
  label,
  columns,
  rows,
  onChange,
  hint,
}: {
  label: string;
  columns: string[];
  rows: string[][];
  onChange: (columns: string[], rows: string[][]) => void;
  hint?: string;
}) {
  const normalise = (nextColumns: string[], nextRows: string[][]) =>
    nextRows.map((row) =>
      Array.from({ length: nextColumns.length }, (_, i) => row[i] ?? ""),
    );

  return (
    <div>
      <Label hint={hint}>{label}</Label>

      <div className="space-y-2 rounded-lg border border-slate-200 p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {columns.map((column, index) => (
            <input
              key={index}
              type="text"
              value={column}
              placeholder={`Column ${index + 1}`}
              onChange={(event) => {
                const next = columns.map((item, i) =>
                  i === index ? event.target.value : item,
                );
                onChange(next, rows);
              }}
              className={cn(inputClass, "w-32 text-xs font-semibold")}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              const next = [...columns, `Column ${columns.length + 1}`];
              onChange(next, normalise(next, rows));
            }}
            className="rounded border border-slate-300 px-2 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-50"
          >
            + Column
          </button>
          {columns.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const next = columns.slice(0, -1);
                onChange(next, normalise(next, rows));
              }}
              className="rounded border border-slate-300 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              − Column
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex items-center gap-1.5">
              {columns.map((_, columnIndex) => (
                <input
                  key={columnIndex}
                  type="text"
                  value={row[columnIndex] ?? ""}
                  onChange={(event) =>
                    onChange(
                      columns,
                      rows.map((entry, i) =>
                        i === rowIndex
                          ? entry.map((cell, c) =>
                              c === columnIndex ? event.target.value : cell,
                            )
                          : entry,
                      ),
                    )
                  }
                  className={cn(inputClass, "w-32 text-xs")}
                />
              ))}
              <button
                type="button"
                onClick={() =>
                  onChange(
                    columns,
                    rows.filter((_, i) => i !== rowIndex),
                  )
                }
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Remove row"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>

        <AddButton
          label="Add row"
          onClick={() =>
            onChange(columns, [...rows, columns.map(() => "")])
          }
        />
      </div>
    </div>
  );
}

function CollapsibleItem({
  title,
  children,
  index,
  length,
  onMove,
  onRemove,
}: {
  title: string;
  children: React.ReactNode;
  index: number;
  length: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-2">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-slate-400 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
          <span className="truncate text-sm font-semibold text-navy-800">
            {title}
          </span>
        </button>
        <ListButtons
          index={index}
          length={length}
          onMove={onMove}
          onRemove={onRemove}
        />
      </div>
      {open && <div className="border-t border-slate-200 p-3">{children}</div>}
    </div>
  );
}

function ListButtons({
  index,
  length,
  onMove,
  onRemove,
}: {
  index: number;
  length: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30"
        aria-label="Move up"
      >
        <ChevronUp className="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        disabled={index === length - 1}
        onClick={() => onMove(index + 1)}
        className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-30"
        aria-label="Move down"
      >
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        aria-label="Remove"
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function AddButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
    >
      <Plus className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function streamPickerLabel(stream: StreamPickerOption): string {
  const tags = [
    stream.hasPassword ? "password" : null,
    stream.isPublic === false ? "unlisted" : null,
  ].filter(Boolean);
  return tags.length > 0 ? `${stream.title} (${tags.join(", ")})` : stream.title;
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Builds an empty item for an object list from its field definitions. */
function blankFrom(fields: FieldDef[]): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const field of fields) {
    switch (field.kind) {
      case "boolean":
        item[field.key] = false;
        break;
      case "number":
        item[field.key] = field.min ?? 0;
        break;
      case "stringList":
      case "links":
      case "imageList":
      case "objectList":
        item[field.key] = [];
        break;
      case "select":
        item[field.key] = field.options[0]?.value ?? "";
        break;
      case "icon":
        item[field.key] = "check";
        break;
      default:
        item[field.key] = "";
    }
  }
  return item;
}
