"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleCheck,
  ExternalLink,
  LoaderCircle,
  Save,
  TriangleAlert,
  X,
} from "lucide-react";

import { savePostAction } from "@/app/admin/posts/actions";
import { BlockCanvas } from "@/components/admin/block-canvas";
import { FieldEditor, type EditorContext } from "@/components/admin/field-editor";
import { Alert, inputClass, Label } from "@/components/admin/ui";
import type { Block } from "@/lib/blocks";
import { cn, slugify } from "@/lib/utils";

export type PostEditorData = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  blocks: Block[];
};

export function PostEditor({
  post,
  streams,
}: {
  post: PostEditorData;
  streams: Array<{ slug: string; title: string }>;
}) {
  const [form, setForm] = useState(post);
  const [tab, setTab] = useState<"content" | "details">("content");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [message, setMessage] = useState<
    { tone: "success" | "danger"; text: string } | null
  >(null);

  const context: EditorContext = useMemo(() => ({ streams }), [streams]);

  const update = useCallback(
    <K extends keyof PostEditorData>(key: K, value: PostEditorData[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
      setDirty(true);
    },
    [],
  );

  const save = useCallback(async () => {
    setSaving(true);
    setMessage(null);

    const result = await savePostAction(form.id, {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      coverImageUrl: form.coverImageUrl,
      status: form.status,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      tags: form.tags,
      blocks: form.blocks,
    });

    setSaving(false);

    if (result.ok) {
      setDirty(false);
      setForm((current) => ({ ...current, slug: result.slug }));
      setMessage({ tone: "success", text: "Article saved." });
      setTimeout(() => setMessage(null), 3500);
    } else {
      setMessage({ tone: "danger", text: result.error });
    }
  }, [form]);

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

  function addTag() {
    const tag = tagDraft.trim().toLowerCase();
    if (!tag || form.tags.includes(tag) || form.tags.length >= 12) {
      setTagDraft("");
      return;
    }
    update("tags", [...form.tags, tag]);
    setTagDraft("");
  }

  return (
    <div>
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href="/admin/posts"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              ← All articles
            </Link>
            <input
              type="text"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              aria-label="Article title"
              className="mt-0.5 w-full truncate border-0 bg-transparent p-0 text-xl font-bold text-navy-900 focus:outline-none"
            />
            <p className="mt-0.5 truncate text-xs text-slate-500">
              /news/{form.slug}
              {dirty && (
                <span className="ml-2 font-semibold text-amber-600">
                  Unsaved changes
                </span>
              )}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <select
              value={form.status}
              onChange={(event) =>
                update("status", event.target.value as PostEditorData["status"])
              }
              aria-label="Publish status"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-navy-800 focus:border-brand-500 focus:outline-none"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <Link
              href={`/news/${form.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">View</span>
            </Link>

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

      <div className="mb-5 flex gap-1 border-b border-slate-200">
        {(
          [
            { id: "content", label: "Article body" },
            { id: "details", label: "Summary & SEO" },
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

      {tab === "content" ? (
        <BlockCanvas
          blocks={form.blocks}
          onChange={(blocks) => update("blocks", blocks)}
          context={context}
          emptyLabel="Add the first section of the article"
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-bold text-navy-900">Listing details</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="slug">URL slug</Label>
                  <input
                    id="slug"
                    type="text"
                    value={form.slug}
                    onChange={(event) => update("slug", event.target.value)}
                    onBlur={(event) => update("slug", slugify(event.target.value))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="excerpt"
                    hint="Shown on the news listing and in link previews."
                  >
                    Summary
                  </Label>
                  <textarea
                    id="excerpt"
                    rows={3}
                    value={form.excerpt}
                    onChange={(event) => update("excerpt", event.target.value)}
                    className={cn(inputClass, "resize-y")}
                  />
                </div>

                <FieldEditor
                  field={{
                    kind: "image",
                    key: "coverImageUrl",
                    label: "Cover image",
                    hint: "Appears at the top of the article and on cards.",
                  }}
                  data={{ coverImageUrl: form.coverImageUrl }}
                  context={context}
                  onChange={(_key, value) =>
                    update("coverImageUrl", String(value ?? ""))
                  }
                />

                <div>
                  <Label htmlFor="tag-input" hint="Press Enter to add.">
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() =>
                            update(
                              "tags",
                              form.tags.filter((entry) => entry !== tag),
                            )
                          }
                          aria-label={`Remove ${tag}`}
                          className="text-brand-400 hover:text-brand-700"
                        >
                          <X className="size-3" aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    id="tag-input"
                    type="text"
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault();
                        addTag();
                      }
                    }}
                    onBlur={addTag}
                    placeholder="cybersecurity"
                    className={cn(inputClass, "mt-2")}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 font-bold text-navy-900">Search engine listing</h2>
            <p className="mb-4 text-xs text-slate-500">
              Leave blank to fall back to the title and summary.
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta title</Label>
                <input
                  id="metaTitle"
                  type="text"
                  value={form.metaTitle}
                  placeholder={form.title}
                  onChange={(event) => update("metaTitle", event.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta description</Label>
                <textarea
                  id="metaDescription"
                  rows={3}
                  value={form.metaDescription}
                  placeholder={form.excerpt}
                  onChange={(event) =>
                    update("metaDescription", event.target.value)
                  }
                  className={cn(inputClass, "resize-y")}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
