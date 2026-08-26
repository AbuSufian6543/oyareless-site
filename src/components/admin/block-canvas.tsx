"use client";

import { useState } from "react";
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
import { Copy, GripVertical, Plus, Settings2, Trash2 } from "lucide-react";

import { BlockPalette, RegistryIcon } from "@/components/admin/block-palette";
import { FieldEditor, type EditorContext } from "@/components/admin/field-editor";
import { BLOCK_FIELDS, SETTINGS_FIELDS } from "@/lib/block-fields";
import { createBlock, getBlockDefinition } from "@/lib/block-registry";
import { newBlockId, type Block, type BlockType } from "@/lib/blocks";
import { cn } from "@/lib/utils";

/**
 * Section list + inspector used by both the page builder and the post editor.
 * Owns only transient UI state; the block array itself stays with the caller.
 */
export function BlockCanvas({
  blocks,
  onChange,
  context,
  emptyLabel = "Add your first section",
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  context: EditorContext;
  emptyLabel?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(
    blocks[0]?.id ?? null,
  );
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const selected = blocks.find((block) => block.id === selectedId) ?? null;

  function addBlock(type: BlockType) {
    const block = createBlock(type);
    const at = insertIndex ?? blocks.length;
    const next = [...blocks];
    next.splice(at, 0, block);
    onChange(next);
    setSelectedId(block.id);
    setInsertIndex(null);
  }

  function patchData(blockId: string, key: string, value: unknown) {
    onChange(
      blocks.map((block) =>
        block.id === blockId
          ? ({ ...block, data: { ...block.data, [key]: value } } as Block)
          : block,
      ),
    );
  }

  function patchSettings(blockId: string, key: string, value: unknown) {
    onChange(
      blocks.map((block) =>
        block.id === blockId
          ? ({
              ...block,
              settings: { ...(block.settings ?? {}), [key]: value },
            } as Block)
          : block,
      ),
    );
  }

  function removeBlock(blockId: string) {
    const next = blocks.filter((block) => block.id !== blockId);
    onChange(next);
    if (selectedId === blockId) setSelectedId(next[0]?.id ?? null);
  }

  function duplicateBlock(blockId: string) {
    const index = blocks.findIndex((block) => block.id === blockId);
    if (index === -1) return;
    const copy = {
      ...structuredClone(blocks[index]),
      id: newBlockId(),
    } as Block;
    const next = [...blocks];
    next.splice(index + 1, 0, copy);
    onChange(next);
    setSelectedId(copy.id);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((block) => block.id === active.id);
    const to = blocks.findIndex((block) => block.id === over.id);
    if (from === -1 || to === -1) return;
    onChange(arrayMove(blocks, from, to));
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sections ({blocks.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                setInsertIndex(null);
                setPaletteOpen(true);
              }}
              className="inline-flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              Add
            </button>
          </div>

          {blocks.length === 0 ? (
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 transition-colors hover:border-brand-400 hover:bg-brand-50/40"
            >
              <Plus className="mx-auto mb-2 size-6" aria-hidden="true" />
              {emptyLabel}
            </button>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={blocks.map((block) => block.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1.5">
                  {blocks.map((block, index) => (
                    <SortableBlockRow
                      key={block.id}
                      block={block}
                      index={index}
                      selected={block.id === selectedId}
                      onSelect={() => setSelectedId(block.id)}
                      onRemove={() => removeBlock(block.id)}
                      onDuplicate={() => duplicateBlock(block.id)}
                      onInsertAfter={() => {
                        setInsertIndex(index + 1);
                        setPaletteOpen(true);
                      }}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div>
          {selected ? (
            <BlockInspector
              key={selected.id}
              block={selected}
              context={context}
              onDataChange={(key, value) => patchData(selected.id, key, value)}
              onSettingsChange={(key, value) =>
                patchSettings(selected.id, key, value)
              }
            />
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-12 text-center">
              <Settings2
                className="mx-auto mb-3 size-8 text-slate-400"
                aria-hidden="true"
              />
              <p className="text-sm text-slate-500">
                Select a section on the left to edit its content.
              </p>
            </div>
          )}
        </div>
      </div>

      <BlockPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onPick={addBlock}
      />
    </>
  );
}

function SortableBlockRow({
  block,
  index,
  selected,
  onSelect,
  onRemove,
  onDuplicate,
  onInsertAfter,
}: {
  block: Block;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onInsertAfter: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });
  const definition = getBlockDefinition(block.type);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("group relative", isDragging && "z-10 opacity-85")}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg border bg-white px-2 py-2 transition-colors",
          selected
            ? "border-brand-500 ring-1 ring-brand-500"
            : "border-slate-200 hover:border-slate-300",
        )}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
          aria-label={`Reorder ${definition?.label ?? block.type}`}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-md",
              selected ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500",
            )}
          >
            <RegistryIcon
              name={definition?.icon ?? "Square"}
              className="size-3.5"
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-navy-800">
              {definition?.label ?? block.type}
            </span>
            <span className="block truncate text-[0.6875rem] text-slate-400">
              {summarise(block) || `Section ${index + 1}`}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            type="button"
            onClick={onDuplicate}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Duplicate section"
            title="Duplicate"
          >
            <Copy className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete section"
            title="Delete"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onInsertAfter}
        className="absolute -bottom-1.5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-600 p-0.5 text-white opacity-0 transition-opacity hover:bg-brand-700 group-hover:opacity-100"
        aria-label="Insert section below"
        title="Insert below"
      >
        <Plus className="size-3" aria-hidden="true" />
      </button>
    </li>
  );
}

/** Short preview text so the section list is scannable. */
function summarise(block: Block): string {
  const data = block.data as Record<string, unknown>;
  for (const key of ["headline", "heading", "text", "title", "question"]) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return value.length > 42 ? `${value.slice(0, 42)}…` : value;
    }
  }
  if (block.type === "richText" && typeof data.html === "string") {
    const text = data.html.replace(/<[^>]*>/g, " ").trim();
    if (text) return text.length > 42 ? `${text.slice(0, 42)}…` : text;
  }
  return "";
}

function BlockInspector({
  block,
  context,
  onDataChange,
  onSettingsChange,
}: {
  block: Block;
  context: EditorContext;
  onDataChange: (key: string, value: unknown) => void;
  onSettingsChange: (key: string, value: unknown) => void;
}) {
  const definition = getBlockDefinition(block.type);
  const fields = BLOCK_FIELDS[block.type] ?? [];
  const [showAppearance, setShowAppearance] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <RegistryIcon name={definition?.icon ?? "Square"} className="size-4" />
        </span>
        <div>
          <h2 className="font-bold text-navy-900">
            {definition?.label ?? block.type}
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {definition?.description}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {fields.length === 0 ? (
          <p className="text-sm text-slate-500">
            This section has no editable content.
          </p>
        ) : (
          fields.map((field) => (
            <FieldEditor
              key={field.key}
              field={field}
              data={block.data as Record<string, unknown>}
              context={context}
              onChange={onDataChange}
            />
          ))
        )}
      </div>

      <div className="border-t border-slate-200">
        <button
          type="button"
          onClick={() => setShowAppearance((current) => !current)}
          className="flex w-full items-center gap-2 px-5 py-3.5 text-left text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
        >
          <Settings2 className="size-4 text-slate-400" aria-hidden="true" />
          Appearance & spacing
          <span className="ml-auto text-xs font-normal text-slate-400">
            {showAppearance ? "Hide" : "Show"}
          </span>
        </button>

        {showAppearance && (
          <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-5">
            {SETTINGS_FIELDS.map((field) => (
              <FieldEditor
                key={field.key}
                field={field}
                data={(block.settings ?? {}) as Record<string, unknown>}
                context={context}
                onChange={onSettingsChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
