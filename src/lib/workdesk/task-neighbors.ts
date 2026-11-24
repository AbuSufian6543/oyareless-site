import "server-only";

import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import {
  OPEN_TASK,
  taskAssignedTo,
  taskAssignedToOthers,
  taskUnassigned,
} from "@/lib/workdesk/board";
import { startOfToday, startOfTomorrow } from "@/lib/workdesk/dates";
import { cleanWorkQuery, taskSearchWhere } from "@/lib/workdesk/list-search";

const VIEWS = ["mine", "team", "unassigned", "overdue", "today", "upcoming", "completed", "closed", "all"] as const;
type TaskView = (typeof VIEWS)[number];
type DueView = "overdue" | "today" | "upcoming";
type SortKey = "due" | "priority" | "updated" | "created" | "id";

export function safeTaskReturn(raw: string | undefined): string {
  if (!raw) return "/admin/tasks";
  try {
    const url = new URL(raw, "https://wirelesscom.local");
    if (url.pathname !== "/admin/tasks" && url.pathname !== "/admin") return "/admin/tasks";
    const next = new URLSearchParams();
    for (const key of ["view", "due", "sort", "q", "day"]) {
      const value = url.searchParams.get(key);
      if (value) next.set(key, value.slice(0, 80));
    }
    const qs = next.toString();
    return qs ? `${url.pathname}?${qs}` : url.pathname;
  } catch {
    return "/admin/tasks";
  }
}

export async function taskNeighbors(userId: string, fromPath: string, currentId: string) {
  const url = new URL(safeTaskReturn(fromPath), "https://wirelesscom.local");
  if (url.pathname !== "/admin/tasks") return { previous: null, next: null };
  const view = (VIEWS.includes(url.searchParams.get("view") as TaskView)
    ? url.searchParams.get("view")
    : "mine") as TaskView;
  const due = (["overdue", "today", "upcoming"] as const).includes(url.searchParams.get("due") as DueView)
    ? (url.searchParams.get("due") as DueView)
    : undefined;
  const sort = (["due", "priority", "updated", "created", "id"] as const).includes(url.searchParams.get("sort") as SortKey)
    ? (url.searchParams.get("sort") as SortKey)
    : undefined;
  const query = cleanWorkQuery(url.searchParams.get("q") ?? undefined);
  const today = startOfToday();
  const tomorrow = startOfTomorrow();
  const mine = { ...OPEN_TASK, ...taskAssignedTo(userId) };
  const team = { ...OPEN_TASK, ...taskAssignedToOthers(userId) };
  const unassigned = { ...OPEN_TASK, ...taskUnassigned() };
  const people = view === "team" ? team : view === "unassigned" ? unassigned : view === "all" ? OPEN_TASK : mine;
  const dueWhere =
    due === "overdue"
      ? { dueAt: { lt: today } }
      : due === "today"
        ? { dueAt: { gte: today, lt: tomorrow } }
        : due === "upcoming"
          ? { dueAt: { gte: tomorrow } }
          : null;
  const peopleView = view === "mine" || view === "team" || view === "unassigned" || view === "all";
  const where: Prisma.InternalTaskWhereInput =
    taskSearchWhere(query) ??
    (view === "completed"
      ? { status: "COMPLETED" }
      : view === "closed"
        ? { status: "CLOSED" }
        : dueWhere && peopleView
          ? { AND: [people, dueWhere] }
          : view === "team"
            ? team
            : view === "unassigned"
              ? unassigned
              : view === "overdue"
                ? { ...OPEN_TASK, dueAt: { lt: today } }
                : view === "today"
                  ? { ...OPEN_TASK, dueAt: { gte: today, lt: tomorrow } }
                  : view === "upcoming"
                    ? { ...OPEN_TASK, dueAt: { gte: tomorrow } }
                    : view === "all"
                      ? OPEN_TASK
                      : mine);
  const orderBy: Prisma.InternalTaskOrderByWithRelationInput[] =
    sort === "priority"
      ? [{ priority: "desc" }, { dueAt: "asc" }]
      : sort === "updated"
        ? [{ updatedAt: "desc" }]
        : sort === "created"
          ? [{ createdAt: "desc" }]
          : sort === "id"
            ? [{ reference: "desc" }]
            : sort === "due"
              ? [{ dueAt: "asc" }, { createdAt: "desc" }]
              : query || view === "completed" || view === "closed"
                ? [{ updatedAt: "desc" }]
                : [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }];
  const rows = await prisma.internalTask.findMany({
    where,
    orderBy,
    take: query ? 40 : 200,
    select: { id: true, reference: true },
  });
  const index = rows.findIndex((row) => row.id === currentId);
  if (index < 0) return { previous: null, next: null };
  return {
    previous: index > 0 ? rows[index - 1] : null,
    next: index < rows.length - 1 ? rows[index + 1] : null,
  };
}
