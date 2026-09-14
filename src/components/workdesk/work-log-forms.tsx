"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Plus, X } from "lucide-react";

import {
  addProductUsageAction,
  addTimeEntryAction,
} from "@/app/workdesk/log-actions";
import { dateInputValue } from "@/lib/workdesk/dates";
import { MAX_WORK_NOTE_LINES, parseLoggedMinutes } from "@/lib/workdesk/hours";
import { TIME_ENTRY_KIND_LABELS, TIME_ENTRY_KINDS } from "@/lib/workdesk/labels";

const CUSTOM_PRODUCT = "__custom__";
const DURATION_PRESETS = [
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "45m", minutes: 45 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "4h", minutes: 240 },
] as const;

type CatalogRow = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  category: string;
};

function TargetFields({ ticketId, taskId }: { ticketId?: string; taskId?: string }) {
  return (
    <>
      {ticketId ? <input type="hidden" name="ticketId" value={ticketId} /> : null}
      {taskId ? <input type="hidden" name="taskId" value={taskId} /> : null}
    </>
  );
}

type NoteRow = { id: string; text: string };

function newNoteRow(): NoteRow {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `note-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text: "",
  };
}

function WorkDoneFields() {
  const [rows, setRows] = useState<NoteRow[]>(() => [newNoteRow()]);
  const canAdd = rows.length < MAX_WORK_NOTE_LINES;

  function update(id: string, text: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, text } : row)));
  }

  function add() {
    if (!canAdd) return;
    setRows((current) => [...current, newNoteRow()]);
  }

  function remove(id: string) {
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)));
  }

  return (
    <fieldset className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
      <legend className="px-0.5 text-xs font-semibold text-navy-800">
        What did you do? <span className="font-normal text-slate-500">(optional)</span>
      </legend>
      <p className="mb-2.5 text-[11px] leading-relaxed text-slate-500">
        One step per box, with space to write. Use + if you did more than one thing.
      </p>
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={row.id} className="flex items-start gap-2">
            <span
              className="mt-2.5 w-5 shrink-0 text-center text-xs font-bold tabular-nums text-slate-400"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <input
              name="noteLine"
              value={row.text}
              onChange={(event) => update(row.id, event.target.value)}
              maxLength={200}
              autoComplete="off"
              placeholder={
                index === 0
                  ? "e.g. Replaced the north tower radio"
                  : "Another step…"
              }
              aria-label={`Work step ${index + 1}`}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm leading-snug"
            />
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => remove(row.id)}
                aria-label={`Remove step ${index + 1}`}
                className="mt-1.5 rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-600"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {canAdd ? (
        <button
          type="button"
          onClick={add}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-navy-800 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add another step
        </button>
      ) : (
        <p className="mt-2 text-[11px] text-slate-500">Maximum of {MAX_WORK_NOTE_LINES} steps.</p>
      )}
    </fieldset>
  );
}

function PendingSubmit({
  label,
  busy,
  disabled,
}: {
  label: string;
  busy: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? busy : label}
    </button>
  );
}

export function TimeLogForm({ ticketId, taskId }: { ticketId?: string; taskId?: string }) {
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");
  const [kind, setKind] = useState<(typeof TIME_ENTRY_KINDS)[number]>("ONSITE");
  const today = dateInputValue(new Date());
  const total = parseLoggedMinutes(hours, minutes);
  const activePreset = DURATION_PRESETS.find((preset) => preset.minutes === total)?.minutes;

  return (
    <form action={addTimeEntryAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
      <TargetFields ticketId={ticketId} taskId={taskId} />
      <div>
        <p className="text-xs font-semibold text-navy-800">Quick duration</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset.minutes}
              type="button"
              onClick={() => {
                setHours(String(Math.floor(preset.minutes / 60)));
                setMinutes(String(preset.minutes % 60));
              }}
              className={
                activePreset === preset.minutes
                  ? "rounded-full bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white"
                  : "rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-navy-800 hover:bg-slate-50"
              }
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs font-semibold text-navy-800">
          Hours
          <input
            name="hours"
            type="number"
            min="0"
            max="24"
            step="1"
            inputMode="numeric"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-navy-800">
          Minutes
          <input
            name="minutes"
            type="number"
            min="0"
            max="59"
            step="1"
            inputMode="numeric"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      <fieldset>
        <legend className="text-xs font-semibold text-navy-800">Type of work</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {TIME_ENTRY_KINDS.map((value) => (
            <label
              key={value}
              className={
                kind === value
                  ? "cursor-pointer rounded-full bg-navy-900 px-2.5 py-1 text-xs font-semibold text-white"
                  : "cursor-pointer rounded-full border border-slate-300 px-2.5 py-1 text-xs font-semibold text-navy-800 hover:bg-slate-50"
              }
            >
              <input
                type="radio"
                name="kind"
                value={value}
                checked={kind === value}
                onChange={() => setKind(value)}
                className="sr-only"
              />
              {TIME_ENTRY_KIND_LABELS[value]}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-xs font-semibold text-navy-800">
        Worked on
        <input
          name="workedOn"
          type="date"
          required
          defaultValue={today}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <WorkDoneFields />
      <PendingSubmit label="Log time" busy="Saving…" disabled={!total} />
    </form>
  );
}

export function ProductLogForm({
  ticketId,
  taskId,
  catalog,
  canSaveToCatalog,
}: {
  ticketId?: string;
  taskId?: string;
  catalog: CatalogRow[];
  canSaveToCatalog: boolean;
}) {
  const [selected, setSelected] = useState("");
  const custom = selected === CUSTOM_PRODUCT || catalog.length === 0;
  const groups = useMemo(() => {
    const map = new Map<string, CatalogRow[]>();
    for (const product of catalog) {
      const key = product.category || "General";
      const list = map.get(key) ?? [];
      list.push(product);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [catalog]);

  return (
    <form action={addProductUsageAction} className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
      <TargetFields ticketId={ticketId} taskId={taskId} />
      {catalog.length > 0 ? (
        <label className="block text-xs font-semibold text-navy-800">
          Product
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            name={custom ? undefined : "productName"}
            required={!custom}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Choose from the list…</option>
            {groups.map(([category, items]) => (
              <optgroup key={category} label={category}>
                {items.map((product) => (
                  <option key={product.id} value={product.name}>
                    {product.name}
                    {product.sku ? ` · ${product.sku}` : ""} · {product.unit}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value={CUSTOM_PRODUCT}>Something else — type a name</option>
          </select>
        </label>
      ) : null}
      {custom ? (
        <label className="block text-xs font-semibold text-navy-800">
          {catalog.length > 0 ? "Product name" : "Product"}
          <input
            name="productName"
            required
            maxLength={120}
            placeholder="Cat6 Ethernet cable"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs font-semibold text-navy-800">
          Quantity
          <input
            name="quantity"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue="1"
            required
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs font-semibold text-navy-800">
          Serial or note <span className="font-normal text-slate-500">(optional)</span>
          <input
            name="note"
            maxLength={200}
            placeholder="SN / location"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>
      {canSaveToCatalog && custom ? (
        <>
          <label className="flex items-center gap-2 text-xs text-navy-800">
            <input type="checkbox" name="saveToCatalog" value="1" className="size-4" />
            Save a new name to the product list
          </label>
          <p className="text-xs text-slate-500">
            <Link href="/admin/products" className="font-semibold text-brand-700 hover:underline">
              Manage product list
            </Link>
          </p>
        </>
      ) : canSaveToCatalog ? (
        <p className="text-xs text-slate-500">
          <Link href="/admin/products" className="font-semibold text-brand-700 hover:underline">
            Manage product list
          </Link>
        </p>
      ) : null}
      <PendingSubmit label="Add product" busy="Saving…" />
    </form>
  );
}
