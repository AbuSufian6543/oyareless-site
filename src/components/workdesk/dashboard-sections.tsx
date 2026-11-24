import Link from "next/link";

import { Alert, Badge, Card, CardTitle, EmptyState } from "@/components/admin/ui";
import { ActivityChartCard, TaskDonutCard } from "@/components/workdesk/chart-cards";
import { CollapsibleCalendar } from "@/components/workdesk/collapsible-calendar";
import { CountUp } from "@/components/workdesk/count-up";
import {
  calendarWeeks,
  ColorStatLink,
} from "@/components/workdesk/dashboard-panels";
import { TaskRow, TicketRow } from "@/components/workdesk/task-row";
import { WorkdeskCalendar } from "@/components/workdesk/workdesk-calendar";
import { WorkList, WorkSection } from "@/components/workdesk/work-item";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { canAccessOperations } from "@/lib/staff-access";
import { getStatusSummary } from "@/lib/monitoring";
import { calendarDateKey } from "@/lib/timezone";
import { formatDate, formatDateTime } from "@/lib/utils";
import { workdeskHref } from "@/lib/workdesk/access";
import type { SessionUser } from "@/lib/auth";
import {
  OPEN_TASK,
  OPEN_TICKET,
  taskAssignedTo,
  taskAssignedToOthers,
  taskUnassigned,
  ticketAssignedTo,
  ticketAssignedToOthers,
  ticketAssigneeNames,
  ticketUnassigned,
} from "@/lib/workdesk/board";
import {
  loadActivitySeries,
  loadMailFlags,
  loadWorkdeskRollup,
  taskListSelect,
  ticketListSelect,
  type DashboardBounds,
} from "@/lib/workdesk/dashboard-load";
import { TASK_STATUS_LABELS } from "@/lib/workdesk/labels";
import { isOverdue, parseDateInput, startOfMonth, startOfNextMonth, startOfPreviousMonth, startOfToday } from "@/lib/workdesk/dates";
import { taskSearchWhere, ticketSearchWhere } from "@/lib/workdesk/list-search";
import {
  Briefcase,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  FileText,
  Headset,
  Inbox,
  Newspaper,
  Radio,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react";

const DONE = ["COMPLETED", "CLOSED"] as const;

function WidgetError({ children }: { children: string }) {
  return <p className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">{children}</p>;
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-xl bg-slate-100" />
      ))}
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}

export function ListsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
      <div className="h-28 animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}

export async function HeroSummary({ userId, bounds }: { userId: string; bounds: DashboardBounds }) {
  try {
    const rollup = await loadWorkdeskRollup(userId, bounds.todayMs, bounds.tomorrowMs, bounds.weekMs);
    const tickets =
      rollup.myOpenTickets === 0
        ? "no tickets"
        : `${rollup.myOpenTickets} ${rollup.myOpenTickets === 1 ? "ticket" : "tickets"}`;
    return (
      <>
        You have {rollup.overdue} overdue {rollup.overdue === 1 ? "task" : "tasks"}, {rollup.upcoming} upcoming{" "}
        {rollup.upcoming === 1 ? "task" : "tasks"} and {tickets} assigned to you.
      </>
    );
  } catch {
    return <>Operational summary is unavailable right now.</>;
  }
}

export async function MailAlerts() {
  const mail = await loadMailFlags();
  if (mail.isConfigured && mail.hasCareerNotifyList) return null;
  return (
    <>
      {!mail.isConfigured ? (
        <div className="mb-4">
          <Alert tone="warning">
            <strong>SMTP is not configured.</strong> Assignment emails will not send until the mail server is added under{" "}
            <Link href="/admin/settings" className="font-semibold underline">Site Settings</Link>.
          </Alert>
        </div>
      ) : null}
      {!mail.hasCareerNotifyList ? (
        <div className="mb-4">
          <Alert tone="warning">
            <strong>No career notification emails.</strong> Résumés are saved under{" "}
            <Link href="/admin/applications" className="font-semibold underline">Applications</Link>{" "}
            but nobody is emailed a copy until you add addresses under{" "}
            <Link href="/admin/settings" className="font-semibold underline">Site Settings</Link>.
          </Alert>
        </div>
      ) : null}
    </>
  );
}

export async function OperationsStats({ userId, bounds }: { userId: string; bounds: DashboardBounds }) {
  try {
    const rollup = await loadWorkdeskRollup(userId, bounds.todayMs, bounds.tomorrowMs, bounds.weekMs);
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        <ColorStatLink index={0} href="/admin/tasks?view=all" label="Open tasks" value={rollup.openTasks} hint="Still in progress" tone="sky" Icon={ClipboardList} />
        <ColorStatLink index={1} href="/admin/tasks?view=today" label="Today's tasks" value={rollup.dueToday} hint={rollup.dueToday === 1 ? "1 item due before end of day" : "Due before end of day"} tone="cyan" Icon={CalendarDays} />
        <ColorStatLink index={2} href="/admin/tasks?view=upcoming" label="Upcoming" value={rollup.upcoming} hint={rollup.upcoming > 0 ? "Due after today" : "Nothing scheduled ahead"} tone="sky" Icon={CalendarClock} />
        <ColorStatLink index={3} href="/admin/tasks?view=overdue" label="Overdue tasks" value={rollup.overdue} hint={rollup.overdue > 0 ? "Needs attention" : "Nothing overdue"} tone={rollup.overdue > 0 ? "rose" : "amber"} Icon={TriangleAlert} />
        <ColorStatLink index={4} href="/admin/tasks?view=unassigned" label="Unassigned tasks" value={rollup.unassignedTasks} hint={rollup.unassignedTasks > 0 ? "Waiting for an owner" : "Every open task has an owner"} tone="violet" Icon={UserRound} />
        <ColorStatLink index={5} href="/admin/tickets" label="Open tickets" value={rollup.openTickets} hint="Customer work still open" tone="emerald" Icon={Headset} />
        <ColorStatLink index={6} href="/admin/tasks?view=completed" label="Completed this week" value={rollup.completedThisWeek} hint="Finished since Monday" tone="emerald" Icon={CircleCheck} />
      </div>
    );
  } catch {
    return <WidgetError>Operations statistics are unavailable right now.</WidgetError>;
  }
}

export async function TrendCharts({ userId, bounds }: { userId: string; bounds: DashboardBounds }) {
  try {
    const [rollup, activity] = await Promise.all([
      loadWorkdeskRollup(userId, bounds.todayMs, bounds.tomorrowMs, bounds.weekMs),
      loadActivitySeries(bounds.activitySinceMs),
    ]);
    return (
      <div className="grid min-w-0 items-stretch gap-3 lg:grid-cols-2">
        <ActivityChartCard
          points={activity.current}
          completedThisWeek={rollup.completedThisWeek}
          previousTotal={activity.previousTotal}
        />
        <TaskDonutCard done={rollup.myDoneTasks} open={rollup.myOpenTasks} href="/admin/tasks?view=completed" />
      </div>
    );
  } catch {
    return <WidgetError>Charts are unavailable right now.</WidgetError>;
  }
}

export async function CalendarPanel({ userId, day }: { userId: string; day: string }) {
  try {
    const selectedDay = parseDateInput(day) ?? startOfToday();
    const monthStart = startOfMonth(selectedDay);
    const nextMonth = startOfNextMonth(selectedDay);
    const previousMonth = startOfPreviousMonth(selectedDay);
    const today = startOfToday();
    const selectedKey = calendarDateKey(selectedDay);
    const tasks = await prisma.internalTask.findMany({
      where: { ...OPEN_TASK, dueAt: { gte: monthStart, lt: nextMonth } },
      select: {
        id: true,
        title: true,
        dueAt: true,
        priority: true,
        assignees: { select: { userId: true } },
      },
      orderBy: { dueAt: "asc" },
      take: 250,
    });
    const dueCounts: Record<string, number> = {};
    const mineDay: { id: string; title: string; priority: string; assignees: string[] }[] = [];
    const othersDay: { id: string; title: string; priority: string; assignees: string[] }[] = [];
    const unassignedDay: { id: string; title: string; priority: string; assignees: string[] }[] = [];
    for (const task of tasks) {
      if (!task.dueAt) continue;
      const key = calendarDateKey(task.dueAt);
      dueCounts[key] = (dueCounts[key] ?? 0) + 1;
      if (key !== selectedKey) continue;
      const item = { id: task.id, title: task.title, priority: task.priority, assignees: [] as string[] };
      const ids = task.assignees.map((row) => row.userId);
      if (ids.length === 0) unassignedDay.push(item);
      else if (ids.includes(userId)) mineDay.push(item);
      else othersDay.push(item);
    }
    return (
      <CollapsibleCalendar>
        <WorkdeskCalendar
          monthLabel={formatDate(monthStart, { month: "long", year: "numeric" })}
          prevMonthKey={calendarDateKey(previousMonth)}
          nextMonthKey={calendarDateKey(nextMonth)}
          weeks={calendarWeeks(monthStart)}
          todayKey={calendarDateKey(today)}
          selectedKey={selectedKey}
          selectedLabel={formatDate(selectedDay, { weekday: "long", month: "long", day: "numeric" })}
          dueCounts={dueCounts}
          mine={mineDay}
          others={othersDay}
          unassigned={unassignedDay}
          userId={userId}
        />
      </CollapsibleCalendar>
    );
  } catch {
    return <WidgetError>The calendar is unavailable right now.</WidgetError>;
  }
}

export async function SchedulePanel() {
  try {
    const today = startOfToday();
    const tasks = await prisma.internalTask.findMany({
      where: { ...OPEN_TASK, dueAt: { gte: today } },
      orderBy: { dueAt: "asc" },
      take: 7,
      select: {
        id: true,
        reference: true,
        title: true,
        status: true,
        dueAt: true,
        assignees: { select: { userId: true } },
      },
    });
    return (
      <div className="min-w-0 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <p className="text-sm font-bold text-navy-900">Coming up</p>
          <Link href="/admin/tasks?view=upcoming" className="text-xs font-semibold text-brand-700 hover:underline">View upcoming</Link>
        </div>
        {tasks.length === 0 ? (
          <p className="px-3 py-3 text-sm text-slate-500">Nothing is scheduled ahead.</p>
        ) : (
          <ol className="relative divide-y divide-slate-100">
            {tasks.map((task, index) => (
              <li key={task.id} className="wc-row" style={{ animationDelay: `${index * 30}ms` }}>
                <Link href={`/admin/tasks/${task.id}?from=${encodeURIComponent("/admin")}`} className="flex min-w-0 items-start gap-3 px-3 py-2 transition-colors duration-150 hover:bg-slate-50">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-navy-900">{task.title}</span>
                      <span className="shrink-0 font-mono text-[11px] text-slate-400">{task.reference}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {task.dueAt ? formatDateTime(task.dueAt) : "No time"} · {TASK_STATUS_LABELS[task.status] ?? task.status}
                      {task.assignees.length === 0 ? " · Unassigned" : ""}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    );
  } catch {
    return <WidgetError>The schedule is unavailable right now.</WidgetError>;
  }
}

export async function InsightsPanel({ userId, bounds }: { userId: string; bounds: DashboardBounds }) {
  try {
    const rollup = await loadWorkdeskRollup(userId, bounds.todayMs, bounds.tomorrowMs, bounds.weekMs);
    const statusOrder = ["OPEN", "IN_PROGRESS", "WAITING", "COMPLETED", "CLOSED"] as const;
    const statusTotal = statusOrder.reduce((sum, status) => sum + rollup.status[status], 0) || 1;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active tasks</dt>
            <dd className="text-2xl font-extrabold tabular-nums text-navy-900"><CountUp value={rollup.openTasks} /></dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overdue</dt>
            <dd className="text-2xl font-extrabold tabular-nums text-rose-700"><CountUp value={rollup.overdue} /></dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Done this week</dt>
            <dd className="text-2xl font-extrabold tabular-nums text-navy-900"><CountUp value={rollup.completedThisWeek} /></dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Open tickets</dt>
            <dd className="text-2xl font-extrabold tabular-nums text-navy-900"><CountUp value={rollup.openTickets} /></dd>
          </div>
        </dl>
        <div className="mt-4 space-y-2">
          {statusOrder.map((status) => (
            <div key={status}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-navy-800">{TASK_STATUS_LABELS[status]}</span>
                <span className="tabular-nums text-slate-500">{rollup.status[status]}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="wc-meter h-full rounded-full bg-brand-500" style={{ width: `${Math.round((rollup.status[status] / statusTotal) * 100)}%` }} />
              </div>
            </div>
          ))}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold text-navy-800">Unassigned open tasks</span>
              <span className="tabular-nums text-slate-500">{rollup.unassignedTasks}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="wc-meter h-full rounded-full bg-violet-500" style={{ width: `${rollup.openTasks === 0 ? 0 : Math.round((rollup.unassignedTasks / rollup.openTasks) * 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch {
    return <WidgetError>Workload insights are unavailable right now.</WidgetError>;
  }
}

export async function ActivityFeed() {
  try {
    const events = await prisma.workdeskEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        summary: true,
        createdAt: true,
        task: { select: { id: true, reference: true } },
        ticket: { select: { id: true, reference: true } },
      },
    });
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        {events.length === 0 ? (
          <p className="px-3 py-3 text-sm text-slate-500">No workdesk activity yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {events.map((event, index) => {
              const href = event.task
                ? `/admin/tasks/${event.task.id}?from=${encodeURIComponent("/admin")}`
                : event.ticket
                  ? `/admin/tickets/${event.ticket.id}`
                  : "/admin/audit";
              const reference = event.task?.reference || event.ticket?.reference;
              return (
                <li key={event.id} className="wc-row" style={{ animationDelay: `${index * 30}ms` }}>
                  <Link href={href} className="block min-w-0 px-3 py-2 transition-colors duration-150 hover:bg-slate-50">
                    <span className="block truncate text-sm text-navy-900">{event.summary}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      {reference ? <span className="font-mono font-semibold text-slate-400">{reference}</span> : null}
                      <span>{formatDateTime(event.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/admin/audit" className="block border-t border-slate-100 px-3 py-2 text-sm font-semibold text-brand-700 hover:underline">
          View all activity
        </Link>
      </div>
    );
  } catch {
    return <WidgetError>Recent activity is unavailable right now.</WidgetError>;
  }
}

export async function MonitoringPanel({ user }: { user: SessionUser }) {
  try {
    const statusSummary = await getStatusSummary();
    if (!statusSummary) {
      return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5">
          <p className="text-sm font-semibold text-navy-900">Monitoring not configured</p>
          <p className="mt-1 text-sm text-slate-600">Website, server, and service checks appear here after an administrator enables them. Nothing on this card is estimated.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {canAccessOperations(user) ? (
              <Link href="/admin/collections/monitors" className="text-sm font-semibold text-brand-700 hover:underline">Set up checks</Link>
            ) : null}
            <Link href="/network-status" className="text-sm font-semibold text-brand-700 hover:underline">Public status</Link>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">
          {statusSummary.services.filter((service) => service.operational === true).length} of {statusSummary.services.length} checks are up
          {statusSummary.uptime24h === null ? "" : ` · ${Math.round(statusSummary.uptime24h)}% of checks passed in 24 hours`}
          {statusSummary.openIncidents > 0 ? ` · ${statusSummary.openIncidents} open incident${statusSummary.openIncidents === 1 ? "" : "s"}` : ""}
        </p>
        <ul className="mt-3 space-y-2">
          {statusSummary.services.slice(0, 6).map((service) => (
            <li key={service.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-navy-900">{service.name}</span>
              <span className={service.operational === true ? "text-emerald-700" : service.operational === false ? "text-rose-700" : "text-slate-500"}>
                {service.operational === true ? "Up" : service.operational === false ? "Down" : "No reading yet"}
              </span>
            </li>
          ))}
        </ul>
        <Link href="/network-status" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">Public status</Link>
      </div>
    );
  } catch {
    return <WidgetError>Monitoring is unavailable right now.</WidgetError>;
  }
}

export async function SearchResults({ query, you }: { query: string; you: string }) {
  const taskLookup = taskSearchWhere(query);
  const ticketLookup = ticketSearchWhere(query);
  const [foundTasks, foundTickets] = await Promise.all([
    taskLookup
      ? prisma.internalTask.findMany({ where: taskLookup, orderBy: { updatedAt: "desc" }, take: 6, select: taskListSelect })
      : [],
    ticketLookup
      ? prisma.ticket.findMany({ where: ticketLookup, orderBy: { updatedAt: "desc" }, take: 6, select: ticketListSelect })
      : [],
  ]);
  return (
    <div className="mb-4 grid min-w-0 items-start gap-4 lg:grid-cols-2">
      <WorkSection title="Tasks" href={`/admin/tasks?q=${encodeURIComponent(query)}`} countLabel="All task matches">
        <WorkList variant="rows" count={foundTasks.length} empty={`No tasks match “${query}”.`}>
          {foundTasks.map((task, index) => (
            <TaskRow
              key={task.id}
              index={index}
              href={`/admin/tasks/${task.id}?from=${encodeURIComponent("/admin")}`}
              reference={task.reference}
              title={task.title}
              status={task.status}
              priority={task.priority}
              dueAt={task.dueAt}
              overdue={isOverdue(task.dueAt, task.status, DONE)}
              assignees={task.assignees.map((row) => row.user.name)}
              you={you}
            />
          ))}
        </WorkList>
      </WorkSection>
      <WorkSection title="Tickets" href={`/admin/tickets?q=${encodeURIComponent(query)}`} countLabel="All ticket matches">
        <WorkList variant="rows" count={foundTickets.length} empty={`No tickets match “${query}”.`}>
          {foundTickets.map((ticket, index) => (
            <TicketRow
              key={ticket.id}
              index={index}
              href={`/admin/tickets/${ticket.id}`}
              reference={ticket.reference}
              title={ticket.subject}
              status={ticket.status}
              priority={ticket.priority}
              subtitle={ticket.customer.name}
              assignees={ticketAssigneeNames(ticket)}
              you={you}
            />
          ))}
        </WorkList>
      </WorkSection>
    </div>
  );
}

export async function WorkLists({ userId, you, bounds }: { userId: string; you: string; bounds: DashboardBounds }) {
  const today = new Date(bounds.todayMs);
  try {
    const [rollup, overdueTaskItems, myTasks, othersTasks, waitingTasks, myTickets, othersTickets, waitingTickets, recentTickets, notifications] =
      await Promise.all([
        loadWorkdeskRollup(userId, bounds.todayMs, bounds.tomorrowMs, bounds.weekMs),
        prisma.internalTask.findMany({
          where: { ...OPEN_TASK, dueAt: { lt: today } },
          orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
          take: 6,
          select: taskListSelect,
        }),
        prisma.internalTask.findMany({
          where: { ...OPEN_TASK, ...taskAssignedTo(userId) },
          orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
          take: 6,
          select: taskListSelect,
        }),
        prisma.internalTask.findMany({
          where: { ...OPEN_TASK, ...taskAssignedToOthers(userId) },
          orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
          take: 6,
          select: taskListSelect,
        }),
        prisma.internalTask.findMany({
          where: { ...OPEN_TASK, ...taskUnassigned() },
          orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
          take: 6,
          select: taskListSelect,
        }),
        prisma.ticket.findMany({
          where: { ...OPEN_TICKET, ...ticketAssignedTo(userId) },
          orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
          take: 6,
          select: ticketListSelect,
        }),
        prisma.ticket.findMany({
          where: { ...OPEN_TICKET, ...ticketAssignedToOthers(userId) },
          orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
          take: 6,
          select: ticketListSelect,
        }),
        prisma.ticket.findMany({
          where: { ...OPEN_TICKET, ...ticketUnassigned() },
          orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
          take: 6,
          select: ticketListSelect,
        }),
        prisma.ticket.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: ticketListSelect,
        }),
        prisma.workdeskNotification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, title: true, body: true, readAt: true, createdAt: true, ticketId: true, taskId: true },
        }),
      ]);

    const ticketStats = [
      { label: "Assigned to me", value: rollup.myOpenTickets, href: "/admin/tickets?view=mine", Icon: UserRound },
      { label: "Assigned to others", value: rollup.othersOpenTickets, href: "/admin/tickets?view=team", Icon: Users },
      { label: "Unassigned", value: rollup.unassignedTickets, href: "/admin/tickets?view=unassigned", Icon: ClipboardList },
      { label: "Open tickets", value: rollup.openTickets, href: "/admin/tickets", Icon: Headset },
    ];

    return (
      <div className="min-w-0 space-y-4">
        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Tickets</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {ticketStats.map((stat, index) => (
              <ColorStatLink key={stat.label} {...stat} index={index} tone={(["emerald", "sky", "violet", "cyan"] as const)[index]} />
            ))}
          </div>
        </section>
        {overdueTaskItems.length > 0 ? (
          <WorkSection title="Overdue" href="/admin/tasks?view=overdue" countLabel={`View all ${rollup.overdue}`}>
            <WorkList variant="rows" count={overdueTaskItems.length} empty="">
              {overdueTaskItems.map((task, index) => (
                <TaskRow key={task.id} index={index} href={`/admin/tasks/${task.id}?from=${encodeURIComponent("/admin")}`} reference={task.reference} title={task.title} status={task.status} priority={task.priority} dueAt={task.dueAt} overdue assignees={task.assignees.map((row) => row.user.name)} you={you} />
              ))}
            </WorkList>
          </WorkSection>
        ) : null}
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2">
          <WorkSection title="Assigned to me" href="/admin/tasks" countLabel={`View all ${rollup.myOpenTasks}`}>
            <WorkList variant="rows" count={myTasks.length} empty="Nothing assigned to you yet. Create a task or pick one up from the team list.">
              {myTasks.map((task, index) => (
                <TaskRow key={task.id} index={index} href={`/admin/tasks/${task.id}?from=${encodeURIComponent("/admin")}`} reference={task.reference} title={task.title} status={task.status} priority={task.priority} dueAt={task.dueAt} overdue={isOverdue(task.dueAt, task.status, DONE)} assignees={task.assignees.map((row) => row.user.name)} you={you} />
              ))}
            </WorkList>
          </WorkSection>
          <WorkSection title="Assigned to others" href="/admin/tasks?view=team" countLabel={`View all ${rollup.othersOpenTasks}`}>
            <WorkList variant="rows" count={othersTasks.length} empty="No open tasks are assigned to other staff.">
              {othersTasks.map((task, index) => (
                <TaskRow key={task.id} index={index} href={`/admin/tasks/${task.id}?from=${encodeURIComponent("/admin")}`} reference={task.reference} title={task.title} status={task.status} priority={task.priority} dueAt={task.dueAt} overdue={isOverdue(task.dueAt, task.status, DONE)} assignees={task.assignees.map((row) => row.user.name)} />
              ))}
            </WorkList>
          </WorkSection>
        </div>
        {waitingTasks.length > 0 ? (
          <WorkSection title="Unassigned tasks" href="/admin/tasks?view=unassigned" countLabel="Assign these">
            <WorkList variant="rows" count={waitingTasks.length} empty="">
              {waitingTasks.map((task, index) => (
                <TaskRow key={task.id} index={index} href={`/admin/tasks/${task.id}?from=${encodeURIComponent("/admin")}`} reference={task.reference} title={task.title} status={task.status} priority={task.priority} dueAt={task.dueAt} overdue={isOverdue(task.dueAt, task.status, DONE)} assignees={[]} />
              ))}
            </WorkList>
          </WorkSection>
        ) : null}
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2">
          <WorkSection title="Tickets assigned to me" href="/admin/tickets?view=mine" countLabel={`View all ${rollup.myOpenTickets}`}>
            <WorkList variant="rows" count={myTickets.length} empty="Nothing assigned to you yet.">
              {myTickets.map((ticket, index) => (
                <TicketRow key={ticket.id} index={index} href={`/admin/tickets/${ticket.id}`} reference={ticket.reference} title={ticket.subject} status={ticket.status} priority={ticket.priority} subtitle={ticket.customer.name} assignees={ticketAssigneeNames(ticket)} you={you} />
              ))}
            </WorkList>
          </WorkSection>
          <WorkSection title="Tickets assigned to others" href="/admin/tickets?view=team" countLabel={`View all ${rollup.othersOpenTickets}`}>
            <WorkList variant="rows" count={othersTickets.length} empty="No open tickets are assigned to other staff.">
              {othersTickets.map((ticket, index) => (
                <TicketRow key={ticket.id} index={index} href={`/admin/tickets/${ticket.id}`} reference={ticket.reference} title={ticket.subject} status={ticket.status} priority={ticket.priority} subtitle={ticket.customer.name} assignees={ticketAssigneeNames(ticket)} />
              ))}
            </WorkList>
          </WorkSection>
        </div>
        {waitingTickets.length > 0 ? (
          <WorkSection title="Unassigned tickets" href="/admin/tickets?view=unassigned" countLabel="Assign these">
            <WorkList variant="rows" count={waitingTickets.length} empty="">
              {waitingTickets.map((ticket, index) => (
                <TicketRow key={ticket.id} index={index} href={`/admin/tickets/${ticket.id}`} reference={ticket.reference} title={ticket.subject} status={ticket.status} priority={ticket.priority} subtitle={ticket.customer.name} assignees={[]} />
              ))}
            </WorkList>
          </WorkSection>
        ) : null}
        <WorkSection title="Recently created tickets" href="/admin/tickets" countLabel="All tickets">
          <WorkList variant="rows" count={recentTickets.length} empty="No tickets yet.">
            {recentTickets.map((ticket, index) => (
              <TicketRow key={ticket.id} index={index} href={`/admin/tickets/${ticket.id}`} reference={ticket.reference} title={ticket.subject} status={ticket.status} priority={ticket.priority} subtitle={ticket.customer.name} assignees={ticketAssigneeNames(ticket)} you={you} />
            ))}
          </WorkList>
        </WorkSection>
        <Card>
          <CardTitle description="Technician and customer updates.">Updates</CardTitle>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-500">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map((item) => (
                <li key={item.id}>
                  <Link href={workdeskHref("EMPLOYEE", item)} className="-mx-2 block rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-slate-50">
                    <span className={`block truncate text-sm font-semibold ${item.readAt ? "text-navy-800" : "text-navy-900"}`}>{item.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">{item.body}</span>
                    <span className="mt-0.5 block text-xs text-slate-400">{formatDateTime(item.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/notifications" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">All notifications</Link>
        </Card>
      </div>
    );
  } catch {
    return <WidgetError>Tasks and tickets are unavailable right now.</WidgetError>;
  }
}

export async function SiteOverview({
  canSeeCms,
  canSeeEnquiries,
  canSeeApplications,
}: {
  canSeeCms: boolean;
  canSeeEnquiries: boolean;
  canSeeApplications: boolean;
}) {
  try {
    const [publishedPages, draftPages, streams, posts, jobs, newSubmissions, newQuotes, newApplications, subscribers, recentSubmissions, mail] =
      await Promise.all([
        canSeeCms ? prisma.page.count({ where: { status: "PUBLISHED" } }).catch(() => 0) : Promise.resolve(0),
        canSeeCms ? prisma.page.count({ where: { status: "DRAFT" } }).catch(() => 0) : Promise.resolve(0),
        canSeeCms ? prisma.stream.count({ where: { status: "PUBLISHED" } }).catch(() => 0) : Promise.resolve(0),
        canSeeCms ? prisma.post.count({ where: { status: "PUBLISHED" } }).catch(() => 0) : Promise.resolve(0),
        canSeeCms ? prisma.jobPosting.count({ where: { status: "PUBLISHED" } }).catch(() => 0) : Promise.resolve(0),
        canSeeEnquiries ? prisma.formSubmission.count({ where: { status: "NEW" } }).catch(() => 0) : Promise.resolve(0),
        canSeeEnquiries ? prisma.quoteRequest.count({ where: { status: "NEW" } }).catch(() => 0) : Promise.resolve(0),
        canSeeApplications ? prisma.jobApplication.count({ where: { status: "NEW" } }).catch(() => 0) : Promise.resolve(0),
        canSeeEnquiries ? prisma.subscriber.count({ where: { status: "CONFIRMED" } }).catch(() => 0) : Promise.resolve(0),
        canSeeEnquiries
          ? prisma.formSubmission.findMany({
              orderBy: { createdAt: "desc" },
              take: 5,
              select: { id: true, name: true, status: true, type: true, subject: true, message: true, createdAt: true, emailSentAt: true },
            }).catch(() => [])
          : Promise.resolve([]),
        loadMailFlags(),
      ]);
    const siteStats = [
      ...(canSeeCms
        ? [
            { label: "Pages", value: publishedPages, hint: draftPages > 0 ? `${draftPages} draft${draftPages === 1 ? "" : "s"}` : undefined, href: "/admin/pages", Icon: FileText },
            { label: "Streams", value: streams, href: "/admin/streams", Icon: Radio },
            { label: "News", value: posts, href: "/admin/posts", Icon: Newspaper },
            { label: "Jobs", value: jobs, href: "/admin/jobs", Icon: Briefcase },
          ]
        : []),
      ...(canSeeEnquiries
        ? [
            { label: "New inquiries", value: newSubmissions, href: "/admin/submissions", Icon: Inbox },
            { label: "New quotes", value: newQuotes, href: "/admin/quotes", Icon: FileText },
          ]
        : []),
      ...(canSeeApplications
        ? [{ label: "New applications", value: newApplications, href: "/admin/applications", Icon: ClipboardList }]
        : []),
    ];
    return (
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardTitle description="Website and inbox at a glance.">Site overview</CardTitle>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              {siteStats.map((stat) => (
                <Link key={stat.label} href={stat.href} className="rounded-lg border border-slate-200 px-3 py-3 transition duration-150 hover:border-brand-300 hover:bg-brand-50/50">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums text-navy-900">{stat.value}</p>
                  {"hint" in stat && stat.hint ? <p className="mt-0.5 text-xs text-amber-600">{stat.hint}</p> : null}
                </Link>
              ))}
            </div>
            {recentSubmissions.length === 0 ? (
              <EmptyState icon={<Inbox className="size-8" />} title="No inquiries yet" description="Messages sent through the contact, support, and quote forms appear here." />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentSubmissions.map((submission) => (
                  <li key={submission.id}>
                    <Link href={`/admin/submissions/${submission.id}`} className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-slate-50">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{submission.name.slice(0, 2).toUpperCase()}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-navy-800">{submission.name}</span>
                          <Badge tone={submission.status === "NEW" ? "info" : "neutral"}>{submission.type.toLowerCase()}</Badge>
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-slate-600">{submission.subject || submission.message}</span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {formatDateTime(submission.createdAt)}
                          {submission.emailSentAt ? (
                            <span className="ml-2 inline-flex items-center gap-1 text-emerald-700"><CircleCheck className="size-3" aria-hidden="true" /> emailed</span>
                          ) : (
                            <span className="ml-2 inline-flex items-center gap-1 text-amber-600"><TriangleAlert className="size-3" aria-hidden="true" /> not emailed</span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card>
          <CardTitle>System</CardTitle>
          <dl className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Email delivery</dt>
              <dd>{mail.isConfigured ? <Badge tone="success">Configured</Badge> : <Badge tone="warning">Not set up</Badge>}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">Public URL</dt>
              <dd className="truncate font-mono text-xs text-slate-700">{env.siteUrl.replace(/^https?:\/\//, "")}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Subscribers</dt>
              <dd className="font-semibold text-navy-900">{subscribers}</dd>
            </div>
          </dl>
        </Card>
      </div>
    );
  } catch {
    return <WidgetError>Site overview is unavailable right now.</WidgetError>;
  }
}
