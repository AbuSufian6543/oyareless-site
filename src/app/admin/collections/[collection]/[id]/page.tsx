import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteCollectionRecordAction } from "@/app/admin/collections/actions";
import { CollectionEditor } from "@/components/admin/collection-editor";
import { Card, CardTitle } from "@/components/admin/ui";
import { getCollection } from "@/lib/admin-collections";
import {
  findRecord,
  recordBlocks,
  referenceOptions,
} from "@/lib/admin-collections.server";
import { hasRole, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toStreamPickerOptions } from "@/lib/stream-picker";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string; id: string }>;
}) {
  const { collection: key, id } = await params;
  const collection = getCollection(key);
  if (!collection) return { title: "Not found" };
  return {
    title: id === "new" ? `New ${collection.label.toLowerCase()}` : collection.label,
  };
}

export default async function CollectionEditPage({
  params,
}: {
  params: Promise<{ collection: string; id: string }>;
}) {
  const { collection: key, id } = await params;

  const collection = getCollection(key);
  if (!collection) notFound();

  const user = await requireRole(collection.writeRole);
  const isNew = id === "new";

  const record = isNew ? null : await findRecord(collection, id);
  if (!isNew && !record) notFound();

  // Reference dropdowns and the stream picker used by embed/live blocks.
  const referenceFields = collection.fields.filter(
    (field) => field.kind === "reference" && field.referenceCollection,
  );

  const [referenceEntries, streams] = await Promise.all([
    Promise.all(
      referenceFields.map(async (field) => {
        const options = await referenceOptions(field.referenceCollection!);
        return [field.name, options] as const;
      }),
    ),
    prisma.stream
      .findMany({
        orderBy: { title: "asc" },
        select: {
          slug: true,
          title: true,
          isPublic: true,
          accessPasswordHash: true,
        },
      })
      .catch(() => []),
  ]);

  const initialValues: Record<string, unknown> = {};
  for (const field of collection.fields) {
    if (field.kind === "blocks") continue;
    initialValues[field.name] = record
      ? normalise(record[field.name], field.kind)
      : (field.defaultValue ?? blankFor(field.kind));
  }

  const canDelete = !isNew && hasRole(user, "ADMIN");
  const title = record
    ? String(record[collection.titleField] ?? "").slice(0, 80)
    : "";

  return (
    <div>
      <CollectionEditor
        collection={collection}
        recordId={isNew ? null : id}
        initialValues={initialValues}
        blocks={recordBlocks(record)}
        references={Object.fromEntries(referenceEntries)}
        streams={toStreamPickerOptions(streams)}
      />

      {canDelete && (
        <div className="mt-10 max-w-xl">
          <Card className="border-red-200">
            <CardTitle description="Deleting is permanent. Where the record has a status, set it to Archived instead if you may need it later.">
              Delete this {collection.label.toLowerCase()}
            </CardTitle>
            <form action={deleteCollectionRecordAction}>
              <input type="hidden" name="collection" value={collection.key} />
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete{title ? ` “${title}”` : ""}
              </button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

/** Prisma nulls become the empty values the controlled inputs expect. */
function normalise(value: unknown, kind: string): unknown {
  if (kind === "tags") return Array.isArray(value) ? value : [];
  if (kind === "boolean") return value === true;
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return value;
}

/** Used only where the registry gives no explicit default. */
function blankFor(kind: string): unknown {
  if (kind === "tags") return [];
  if (kind === "boolean") return false;
  return "";
}
