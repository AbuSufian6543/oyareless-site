import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { createTaskAction } from "@/app/admin/tasks/actions";
import { cn } from "@/lib/utils";

export type CalendarTask = {
  id: string;
  title: string;
  priority: string;
  assignees: string[];
};

export function WorkdeskCalendar({
  monthLabel,
  prevMonthKey,
  nextMonthKey,
  weeks,
  todayKey,
  selectedKey,
  selectedLabel,
  dueCounts,
  mine,
  others,
  unassigned,
  userId,
}: {
  monthLabel: string;
  prevMonthKey: string;
  nextMonthKey: string;
  weeks: string[][];
  todayKey: string;
  selectedKey: string;
  selectedLabel: string;
  dueCounts: Record<string, number>;
  mine: CalendarTask[];
  others: CalendarTask[];
  unassigned: CalendarTask[];
  userId: string;
}) {
  const weekday = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const returnTo = `/admin?day=${selectedKey}`;
  const total = mine.length + others.length + unassigned.length;

  return (
    <aside className="mx-auto w-full max-w-sm max-h-[calc(100vh-4.5rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,42,73,0.05)] xl:sticky xl:top-6 xl:mx-0 xl:max-w-none">
      <div className="mb-2 flex items-center justify-between gap-1">
        <Link
          href={`/admin?day=${prevMonthKey}`}
          className="rounded-md p-1 text-navy-500 hover:bg-slate-100 hover:text-navy-900"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <h2 className="text-sm font-bold text-navy-900">{monthLabel}</h2>
        <Link
          href={`/admin?day=${nextMonthKey}`}
          className="rounded-md p-1 text-navy-500 hover:bg-slate-100 hover:text-navy-900"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {weekday.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mt-0.5 grid grid-cols-7 gap-0.5">
        {weeks.flat().map((key, index) => {
          if (!key) return <span key={`empty-${index}`} className="h-8" />;
          const day = Number(key.slice(-2));
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const count = dueCounts[key] ?? 0;
          return (
            <Link
              key={key}
              href={`/admin?day=${key}`}
              aria-current={isSelected ? "date" : undefined}
              aria-label={`${key}${count ? `, ${count} task${count === 1 ? "" : "s"}` : ""}`}
              className={cn(
                "relative flex h-8 items-center justify-center rounded-md text-xs font-semibold transition",
                isSelected
                  ? "bg-brand-600 text-white"
                  : isToday
                    ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200"
                    : "text-navy-800 hover:bg-slate-100",
              )}
            >
              {day}
              {count > 0 && !isSelected ? (
                <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent-500" />
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex items-start justify-between gap-2 border-t border-slate-100 pt-3">
        <div>
          <p className="text-xs font-bold text-navy-900">{selectedLabel}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {total === 0
              ? "No work due this day yet."
              : `${mine.length} yours · ${others.length} others · ${unassigned.length} unassigned`}
          </p>
        </div>
        {selectedKey !== todayKey ? (
          <Link
            href={`/admin?day=${todayKey}`}
            className="shrink-0 text-[11px] font-semibold text-brand-700 hover:underline"
          >
            Today
          </Link>
        ) : null}
      </div>

      <DayGroup title="Assigned to me" items={mine} empty="Nothing of yours due this day." tone="mine" />
      <DayGroup
        title="Assigned to others"
        items={others}
        empty="No one else's work is due this day."
        tone="others"
      />
      {unassigned.length > 0 ? (
        <DayGroup title="Unassigned" items={unassigned} empty="" tone="unassigned" />
      ) : null}

      <form action={createTaskAction} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
        <input type="hidden" name="dueAt" value={selectedKey} />
        <input type="hidden" name="assigneeIds" value={userId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <label className="block text-xs font-semibold text-navy-800">
          New task for this day
          <input
            name="title"
            required
            minLength={3}
            maxLength={200}
            placeholder="Short title"
            className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-navy-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Create task
        </button>
        <Link
          href={`/admin/tasks/new?due=${selectedKey}`}
          className="block text-center text-[11px] font-semibold text-brand-700 hover:underline"
        >
          Open the full form
        </Link>
      </form>
    </aside>
  );
}

function DayGroup({
  title,
  items,
  empty,
  tone,
}: {
  title: string;
  items: CalendarTask[];
  empty: string;
  tone: "mine" | "others" | "unassigned";
}) {
  const chip =
    tone === "mine"
      ? "bg-brand-50 hover:bg-brand-100"
      : tone === "unassigned"
        ? "bg-amber-50 hover:bg-amber-100"
        : "bg-slate-50 hover:bg-slate-100";

  return (
    <section className="mt-3">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      {items.length === 0 ? (
        empty ? <p className="mt-1 text-xs text-slate-400">{empty}</p> : null
      ) : (
        <ul className="mt-1 space-y-1">
          {items.map((task) => (
            <li key={task.id}>
              <Link href={`/admin/tasks/${task.id}`} className={cn("block rounded-lg px-2 py-1.5", chip)}>
                <span className="block truncate text-xs font-semibold text-navy-900">{task.title}</span>
                {task.assignees.length > 0 ? (
                  <span className="block truncate text-[10px] text-slate-500">
                    {task.assignees.join(", ")}
                  </span>
                ) : null}
                {task.priority === "HIGH" || task.priority === "EMERGENCY" ? (
                  <span className="mt-0.5 inline-block text-[10px] font-bold uppercase tracking-wider text-rose-600">
                    {task.priority === "EMERGENCY" ? "Emergency" : "High"}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
