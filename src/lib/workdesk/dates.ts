import {
  calendarDateKey,
  displayTimeZone,
  startOfZonedDay,
  zonedParts,
  zonedWallTime,
} from "@/lib/timezone";

export function parseDateInput(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [year, month, day] = trimmed.split("-").map(Number);
  const date = zonedWallTime(year, month, day, 12, 0, displayTimeZone());
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateInputValue(value: Date | null | undefined): string {
  if (!value) return "";
  return calendarDateKey(value);
}

export function startOfToday(): Date {
  return startOfZonedDay(new Date());
}

export function startOfTomorrow(): Date {
  const parts = zonedParts(startOfToday());
  return zonedWallTime(parts.year, parts.month, parts.day + 1, 0, 0);
}

export function isDueToday(dueAt: Date | null | undefined): boolean {
  if (!dueAt) return false;
  return dueAt >= startOfToday() && dueAt < startOfTomorrow();
}

export function isOverdue(
  dueAt: Date | null | undefined,
  status: string,
  doneStatuses: readonly string[],
): boolean {
  if (!dueAt) return false;
  if (doneStatuses.includes(status)) return false;
  return dueAt < startOfToday();
}
