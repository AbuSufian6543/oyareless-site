"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";

export type DashboardWidget = {
  id: string;
  title: string;
  wide?: boolean;
  node: ReactNode;
};

type Prefs = {
  hidden: string[];
  collapsed: string[];
  order: string[];
};

function storageKey(userId: string) {
  return `wc-dashboard-widgets:${userId}`;
}

function readPrefs(userId: string, ids: string[]): Prefs {
  const fallback = { hidden: [], collapsed: [], order: ids };
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    const order = Array.isArray(parsed.order)
      ? parsed.order.filter((id): id is string => ids.includes(id))
      : [];
    for (const id of ids) {
      if (!order.includes(id)) order.push(id);
    }
    return {
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden.filter((id) => ids.includes(id)) : [],
      collapsed: Array.isArray(parsed.collapsed) ? parsed.collapsed.filter((id) => ids.includes(id)) : [],
      order,
    };
  } catch {
    return fallback;
  }
}

export function WidgetBoard({ userId, widgets }: { userId: string; widgets: DashboardWidget[] }) {
  const ids = widgets.map((widget) => widget.id);
  const [prefs, setPrefs] = useState<Prefs>({ hidden: [], collapsed: [], order: ids });
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    setPrefs(readPrefs(userId, ids));
    // The widget list is fixed for a signed-in render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function save(next: Prefs) {
    setPrefs(next);
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  }

  const byId = new Map(widgets.map((widget) => [widget.id, widget]));
  const ordered = prefs.order.map((id) => byId.get(id)).filter((widget): widget is DashboardWidget => Boolean(widget));

  function move(id: string, direction: -1 | 1) {
    const order = [...prefs.order];
    const index = order.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= order.length) return;
    const [item] = order.splice(index, 1);
    order.splice(target, 0, item);
    save({ ...prefs, order });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCustomizing((current) => !current)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-navy-800 transition duration-150 hover:border-brand-300 hover:bg-slate-50"
          aria-expanded={customizing}
        >
          <Settings2 className="size-3.5" aria-hidden="true" />
          Customize
        </button>
      </div>
      {customizing ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-navy-900">Dashboard widgets</p>
            <button
              type="button"
              className="text-xs font-semibold text-brand-700 hover:underline"
              onClick={() => {
                window.localStorage.removeItem(storageKey(userId));
                setPrefs({ hidden: [], collapsed: [], order: ids });
              }}
            >
              Restore default
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">Saved on this browser for your sign-in.</p>
          <ul className="mt-3 space-y-1">
            {ordered.map((widget, index) => {
              const hidden = prefs.hidden.includes(widget.id);
              return (
                <li key={widget.id} className="flex items-center gap-2 rounded-lg px-1 py-1">
                  <label className="flex min-w-0 flex-1 items-center gap-2 text-sm text-navy-900">
                    <input
                      type="checkbox"
                      checked={!hidden}
                      onChange={() =>
                        save({
                          ...prefs,
                          hidden: hidden
                            ? prefs.hidden.filter((id) => id !== widget.id)
                            : [...prefs.hidden, widget.id],
                        })
                      }
                    />
                    <span className="truncate">{widget.title}</span>
                  </label>
                  <button type="button" className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${widget.title} up`} disabled={index === 0} onClick={() => move(widget.id, -1)}>
                    <ChevronUp className="size-4" />
                  </button>
                  <button type="button" className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label={`Move ${widget.title} down`} disabled={index === ordered.length - 1} onClick={() => move(widget.id, 1)}>
                    <ChevronDown className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
      {ordered
        .filter((widget) => !prefs.hidden.includes(widget.id))
        .map((widget, index) => {
          const collapsed = prefs.collapsed.includes(widget.id);
          return (
            <section key={widget.id} className={`wc-row min-w-0 ${widget.wide ? "xl:col-span-2" : ""}`} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-slate-400">{widget.title}</h2>
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-500 transition-colors duration-150 hover:text-navy-900"
                  aria-expanded={!collapsed}
                  onClick={() =>
                    save({
                      ...prefs,
                      collapsed: collapsed
                        ? prefs.collapsed.filter((id) => id !== widget.id)
                        : [...prefs.collapsed, widget.id],
                    })
                  }
                >
                  {collapsed ? "Expand" : "Collapse"}
                </button>
              </div>
              <div className={`wc-collapse grid transition-[grid-template-rows] duration-300 ease-out ${collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}>
                <div className={collapsed ? "overflow-hidden" : "min-h-0 overflow-visible"}>
                  {widget.node}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
