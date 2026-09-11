export function parseDateInput(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateInputValue(value: Date | null | undefined): string {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function startOfTomorrow(): Date {
  const date = startOfToday();
  date.setDate(date.getDate() + 1);
  return date;
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

