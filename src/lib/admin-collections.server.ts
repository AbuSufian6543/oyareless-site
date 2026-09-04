import "server-only";

import type { CollectionDefinition, CollectionField } from "@/lib/admin-collections";
import { getCollection } from "@/lib/admin-collections";
import { blocksSchema, parseBlocks, type Block } from "@/lib/blocks";
import { isCompanyStatusHost } from "@/lib/company-status-hosts";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

/**
 * The subset of a Prisma delegate the generic collection admin uses. Every
 * model in the registry satisfies it, so a single cast here keeps the rest of
 * the code typed instead of spreading `any` through the pages and actions.
 */
type Delegate = {
  findMany(args?: unknown): Promise<Array<Record<string, unknown>>>;
  findUnique(args: unknown): Promise<Record<string, unknown> | null>;
  create(args: unknown): Promise<Record<string, unknown>>;
  update(args: unknown): Promise<Record<string, unknown>>;
  delete(args: unknown): Promise<unknown>;
  count(args?: unknown): Promise<number>;
};

export function delegateFor(collection: CollectionDefinition): Delegate {
  const client = prisma as unknown as Record<string, Delegate | undefined>;
  const delegate = client[collection.model];
  if (!delegate) {
    throw new Error(`No Prisma model named "${collection.model}"`);
  }
  return delegate;
}

export type CollectionRecord = Record<string, unknown>;

export function buildSearchWhere(
  collection: CollectionDefinition,
  query: string,
): Record<string, unknown> | undefined {
  const trimmed = query.trim();
  if (!trimmed || collection.searchFields.length === 0) return undefined;

  return {
    OR: collection.searchFields.map((field) => ({
      [field]: { contains: trimmed, mode: "insensitive" },
    })),
  };
}

export async function listRecords(
  collection: CollectionDefinition,
  options: { query?: string; skip?: number; take?: number } = {},
): Promise<{ rows: CollectionRecord[]; total: number }> {
  const delegate = delegateFor(collection);
  const where = buildSearchWhere(collection, options.query ?? "");

  const [rows, total] = await Promise.all([
    delegate.findMany({
      where,
      orderBy: collection.orderBy,
      skip: options.skip ?? 0,
      take: options.take ?? 50,
    }),
    delegate.count({ where }),
  ]);

  return { rows, total };
}

export async function findRecord(
  collection: CollectionDefinition,
  id: string,
): Promise<CollectionRecord | null> {
  return delegateFor(collection).findUnique({ where: { id } });
}

/**
 * Loads id/label pairs for a `reference` field's dropdown.
 */
export async function referenceOptions(
  collectionKey: string,
): Promise<Array<{ value: string; label: string }>> {
  const target = getCollection(collectionKey);
  if (!target) return [];

  const rows = await delegateFor(target).findMany({
    orderBy: target.orderBy,
    take: 500,
  });

  return rows.map((row) => ({
    value: String(row.id),
    label: String(row[target.titleField] ?? row.id).slice(0, 90),
  }));
}

export type ValidationResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * Coerces one submitted value to the shape Prisma expects for its column.
 *
 * Optional string columns become `null` rather than `""` so "unset" is
 * represented once in the database instead of two ways.
 */
function coerce(
  field: CollectionField,
  raw: unknown,
): { value: unknown } | { error: string } {
  switch (field.kind) {
    case "text":
    case "slug": {
      let text = String(raw ?? "").trim();
      if (field.kind === "slug") text = slugify(text);
      if (field.maxLength) text = text.slice(0, field.maxLength);
      if (field.required && !text) return { error: `${field.label} is required.` };
      return { value: text || (field.required ? text : null) };
    }

    case "textarea": {
      let text = String(raw ?? "").trim();
      if (field.maxLength) text = text.slice(0, field.maxLength);
      if (field.required && !text) return { error: `${field.label} is required.` };
      return { value: text };
    }

    case "image":
    case "icon": {
      const text = String(raw ?? "").trim().slice(0, 500);
      return { value: text || null };
    }

    case "number": {
      if (isBlank(raw)) {
        if (field.required) return { error: `${field.label} is required.` };
        return { value: null };
      }
      const parsed = Number.parseInt(String(raw), 10);
      if (!Number.isFinite(parsed)) {
        return { error: `${field.label} must be a whole number.` };
      }
      const min = field.min ?? Number.MIN_SAFE_INTEGER;
      const max = field.max ?? Number.MAX_SAFE_INTEGER;
      return { value: Math.min(Math.max(parsed, min), max) };
    }

    case "boolean":
      return { value: raw === true || raw === "on" || raw === "true" };

    case "select": {
      const text = String(raw ?? "").trim();
      const allowed = (field.options ?? []).map((option) => option.value);
      if (!allowed.includes(text)) {
        // Fall back to the first option rather than writing an invalid enum.
        return { value: allowed[0] ?? null };
      }
      return { value: text };
    }

    case "tags": {
      const text = String(raw ?? "");
      const items = text
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 100);
      return { value: items };
    }

    case "datetime": {
      const text = String(raw ?? "").trim();
      if (!text) {
        if (field.required) return { error: `${field.label} is required.` };
        return { value: null };
      }
      const date = new Date(text);
      if (Number.isNaN(date.getTime())) {
        return { error: `${field.label} is not a valid date and time.` };
      }
      return { value: date };
    }

    case "reference": {
      const text = String(raw ?? "").trim();
      if (!text) {
        if (field.required) return { error: `${field.label} is required.` };
        return { value: null };
      }
      return { value: text };
    }

    case "blocks": {
      // Blocks arrive as already-parsed JSON from the editor.
      const parsed = blocksSchema.safeParse(raw ?? []);
      if (!parsed.success) {
        return { error: "One of the page sections is not valid." };
      }
      return { value: parsed.data };
    }
  }
}

export function validateRecord(
  collection: CollectionDefinition,
  input: Record<string, unknown>,
): ValidationResult {
  const data: Record<string, unknown> = {};

  for (const field of collection.fields) {
    // A field the form did not submit is left untouched, so a partial form
    // cannot blank out columns it does not render. Booleans are the exception:
    // an unchecked box submits nothing at all.
    if (!(field.name in input) && field.kind !== "boolean") continue;

    const result = coerce(field, input[field.name]);
    if ("error" in result) return { ok: false, error: result.error };
    data[field.name] = result.value;
  }

  // Derive a slug from its source field when the author left it blank.
  for (const field of collection.fields) {
    if (field.kind !== "slug" || !field.derivedFrom) continue;
    if (data[field.name]) continue;
    const source = data[field.derivedFrom] ?? input[field.derivedFrom];
    const derived = slugify(String(source ?? ""));
    if (!derived) return { ok: false, error: `${field.label} is required.` };
    data[field.name] = derived;
  }

  if (collection.model === "monitoredEndpoint") {
    const target = String(data.target ?? "");
    const website = String(data.websiteUrl ?? "");
    if (isCompanyStatusHost(target) || isCompanyStatusHost(website)) {
      data.isPublic = false;
    }
  }

  return { ok: true, data };
}

/** Models whose rows record when they first went live. */
const PUBLISHED_AT_MODELS = new Set(["kbArticle", "caseStudy"]);

/**
 * Stamps `publishedAt` the first time a row is published and leaves it alone
 * afterwards, so unpublishing and republishing does not rewrite history.
 */
export function applyPublishedAt(
  collection: CollectionDefinition,
  data: Record<string, unknown>,
  existing: CollectionRecord | null,
): void {
  if (!PUBLISHED_AT_MODELS.has(collection.model)) return;
  if (data.status !== "PUBLISHED") return;
  if (existing?.publishedAt) return;
  data.publishedAt = new Date();
}

/** Reads a collection record's blocks column for the editor. */
export function recordBlocks(record: CollectionRecord | null): Block[] {
  if (!record) return [];
  return parseBlocks(record.blocks);
}
