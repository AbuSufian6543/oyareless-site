"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  when: string;
  href: string;
  unread: boolean;
};

const SWEEP_MS = 560;

function motionMs(full: number): number {
  if (typeof window === "undefined") return full;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 40 : full;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function NotificationInbox({
  items,
  markAllRead,
  clearOne,
  clearAll,
}: {
  items: NotificationRow[];
  markAllRead: () => Promise<void>;
  clearOne: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}) {
  const [rows, setRows] = useState(items);
  const [leaving, setLeaving] = useState<Record<string, number>>({});
  const [justCleared, setJustCleared] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(0);
  const removed = useRef(new Set<string>());
  const signature = items.map((item) => item.id).join("\n");

  useEffect(() => {
    if (pending.current > 0) return;
    const next = items.filter((item) => !removed.current.has(item.id));
    setRows(next);
    if (next.length > 0) setJustCleared(false);
    // The signature is the server list. `items` is read from that same render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const unread = rows.filter((row) => row.unread).length;
  const busy = Object.keys(leaving).length > 0;

  async function dismiss(id: string, delay = 0) {
    pending.current += 1;
    setError("");
    setLeaving((current) => ({ ...current, [id]: delay }));
    try {
      await wait(motionMs(SWEEP_MS + delay));
      removed.current.add(id);
      setRows((current) => current.filter((row) => row.id !== id));
      setLeaving((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      await clearOne(id);
    } catch {
      removed.current.delete(id);
      const original = items.find((row) => row.id === id);
      if (original) {
        setRows((current) =>
          current.some((row) => row.id === id) ? current : [original, ...current],
        );
      }
      setError("That notification could not be cleared. Try again.");
      setLeaving((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    } finally {
      pending.current = Math.max(0, pending.current - 1);
    }
  }

  async function dismissAll() {
    if (rows.length === 0 || busy) return;
    pending.current += 1;
    setError("");
    setJustCleared(true);
    const step = Math.min(42, Math.floor(520 / Math.max(rows.length, 1)));
    const next: Record<string, number> = {};
    rows.forEach((row, index) => {
      next[row.id] = index * step;
      removed.current.add(row.id);
    });
    setLeaving(next);
    const tail = (rows.length - 1) * step;
    try {
      await wait(motionMs(SWEEP_MS + tail));
      setRows([]);
      setLeaving({});
      await clearAll();
    } catch {
      for (const row of rows) removed.current.delete(row.id);
      setJustCleared(false);
      setError("Notifications could not be cleared. Try again.");
      setLeaving({});
      setRows(items.filter((item) => !removed.current.has(item.id)));
    } finally {
      pending.current = Math.max(0, pending.current - 1);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {rows.length === 0
            ? "Nothing in this list."
            : unread > 0
              ? `${unread} unread of ${rows.length}`
              : `${rows.length} read`}
        </p>
        <div className="flex flex-wrap gap-2">
          <form action={markAllRead}>
            <button
              type="submit"
              disabled={unread === 0 || busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              Mark all read
            </button>
          </form>
          <button
            type="button"
            onClick={() => void dismissAll()}
            disabled={rows.length === 0 || busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear all
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-live="polite">
        {rows.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <Bell className="mx-auto size-8 text-slate-300" aria-hidden="true" />
            <p className="mt-3 font-semibold text-navy-900">
              {justCleared ? "All clear" : "No notifications yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {justCleared
                ? "Those updates are off your list. Tickets and tasks are unchanged."
                : "Assignments and updates will show up here."}
            </p>
          </div>
        ) : (
          <ul>
            {rows.map((item) => {
              const delay = leaving[item.id];
              const isLeaving = delay !== undefined;
              return (
                <li
                  key={item.id}
                  className={isLeaving ? "wc-notice-away" : undefined}
                  style={isLeaving ? { animationDelay: `${delay}ms` } : undefined}
                >
                  <div
                    className={`flex items-start gap-2 px-3 py-3 ${
                      item.unread ? "bg-brand-50/70" : "bg-white"
                    }`}
                  >
                    <span
                      className={`mt-2 size-2 shrink-0 rounded-full ${
                        item.unread ? "bg-brand-600" : "bg-transparent"
                      }`}
                      aria-hidden="true"
                    />
                    <Link href={item.href} className="min-w-0 flex-1 rounded-lg py-0.5">
                      <p className="font-semibold text-navy-900">{item.title}</p>
                      <p className="text-sm text-slate-600">{item.body}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.when}</p>
                    </Link>
                    <button
                      type="button"
                      aria-label={`Clear notification: ${item.title}`}
                      disabled={busy && !isLeaving}
                      onClick={() => void dismiss(item.id)}
                      className="mt-0.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-navy-800"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
