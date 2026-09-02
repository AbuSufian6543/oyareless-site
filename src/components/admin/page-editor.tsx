"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleCheck,
  ExternalLink,
  Eye,
  EyeOff,
  LoaderCircle,
  Save,
  TriangleAlert,
} from "lucide-react";

import { savePageAction } from "@/app/admin/pages/actions";
import { BlockCanvas } from "@/components/admin/block-canvas";
import { FieldEditor, type EditorContext } from "@/components/admin/field-editor";
import { SlideshowEditor } from "@/components/admin/slideshow-editor";
import { Alert, inputClass, Label } from "@/components/admin/ui";
import type { Block } from "@/lib/blocks";
import type { SlideshowItem } from "@/lib/slideshow";
import { cn, slugify } from "@/lib/utils";

export type PageEditorData = {
  id: string;
  title: string;
  slug: string;
  navLabel: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  noIndex: boolean;
  showInHeaderNav: boolean;
  showInFooterNav: boolean;
  navOrder: number;
  blocks: Block[];
  slideshow: SlideshowItem[];
  isSystem: boolean;
};

export function PageEditor({
  page,
  streams,
}: {
  page: PageEditorData;
  streams: Array<{ slug: string; title: string }>;
}) {
  const [form, setForm] = useState(page);
  const [tab, setTab] = useState<"content" | "settings">("content");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<
    { tone: "success" | "danger"; text: string } | null
  >(null);

  const context: EditorContext = useMemo(() => ({ streams }), [streams]);

  const update = useCallback(
    <K extends keyof PageEditorData>(key: K, value: PageEditorData[K]) => {
      setForm((current) => ({ ...current, [key]: value }));
      setDirty(true);
    },
    [],
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const save = useCallback(async () => {
    setSaving(true);
    setMessage(null);

    const result = await savePageAction(form.id, {
      title: form.title,
      slug: form.slug,
      navLabel: form.navLabel,
      status: form.status,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      ogImageUrl: form.ogImageUrl,
      noIndex: form.noIndex,
      showInHeaderNav: form.showInHeaderNav,
      showInFooterNav: form.showInFooterNav,
      navOrder: form.navOrder,
      blocks: form.blocks,
      slideshow: form.slideshow,
    });

    setSaving(false);

    if (result.ok) {
      setDirty(false);
      setForm((current) => ({ ...current, slug: result.slug }));
      setMessage({ tone: "success", text: "Page saved." });
      setTimeout(() => setMessage(null), 3500);
    } else {
      setMessage({ tone: "danger", text: result.error });
    }
  }, [form]);

  // Ctrl/Cmd+S matches the muscle memory of every other editor.
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

  const publicPath = form.slug === "home" ? "/" : `/${form.slug}`;

  return (
    <div>
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              href="/admin/pages"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              ← All pages
            </Link>
            <input
              type="text"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Page title"
              aria-label="Page title"
              className="mt-0.5 w-full truncate border-0 bg-transparent p-0 text-xl font-bold text-navy-900 focus:outline-none"
            />
            <p className="mt-0.5 truncate text-xs text-slate-500">
              {publicPath}
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
                update("status", event.target.value as PageEditorData["status"])
              }
              aria-label="Publish status"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-navy-800 focus:border-brand-500 focus:outline-none"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <Link
              href={publicPath}
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
            { id: "content", label: "Sections" },
            { id: "settings", label: "Settings & SEO" },
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

      {tab === "settings" ? (
        <PageSettings form={form} update={update} context={context} />
      ) : (
        <>
          <SlideshowEditor
            items={form.slideshow}
            onChange={(slideshow) => update("slideshow", slideshow)}
          />
          <BlockCanvas
            blocks={form.blocks}
            onChange={(blocks) => update("blocks", blocks)}
            context={context}
          />
        </>
      )}
    </div>
  );
}

function PageSettings({
  form,
  update,
  context,
}: {
  form: PageEditorData;
  update: <K extends keyof PageEditorData>(
    key: K,
    value: PageEditorData[K],
  ) => void;
  context: EditorContext;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-navy-900">Page address</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="slug" hint="The part of the URL after the domain.">
                URL slug
              </Label>
              <div className="flex items-center gap-1.5">
                <span className="shrink-0 text-sm text-slate-400">/</span>
                <input
                  id="slug"
                  type="text"
                  value={form.slug}
                  disabled={form.isSystem && form.slug === "home"}
                  onChange={(event) => update("slug", event.target.value)}
                  onBlur={(event) => update("slug", slugify(event.target.value))}
                  className={inputClass}
                />
              </div>
              {form.isSystem && (
                <p className="mt-1.5 text-xs text-amber-600">
                  This is a system page. Changing its address may break links
                  elsewhere on the site.
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="navLabel"
                hint="Shown in menus instead of the full title."
              >
                Menu label
              </Label>
              <input
                id="navLabel"
                type="text"
                value={form.navLabel}
                placeholder={form.title}
                onChange={(event) => update("navLabel", event.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-navy-900">Navigation</h2>
          <div className="space-y-2.5">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.showInHeaderNav}
                onChange={(event) =>
                  update("showInHeaderNav", event.target.checked)
                }
                className="mt-0.5 size-4 rounded border-slate-300 text-brand-600"
              />
              <span>
                <span className="block text-sm font-semibold text-navy-800">
                  Show in the header menu
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Only applies when no custom navigation has been configured.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.showInFooterNav}
                onChange={(event) =>
                  update("showInFooterNav", event.target.checked)
                }
                className="mt-0.5 size-4 rounded border-slate-300 text-brand-600"
              />
              <span className="block text-sm font-semibold text-navy-800">
                Show in the footer links
              </span>
            </label>

            <div>
              <Label htmlFor="navOrder" hint="Lower numbers appear first.">
                Menu order
              </Label>
              <input
                id="navOrder"
                type="number"
                min={0}
                max={999}
                value={form.navOrder}
                onChange={(event) =>
                  update("navOrder", Number.parseInt(event.target.value, 10) || 0)
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-bold text-navy-900">Search engine listing</h2>
          <p className="mb-4 text-xs text-slate-500">
            How this page appears in Google results.
          </p>

          <div className="space-y-4">
            <div>
              <Label
                htmlFor="metaTitle"
                hint={`${form.metaTitle.length}/60 characters`}
              >
                Meta title
              </Label>
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
              <Label
                htmlFor="metaDescription"
                hint={`${form.metaDescription.length}/160 characters`}
              >
                Meta description
              </Label>
              <textarea
                id="metaDescription"
                rows={3}
                value={form.metaDescription}
                onChange={(event) =>
                  update("metaDescription", event.target.value)
                }
                className={cn(inputClass, "resize-y")}
              />
            </div>

            <FieldEditor
              field={{
                kind: "image",
                key: "ogImageUrl",
                label: "Social sharing image",
                hint: "Shown when the page is shared on social media.",
              }}
              data={{ ogImageUrl: form.ogImageUrl }}
              context={context}
              onChange={(_key, value) => update("ogImageUrl", String(value ?? ""))}
            />

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.noIndex}
                onChange={(event) => update("noIndex", event.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-brand-600"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-800">
                  {form.noIndex ? (
                    <EyeOff className="size-3.5" aria-hidden="true" />
                  ) : (
                    <Eye className="size-3.5" aria-hidden="true" />
                  )}
                  Hide from search engines
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Adds a noindex tag and removes the page from the sitemap.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Google preview
          </p>
          <div className="mt-3">
            <p className="truncate text-xs text-slate-600">
              wirelesscom.ca › {form.slug}
            </p>
            <p className="mt-0.5 truncate text-base text-brand-700">
              {form.metaTitle || form.title} — WirelessCom.Ca Inc.
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">
              {form.metaDescription ||
                "Add a meta description to control this text."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
