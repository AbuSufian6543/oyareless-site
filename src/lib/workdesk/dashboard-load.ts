import "server-only";

import { cache } from "react";

import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canAccessApplications,
  canAccessEnquiries,
} from "@/lib/staff-access";
import { formatDate } from "@/lib/utils";
import { calendarDateKey } from "@/lib/timezone";
import { getResolvedMail } from "@/lib/mail-settings";
import { addZonedDays, startOfToday, startOfTomorrow } from "@/lib/workdesk/dates";
import {
  seriesFromBuckets,
  type ActivityBucket,
  type DayActivity,
} from "@/lib/workdesk/activity-series";

function weekdayShort(date: Date) {
  return formatDate(date, { weekday: "short" }).slice(0, 3);
}

export type { DayActivity };

export type DashboardBounds = {
  todayMs: number;
  tomorrowMs: number;
  weekMs: number;
  activitySinceMs: number;
};

export function currentDashboardBounds(now = new Date()): DashboardBounds {
  const today = startOfToday();
  const tomorrow = startOfTomorrow();
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    weekday: "short",
  }).format(now);
  const weekIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
  const weekStartMonday = addZonedDays(today, weekIndex < 0 ? 0 : -weekIndex);
  return {
    todayMs: today.getTime(),
    tomorrowMs: tomorrow.getTime(),
    weekMs: weekStartMonday.getTime(),
    activitySinceMs: addZonedDays(today, -13).getTime(),
  };
}

export type WorkdeskRollup = {
  openTasks: number;
  dueToday: number;
  upcoming: number;
  overdue: number;
  unassignedTasks: number;
  completedThisWeek: number;
  myOpenTasks: number;
  othersOpenTasks: number;
  myDoneTasks: number;
  openTickets: number;
  myOpenTickets: number;
  othersOpenTickets: number;
  unassignedTickets: number;
  status: Record<"OPEN" | "IN_PROGRESS" | "WAITING" | "COMPLETED" | "CLOSED", number>;
};

function n(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * One pass over tasks and one pass over tickets.
 * Not stored across requests: a completed task must show as completed on the next load.
 */
export const loadWorkdeskRollup = cache(
  async (userId: string, todayMs: number, tomorrowMs: number, weekMs: number): Promise<WorkdeskRollup> => {
    const today = new Date(todayMs);
    const tomorrow = new Date(tomorrowMs);
    const week = new Date(weekMs);
    const [tasks, tickets] = await Promise.all([
      prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT
          count(*) FILTER (WHERE status::text NOT IN ('COMPLETED', 'CLOSED'))::int AS "openTasks",
          count(*) FILTER (
            WHERE status::text NOT IN ('COMPLETED', 'CLOSED')
              AND "dueAt" >= ${today} AND "dueAt" < ${tomorrow}
          )::int AS "dueToday",
          count(*) FILTER (
            WHERE status::text NOT IN ('COMPLETED', 'CLOSED') AND "dueAt" >= ${tomorrow}
          )::int AS "upcoming",
          count(*) FILTER (
            WHERE status::text NOT IN ('COMPLETED', 'CLOSED') AND "dueAt" < ${today}
          )::int AS "overdue",
          count(*) FILTER (
            WHERE status::text NOT IN ('COMPLETED', 'CLOSED')
              AND NOT EXISTS (
                SELECT 1 FROM "InternalTaskAssignee" a WHERE a."taskId" = "InternalTask".id
              )
          )::int AS "unassignedTasks",
          count(*) FILTER (
            WHERE "completedAt" >= ${week} OR "closedAt" >= ${week}
          )::int AS "completedThisWeek",
          count(*) FILTER (
            WHERE status::text NOT IN ('COMPLETED', 'CLOSED')
              AND EXISTS (
                SELECT 1 FROM "InternalTaskAssignee" a
                WHERE a."taskId" = "InternalTask".id AND a."userId" = ${userId}
              )
          )::int AS "myOpenTasks",
          count(*) FILTER (
            WHERE status::text NOT IN ('COMPLETED', 'CLOSED')
              AND EXISTS (
                SELECT 1 FROM "InternalTaskAssignee" a WHERE a."taskId" = "InternalTask".id
              )
              AND NOT EXISTS (
                SELECT 1 FROM "InternalTaskAssignee" a
                WHERE a."taskId" = "InternalTask".id AND a."userId" = ${userId}
              )
          )::int AS "othersOpenTasks",
          count(*) FILTER (
            WHERE status::text IN ('COMPLETED', 'CLOSED')
              AND EXISTS (
                SELECT 1 FROM "InternalTaskAssignee" a
                WHERE a."taskId" = "InternalTask".id AND a."userId" = ${userId}
              )
          )::int AS "myDoneTasks",
          count(*) FILTER (WHERE status::text = 'OPEN')::int AS "statusOpen",
          count(*) FILTER (WHERE status::text = 'IN_PROGRESS')::int AS "statusInProgress",
          count(*) FILTER (WHERE status::text = 'WAITING')::int AS "statusWaiting",
          count(*) FILTER (WHERE status::text = 'COMPLETED')::int AS "statusCompleted",
          count(*) FILTER (WHERE status::text = 'CLOSED')::int AS "statusClosed"
        FROM "InternalTask"
      `,
      prisma.$queryRaw<Array<Record<string, unknown>>>`
        SELECT
          count(*) FILTER (WHERE status::text NOT IN ('RESOLVED', 'CLOSED'))::int AS "openTickets",
          count(*) FILTER (
            WHERE status::text NOT IN ('RESOLVED', 'CLOSED')
              AND (
                "assignedToId" = ${userId}
                OR EXISTS (
                  SELECT 1 FROM "TicketAssignee" a
                  WHERE a."ticketId" = "Ticket".id AND a."userId" = ${userId}
                )
              )
          )::int AS "myOpenTickets",
          count(*) FILTER (
            WHERE status::text NOT IN ('RESOLVED', 'CLOSED')
              AND "assignedToId" <> ${userId}
              AND NOT EXISTS (
                SELECT 1 FROM "TicketAssignee" a
                WHERE a."ticketId" = "Ticket".id AND a."userId" = ${userId}
              )
          )::int AS "othersOpenTickets",
          count(*) FILTER (
            WHERE status::text NOT IN ('RESOLVED', 'CLOSED')
              AND "assignedToId" IS NULL
              AND NOT EXISTS (
                SELECT 1 FROM "TicketAssignee" a WHERE a."ticketId" = "Ticket".id
              )
          )::int AS "unassignedTickets"
        FROM "Ticket"
      `,
    ]);

    const task = tasks[0] ?? {};
    const ticket = tickets[0] ?? {};
    return {
      openTasks: n(task.openTasks),
      dueToday: n(task.dueToday),
      upcoming: n(task.upcoming),
      overdue: n(task.overdue),
      unassignedTasks: n(task.unassignedTasks),
      completedThisWeek: n(task.completedThisWeek),
      myOpenTasks: n(task.myOpenTasks),
      othersOpenTasks: n(task.othersOpenTasks),
      myDoneTasks: n(task.myDoneTasks),
      openTickets: n(ticket.openTickets),
      myOpenTickets: n(ticket.myOpenTickets),
      othersOpenTickets: n(ticket.othersOpenTickets),
      unassignedTickets: n(ticket.unassignedTickets),
      status: {
        OPEN: n(task.statusOpen),
        IN_PROGRESS: n(task.statusInProgress),
        WAITING: n(task.statusWaiting),
        COMPLETED: n(task.statusCompleted),
        CLOSED: n(task.statusClosed),
      },
    };
  },
);

export const loadActivitySeries = cache(async (sinceMs: number): Promise<{
  current: DayActivity[];
  previousTotal: number;
}> => {
  const since = new Date(sinceMs);
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Toronto', 'YYYY-MM-DD') AS day,
      kind::text AS kind,
      ("taskId" IS NOT NULL) AS "onTask",
      count(*)::int AS count
    FROM "WorkdeskEvent"
    WHERE "createdAt" >= ${since}
    GROUP BY 1, 2, 3
  `;
  const buckets: ActivityBucket[] = rows.map((row) => ({
    day: String(row.day ?? ""),
    kind: String(row.kind ?? ""),
    onTask: row.onTask === true || row.onTask === "t" || row.onTask === "true",
    count: n(row.count),
  }));
  const today = new Date();
  const start = addZonedDays(today, -13);
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = addZonedDays(start, index);
    return { key: calendarDateKey(date), label: weekdayShort(date) };
  });
  const series = seriesFromBuckets(buckets, days);
  const previousTotal = series.slice(0, 7).reduce((sum, day) => sum + day.total, 0);
  return { current: series.slice(7), previousTotal };
});

export const loadMailFlags = cache(async () => {
  try {
    const mail = await getResolvedMail();
    return {
      isConfigured: mail.isConfigured,
      hasCareerNotifyList: mail.hasCareerNotifyList,
    };
  } catch {
    return { isConfigured: false, hasCareerNotifyList: false };
  }
});

export const loadNavCounts = cache(async (user: SessionUser) => {
  const seeEnquiries = canAccessEnquiries(user);
  const seeApplications = canAccessApplications(user);
  const bounds = currentDashboardBounds();
  const [newSubmissions, newQuotes, newApplications, unreadNotifications, rollup] =
    await Promise.all([
      seeEnquiries
        ? prisma.formSubmission.count({ where: { status: "NEW" } }).catch(() => 0)
        : Promise.resolve(0),
      seeEnquiries
        ? prisma.quoteRequest.count({ where: { status: "NEW" } }).catch(() => 0)
        : Promise.resolve(0),
      seeApplications
        ? prisma.jobApplication.count({ where: { status: "NEW" } }).catch(() => 0)
        : Promise.resolve(0),
      prisma.workdeskNotification.count({ where: { userId: user.id, readAt: null } }).catch(() => 0),
      loadWorkdeskRollup(user.id, bounds.todayMs, bounds.tomorrowMs, bounds.weekMs).catch(() => null),
    ]);
  const openTickets = rollup?.myOpenTickets ?? 0;
  const openTasks = rollup?.myOpenTasks ?? 0;

  return { newSubmissions, newQuotes, newApplications, unreadNotifications, openTickets, openTasks };
});

export const taskListSelect = {
  id: true,
  reference: true,
  title: true,
  status: true,
  priority: true,
  dueAt: true,
  assignees: { select: { user: { select: { name: true } } } },
} as const;

export const ticketListSelect = {
  id: true,
  reference: true,
  subject: true,
  status: true,
  priority: true,
  customer: { select: { name: true } },
  assignedTo: { select: { name: true } },
  assignees: { select: { user: { select: { name: true } } } },
} as const;
