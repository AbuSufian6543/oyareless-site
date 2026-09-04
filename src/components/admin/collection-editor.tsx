"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleCheck,
  ExternalLink,
  LoaderCircle,
  Save,
  TriangleAlert,
} from "lucide-react";

import { saveCollectionRecordAction } from "@/app/admin/collections/actions";
import { BlockCanvas } from "@/components/admin/block-canvas";
import { FieldEditor, type EditorContext } from "@/components/admin/field-editor";
import { Alert, Card, CardTitle, inputClass, Label } from "@/components/admin/ui";
import type { CollectionDefinition, CollectionField } from "@/lib/admin-collections";
import type { Block } from "@/lib/blocks";
import { cn, slugify } from "@/lib/utils";

export type CollectionEditorProps = {
  collection: CollectionDefinition;
  /** Null for a new record. */
  recordId: string | null;
  initialValues: Record<string, unknown>;
  blocks: Block[];
  /** Choices for every `reference` field, keyed by field name. */
  references: Record<string, Array<{ value: string; label: string }>>;
  streams: EditorContext["streams"];
};

export function CollectionEditor({
  collection,
  recordId,
  initialValues,
  blocks,
  references,
  streams,
}: CollectionEditorProps) {
  const router = useRouter();

  const [values, setValues] = useState<Record<string, unknown>>(initialValues);
  const [blockList, setBlockList] = useState<Block[]>(blocks);
  const [tab, setTab] = useState<"details" | "sections">("details");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<
    { tone: "success" | "danger"; text: string } | null
  >(null);

  const context: EditorContext = useMemo(() => ({ streams }), [streams]);

  const blocksField = collection.fields.find((field) => field.kind === "blocks");
  const mainFields = collection.fields.filter(
    (field) => field.kind !== "blocks" && (field.column ?? "main") === "main",
  );
  const sideFields = collection.fields.filter((field) => field.column === "side");

  const update = useCallback((name: string, value: unknown) => {
    setValues((current) => ({ ...current, [name]: value }));
    setDirty(true);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage(null);

    const payload: Record<string, unknown> = { ...values };
    if (blocksField) payload[blocksField.name] = blockList;

    const result = await saveCollectionRecordAction(
      collection.key,
      recordId,
      payload,
    );

    setSaving(false);

    if (!result.ok) {
      setMessage({ tone: "danger", text: result.error });
      return;
    }

    setDirty(false);
    setMessage({ tone: "success", text: `${collection.label} saved.` });

    if (!recordId) {
      // A new record now has an id; move to its own URL so a second save
      // updates rather than creating a duplicate.
      router.replace(`/admin/collections/${collection.key}/${result.id}`);
      return;
    }

    const timer = setTimeout(() => setMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [blockList, blocksField, collection.key, collection.label, recordId, router, values]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save]);

  const title = String(values[collection.titleField] ?? "") || `New ${collection.label.toLowerCase()}`;
  const slug = String(values.slug ?? "");
  const publicUrl =
    collection.publicPath && slug && values.status === "PUBLISHED"
      ? `${collection.publicPath}/${slug}`
      : null;

  return (
    <div>
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href={`/admin/collections/${collection.key}`}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              ← All {collection.plural.toLowerCase()}
            </Link>
            <p className="mt-0.5 truncate text-xl font-bold text-navy-900">{title}</p>
            {dirty && (
              <p className="mt-0.5 text-xs font-semibold text-amber-600">
                Unsaved changes
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {publicUrl && (
              <Link
                href={publicUrl}
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
              >
                <ExternalLink className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">View</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              Save
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-5">
          <Alert tone={message.tone}>
            <span className="flex items-center gap-2">
              {message.tone === "success" ? (
                <CircleCheck className="size-4 shrink-0" aria-hidden="true" />
              ) : (
                <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
              )}
              {message.text}
            </span>
          </Alert>
        </div>
      )}

      {collection.guidance && (
        <div className="mb-5">
          <Alert tone="info">{collection.guidance}</Alert>
        </div>
      )}

      {blocksField && (
        <div className="mb-5 flex gap-1 border-b border-slate-200">
          {(
            [
              { id: "details", label: "Details" },
              { id: "sections", label: blocksField.label },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                tab === item.id
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-slate-500 hover:text-navy-800",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {blocksField && tab === "sections" ? (
        <BlockCanvas
          blocks={blockList}
          onChange={(next) => {
            setBlockList(next);
            setDirty(true);
          }}
          context={context}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <Card>
            <div className="space-y-5">
              {mainFields.map((field) => (
                <CollectionFieldInput
                  key={field.name}
                  field={field}
                  values={values}
                  references={references}
                  context={context}
                  onChange={update}
                />
              ))}
            </div>
          </Card>

          {sideFields.length > 0 && (
            <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardTitle>Options</CardTitle>
                <div className="space-y-5">
                  {sideFields.map((field) => (
                    <CollectionFieldInput
                      key={field.name}
                      field={field}
                      values={values}
                      references={references}
                      context={context}
                      onChange={update}
                    />
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CollectionFieldInput({
  field,
  values,
  references,
  context,
  onChange,
}: {
  field: CollectionField;
  values: Record<string, unknown>;
  references: Record<string, Array<{ value: string; label: string }>>;
  context: EditorContext;
  onChange: (name: string, value: unknown) => void;
}) {
  const value = values[field.name];

  switch (field.kind) {
    case "slug":
      return (
        <div>
          <Label htmlFor={field.name} hint={field.hint ?? "the part of the URL after the domain"}>
            {field.label}
          </Label>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-sm text-slate-400">/</span>
            <input
              id={field.name}
              type="text"
              value={String(value ?? "")}
              placeholder={
                field.derivedFrom
                  ? slugify(String(values[field.derivedFrom] ?? ""))
                  : undefined
              }
              onChange={(event) => onChange(field.name, event.target.value)}
              onBlur={(event) => onChange(field.name, slugify(event.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      );

    case "tags":
      return (
        <div>
          <Label htmlFor={field.name} hint={field.hint ?? "one per line, or comma separated"}>
            {field.label}
          </Label>
          <textarea
            id={field.name}
            rows={3}
            value={(Array.isArray(value) ? value : []).join("\n")}
            onChange={(event) =>
              onChange(
                field.name,
                event.target.value
                  .split(/[\n,]/)
                  .map((item) => item.trim())
                  .filter(Boolean),
              )
            }
            className={cn(inputClass, "resize-y font-mono text-xs")}
          />
        </div>
      );

    case "datetime":
      return (
        <div>
          <Label htmlFor={field.name} required={field.required} hint={field.hint}>
            {field.label}
          </Label>
          <input
            id={field.name}
            type="datetime-local"
            value={toLocalInput(value)}
            onChange={(event) => onChange(field.name, event.target.value)}
            className={inputClass}
          />
        </div>
      );

    case "reference": {
      const options = references[field.name] ?? [];
      return (
        <div>
          <Label htmlFor={field.name} required={field.required} hint={field.hint}>
            {field.label}
          </Label>
          <select
            id={field.name}
            value={String(value ?? "")}
            onChange={(event) => onChange(field.name, event.target.value)}
            className={inputClass}
          >
            <option value="">{field.required ? "Choose one…" : "None"}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {options.length === 0 && (
            <p className="mt-1.5 text-xs text-amber-600">
              Nothing to choose from yet — create one first.
            </p>
          )}
        </div>
      );
    }

    case "blocks":
      return null;

    default:
      // text, textarea, number, boolean, select, image and icon all have a
      // matching control in the shared block field editor.
      return (
        <FieldEditor
          field={toFieldDef(field)}
          data={values}
          context={context}
          onChange={onChange}
        />
      );
  }
}

/** Maps a collection field onto the block editor's field descriptor. */
function toFieldDef(field: CollectionField) {
  const base = { key: field.name, label: field.label, hint: field.hint };

  switch (field.kind) {
    case "textarea":
      return {
        ...base,
        kind: "textarea" as const,
        rows: field.rows ?? 3,
        placeholder: field.placeholder,
      };
    case "number":
      return { ...base, kind: "number" as const, min: field.min, max: field.max };
    case "boolean":
      return {
        key: field.name,
        label: field.label,
        kind: "boolean" as const,
        description: field.hint,
      };
    case "select":
      return { ...base, kind: "select" as const, options: field.options ?? [] };
    case "image":
      return { ...base, kind: "image" as const };
    case "icon":
      return { key: field.name, label: field.label, kind: "icon" as const };
    default:
      return { ...base, kind: "text" as const, placeholder: field.placeholder };
  }
}

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` in the browser's own timezone. */
function toLocalInput(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => String(part).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}
