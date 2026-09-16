"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
} from "lucide-react";

import {
  deleteNavItemAction,
  reorderNavItemsAction,
  saveNavItemAction,
  setNavItemVisibleAction,
} from "@/app/admin/navigation/actions";
import {
  CheckboxField,
  SelectField,
  TextField,
} from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export type NavEditorItem = {
  id: string;
  label: string;
  href: string;
  location: "HEADER" | "FOOTER" | "UTILITY";
  order: number;
  parentId: string | null;
  isVisible: boolean;
  openInNewTab: boolean;
};

const LOCATION_LABELS = {
  HEADER: "Header — Services, Tools, Support, Company",
  FOOTER: "Footer columns",
  UTILITY: "Top utility bar",
} as const;

export function NavMenuEditor({
  items,
  linkSuggestions,
}: {
  items: NavEditorItem[];
  linkSuggestions: Array<{ value: string; label: string }>;
}) {
  const [rows, setRows] = useState(items);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setRows(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const byLocation = useMemo(() => {
    return (["HEADER", "FOOTER", "UTILITY"] as const).map((location) => ({
      location,
      parents: sortRows(rows.filter((row) => row.location === location && !row.parentId)),
    }));
  }, [rows]);

  function childrenOf(parentId: string) {
    return sortRows(rows.filter((row) => row.parentId === parentId));
  }

  function persist(next: NavEditorItem[]) {
    setRows(next);
    startTransition(async () => {
      const result = await reorderNavItemsAction(
        next.map((row) => ({
          id: row.id,
          order: row.order,
          parentId: row.parentId,
        })),
      );
      if (!result.ok) setError(result.error);
      else setError("");
    });
  }

  function rewriteOrders(list: NavEditorItem[], parentId: string | null, location: NavEditorItem["location"]) {
    const siblings = sortRows(
      list.filter((row) => row.parentId === parentId && row.location === location),
    );
    const orderById = new Map(siblings.map((row, index) => [row.id, index]));
    return list.map((row) => {
      const order = orderById.get(row.id);
      return order === undefined ? row : { ...row, order };
    });
  }

  function moveSibling(id: string, direction: -1 | 1) {
    const current = rows.find((row) => row.id === id);
    if (!current) return;
    const siblings = sortRows(
      rows.filter(
        (row) => row.parentId === current.parentId && row.location === current.location,
      ),
    );
    const index = siblings.findIndex((row) => row.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= siblings.length) return;
    const reordered = arrayMove(siblings, index, nextIndex);
    const orderById = new Map(reordered.map((row, order) => [row.id, order]));
    persist(
      rows.map((row) => {
        const order = orderById.get(row.id);
        return order === undefined ? row : { ...row, order };
      }),
    );
  }

  function moveToParent(id: string, parentId: string | null) {
    const current = rows.find((row) => row.id === id);
    if (!current || current.parentId === parentId) return;
    const nextParent = parentId
      ? rows.find((row) => row.id === parentId)
      : null;
    const location = nextParent?.location ?? current.location;
    const destSiblings = sortRows(
      rows.filter(
        (row) =>
          row.id !== id &&
          row.parentId === parentId &&
          row.location === location,
      ),
    );
    let next = rows.map((row) =>
      row.id === id
        ? { ...row, parentId, location, order: destSiblings.length }
        : row,
    );
    next = rewriteOrders(next, current.parentId, current.location);
    next = rewriteOrders(next, parentId, location);
    persist(next);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = rows.find((row) => row.id === active.id);
    const to = rows.find((row) => row.id === over.id);
    if (!from || !to) return;
    if (from.location !== to.location) return;

    const sameParent = from.parentId === to.parentId;
    const fromIsTop = !from.parentId;
    const toIsTop = !to.parentId;
    if (fromIsTop !== toIsTop) return;

    if (sameParent) {
      const siblings = sortRows(
        rows.filter(
          (row) => row.parentId === from.parentId && row.location === from.location,
        ),
      );
      const oldIndex = siblings.findIndex((row) => row.id === from.id);
      const newIndex = siblings.findIndex((row) => row.id === to.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const reordered = arrayMove(siblings, oldIndex, newIndex);
      const orderById = new Map(reordered.map((row, order) => [row.id, order]));
      persist(
        rows.map((row) => {
          const order = orderById.get(row.id);
          return order === undefined ? row : { ...row, order };
        }),
      );
      return;
    }

    moveToParent(from.id, to.parentId);
  }

  function toggleVisible(id: string, isVisible: boolean) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, isVisible } : row)),
    );
    startTransition(async () => {
      const result = await setNavItemVisibleAction(id, isVisible);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {pending ? (
        <p className="text-xs font-medium text-slate-500">Saving menu order…</p>
      ) : (
        <p className="text-xs text-slate-500">
          Drag the handle, or use the arrows, to change the order visitors see.
          Hidden links stay in this list but not on the public site.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        {byLocation.map(({ location, parents }) =>
          parents.length === 0 ? null : (
            <section key={location} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-3.5">
                <h2 className="font-bold text-navy-900">{LOCATION_LABELS[location]}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {location === "HEADER"
                    ? "These dropdowns are the public Services, Tools, Support, and Company menus."
                    : `${parents.length} group${parents.length === 1 ? "" : "s"}`}
                </p>
              </div>

              <SortableContext
                items={parents.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="divide-y divide-slate-100">
                  {parents.map((parent) => (
                    <li key={parent.id} className="bg-white">
                      <MenuRow
                        item={parent}
                        depth={0}
                        parents={parents}
                        pending={pending}
                        onMove={moveSibling}
                        onMoveToParent={moveToParent}
                        onToggleVisible={toggleVisible}
                        linkSuggestions={linkSuggestions}
                      />
                      <ChildList
                        parent={parent}
                        childrenItems={childrenOf(parent.id)}
                        parents={parents}
                        pending={pending}
                        onMove={moveSibling}
                        onMoveToParent={moveToParent}
                        onToggleVisible={toggleVisible}
                        linkSuggestions={linkSuggestions}
                      />
                    </li>
                  ))}
                </ul>
              </SortableContext>
            </section>
          ),
        )}
      </DndContext>
    </div>
  );
}

function ChildList({
  parent,
  childrenItems,
  parents,
  pending,
  onMove,
  onMoveToParent,
  onToggleVisible,
  linkSuggestions,
}: {
  parent: NavEditorItem;
  childrenItems: NavEditorItem[];
  parents: NavEditorItem[];
  pending: boolean;
  onMove: (id: string, direction: -1 | 1) => void;
  onMoveToParent: (id: string, parentId: string | null) => void;
  onToggleVisible: (id: string, isVisible: boolean) => void;
  linkSuggestions: Array<{ value: string; label: string }>;
}) {
  if (childrenItems.length === 0) {
    if (parent.label === "Home") return null;
    return (
      <p className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-500">
        No pages in {parent.label} yet. Add one with the form on the right, and
        set the parent to {parent.label}.
      </p>
    );
  }

  return (
    <SortableContext
      items={childrenItems.map((item) => item.id)}
      strategy={verticalListSortingStrategy}
    >
      <ul className="border-t border-slate-100 bg-slate-50/80">
        {childrenItems.map((item) => (
          <li key={item.id} className="border-b border-slate-100 last:border-b-0">
            <MenuRow
              item={item}
              depth={1}
              parents={parents}
              pending={pending}
              onMove={onMove}
              onMoveToParent={onMoveToParent}
              onToggleVisible={onToggleVisible}
              linkSuggestions={linkSuggestions}
            />
          </li>
        ))}
      </ul>
    </SortableContext>
  );
}

function MenuRow({
  item,
  depth,
  parents,
  pending,
  onMove,
  onMoveToParent,
  onToggleVisible,
  linkSuggestions,
}: {
  item: NavEditorItem;
  depth: number;
  parents: NavEditorItem[];
  pending: boolean;
  onMove: (id: string, direction: -1 | 1) => void;
  onMoveToParent: (id: string, parentId: string | null) => void;
  onToggleVisible: (id: string, isVisible: boolean) => void;
  linkSuggestions: Array<{ value: string; label: string }>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "px-4 py-2.5 sm:px-5",
        depth > 0 && "pl-8 sm:pl-12",
        isDragging && "z-10 bg-white shadow-card",
        !item.isVisible && "opacity-60",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="shrink-0 cursor-grab rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-navy-800 active:cursor-grabbing"
          aria-label={`Drag ${item.label}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-semibold",
              item.isVisible ? "text-navy-900" : "text-slate-500 line-through",
            )}
          >
            {item.label}
          </p>
          <p className="truncate font-mono text-[0.7rem] text-slate-500">{item.href}</p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => onMove(item.id, -1)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-800 disabled:opacity-40"
            aria-label={`Move ${item.label} up`}
          >
            <ChevronUp className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onMove(item.id, 1)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-800 disabled:opacity-40"
            aria-label={`Move ${item.label} down`}
          >
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => onToggleVisible(item.id, !item.isVisible)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-800 disabled:opacity-40"
            aria-label={item.isVisible ? `Hide ${item.label}` : `Show ${item.label}`}
          >
            {item.isVisible ? (
              <Eye className="size-4" aria-hidden="true" />
            ) : (
              <EyeOff className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-xs font-semibold text-brand-700">
          Edit label, link, or group
        </summary>
        <form action={saveNavItemAction} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="location" value={item.location} />
          <input type="hidden" name="order" value={item.order} />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="Label" name="label" required defaultValue={item.label} />
            <div>
              <TextField
                label="Link"
                name="href"
                required
                defaultValue={item.href}
                list={`nav-links-${item.id}`}
              />
              <datalist id={`nav-links-${item.id}`}>
                {linkSuggestions.map((suggestion) => (
                  <option key={suggestion.value} value={suggestion.value}>
                    {suggestion.label}
                  </option>
                ))}
              </datalist>
            </div>
            {depth > 0 ? (
              <SelectField
                label="Show under"
                name="parentId"
                defaultValue={item.parentId ?? ""}
                options={parents
                  .filter((parent) => parent.id !== item.id)
                  .map((parent) => ({ value: parent.id, label: parent.label }))}
              />
            ) : (
              <input type="hidden" name="parentId" value="" />
            )}
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <CheckboxField
              label="Visible on the public site"
              name="isVisible"
              defaultChecked={item.isVisible}
            />
            <CheckboxField
              label="Open in a new tab"
              name="openInNewTab"
              defaultChecked={item.openInNewTab}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Save
            </button>
            {depth > 0 ? (
              <label className="flex items-center gap-2 text-xs text-slate-600">
                Move to
                <select
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-navy-800"
                  value={item.parentId ?? ""}
                  onChange={(event) => onMoveToParent(item.id, event.target.value || null)}
                >
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </form>
        <form action={deleteNavItemAction} className="mt-2">
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Remove
          </button>
          <span className="ml-2 text-xs text-slate-500">
            Prefer Hide for a built-in page — removing it can put it back on the next deploy.
          </span>
        </form>
      </details>
    </div>
  );
}

function sortRows(items: NavEditorItem[]) {
  return [...items].sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}
