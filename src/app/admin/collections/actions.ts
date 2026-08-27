"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordAudit } from "@/lib/audit";
import { getCollection } from "@/lib/admin-collections";
import {
  applyPublishedAt,
  delegateFor,
  findRecord,
  validateRecord,
} from "@/lib/admin-collections.server";
import { requireRole } from "@/lib/auth";

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Creates or updates one collection record.
 *
 * Returns a result rather than redirecting so the editor can report validation
 * problems inline without losing what the author typed.
 */
export async function saveCollectionRecordAction(
  collectionKey: string,
  id: string | null,
  values: Record<string, unknown>,
): Promise<SaveResult> {
  const collection = getCollection(collectionKey);
  if (!collection) return { ok: false, error: "Unknown collection." };

  const user = await requireRole(collection.writeRole);

  const validated = validateRecord(collection, values);
  if (!validated.ok) return { ok: false, error: validated.error };

  const existing = id ? await findRecord(collection, id) : null;
  if (id && !existing) return { ok: false, error: "That record no longer exists." };

  applyPublishedAt(collection, validated.data, existing);

  const delegate = delegateFor(collection);

  let savedId = id ?? "";
  try {
    if (id) {
      await delegate.update({ where: { id }, data: validated.data });
    } else {
      const created = await delegate.create({ data: validated.data });
      savedId = String(created.id);
    }
  } catch (error) {
    return { ok: false, error: describeWriteFailure(error) };
  }

  const title = String(validated.data[collection.titleField] ?? savedId).slice(0, 160);

  await recordAudit({
    action: id ? "collection.updated" : "collection.created",
    userId: user.id,
    entityType: collection.model,
    entityId: savedId,
    summary: `${collection.label}: ${title}`,
  });

  // Catalogue and knowledge content is read by public pages and the sitemap.
  revalidatePath("/", "layout");

  return { ok: true, id: savedId };
}

export async function deleteCollectionRecordAction(
  formData: FormData,
): Promise<void> {
  const collectionKey = String(formData.get("collection") ?? "");
  const id = String(formData.get("id") ?? "");

  const collection = getCollection(collectionKey);
  if (!collection || !id) redirect("/admin");

  // Deletion is always an admin action, even where editors may create.
  const user = await requireRole("ADMIN");

  const existing = await findRecord(collection, id);
  const title = existing
    ? String(existing[collection.titleField] ?? id).slice(0, 160)
    : id;

  await delegateFor(collection)
    .delete({ where: { id } })
    .catch(() => undefined);

  await recordAudit({
    action: "collection.deleted",
    userId: user.id,
    entityType: collection.model,
    entityId: id,
    summary: `${collection.label}: ${title}`,
  });

  revalidatePath("/", "layout");
  redirect(`/admin/collections/${collection.key}?deleted=1`);
}

/** Turns Prisma's constraint errors into something an author can act on. */
function describeWriteFailure(error: unknown): string {
  const code = (error as { code?: string }).code;

  if (code === "P2002") {
    const target = (error as { meta?: { target?: string[] } }).meta?.target;
    const field = target?.join(", ") ?? "value";
    return `Another record already uses that ${field}. Pick a different one.`;
  }
  if (code === "P2003" || code === "P2025") {
    return "A linked record is missing. Refresh the page and try again.";
  }

  return "The record could not be saved. Check the values and try again.";
}
