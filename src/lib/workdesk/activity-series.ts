/**
 * Turns a small SQL bucket list into the seven days drawn on the dashboard.
 * The chart never receives raw event rows.
 */

const TASK_UPDATES = new Set([
  "STATUS_CHANGED",
  "PRIORITY_CHANGED",
  "DUE_DATE_CHANGED",
  "NOTE",
  "MESSAGE",
  "ATTACHMENT",
  "ASSIGNED",
  "REASSIGNED",
  "TIME_LOGGED",
  "TIME_REMOVED",
  "PRODUCT_USED",
  "PRODUCT_REMOVED",
]);

export type ActivityBucket = {
  day: string;
  kind: string;
  onTask: boolean;
  count: number;
};

export type DayActivity = {
  key: string;
  label: string;
  total: number;
  created: number;
  completed: number;
  updates: number;
  other: number;
};

export function seriesFromBuckets(
  buckets: ActivityBucket[],
  days: Array<{ key: string; label: string }>,
): DayActivity[] {
  const byDay = new Map<string, DayActivity>();
  for (const day of days) {
    byDay.set(day.key, {
      key: day.key,
      label: day.label,
      total: 0,
      created: 0,
      completed: 0,
      updates: 0,
      other: 0,
    });
  }

  for (const bucket of buckets) {
    const point = byDay.get(bucket.day);
    if (!point || bucket.count <= 0) continue;
    point.total += bucket.count;
    if (bucket.onTask && bucket.kind === "CREATED") point.created += bucket.count;
    else if (bucket.onTask && bucket.kind === "COMPLETED") point.completed += bucket.count;
    else if (bucket.onTask && TASK_UPDATES.has(bucket.kind)) point.updates += bucket.count;
    else point.other += bucket.count;
  }

  return days.map((day) => byDay.get(day.key)!);
}
