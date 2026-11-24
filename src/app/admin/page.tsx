import Link from "next/link";
import { Suspense } from "react";
import {
  Bell,
  Boxes,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  FileText,
  Headset,
  Inbox,
  Newspaper,
  Plus,
  Radio,
  ShieldAlert,
  TriangleAlert,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";

import { Alert, Badge, Card, CardTitle, EmptyState } from "@/components/admin/ui";
import {
  ActivityChartCard,
  calendarWeeks,
  ColorStatLink,
  DashboardHero,
  TaskDonutCard,
  weekdayShort,
} from "@/components/workdesk/dashboard-panels";
import { CollapsibleCalendar } from "@/components/workdesk/collapsible-calendar";
import { CountUp } from "@/components/workdesk/count-up";
import { OfficeClock } from "@/components/workdesk/office-clock";
import { WidgetBoard } from "@/components/workdesk/widget-board";
import { WeatherPanel, WeatherSkeleton } from "@/components/workdesk/weather-widget";
import { TaskRow, TicketRow } from "@/components/workdesk/task-row";
import { WorkdeskCalendar } from "@/components/workdesk/workdesk-calendar";
import { WorkList, WorkSection } from "@/components/workdesk/work-item";
import { WorkSearch } from "@/components/workdesk/work-search";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { getResolvedMail } from "@/lib/mail-settings";
import { prisma } from "@/lib/prisma";
import {
  canAccessApplications,
  canAccessContent,
  canAccessEnquiries,
  canAccessOperations,
} from "@/lib/staff-access";
import { getStatusSummary } from "@/lib/monitoring";
import { calendarDateKey, zonedHour } from "@/lib/timezone";
import { formatDate, formatDateTime } from "@/lib/utils";
import { workdeskHref } from "@/lib/workdesk/access";
import { TASK_STATUS_LABELS } from "@/lib/workdesk/labels";
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
import { cleanWorkQuery, taskSearchWhere, ticketSearchWhere } from "@/lib/workdesk/list-search";
import {
  addZonedDays,
  isOverdue,
  parseDateInput,
  startOfMonth,
  startOfNextMonth,
  startOfPreviousMonth,
  startOfToday,
  startOfTomorrow,
} from "@/lib/workdesk/dates";

export const dynamic = "force-dynamic";
export const metadata = { title: "Workdesk" };

const TASK_DONE = ["COMPLETED", "CLOSED"] as const;
const taskInclude = {
  assignees: { include: { user: { select: { name: true } } } },
};
const ticketInclude = {
  customer: { select: { name: true } },
  assignedTo: { select: { name: true } },
  assignees: { include: { user: { select: { name: true } } } },
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string; day?: string; error?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const params = await searchParams;
  const query = cleanWorkQuery(params.q);
  const canSeeCms = canAccessContent(user);
  const canSeeEnquiries = canAccessEnquiries(user);
  const canSeeApplications = canAccessApplications(user);
  const today = startOfToday();
  const tomorrow = startOfTomorrow();
  const selectedDay = parseDateInput(params.day ?? "") ?? today;
  const monthStart = startOfMonth(selectedDay);
  const nextMonth = startOfNextMonth(selectedDay);
  const previousMonth = startOfPreviousMonth(selectedDay);
  const weekStart = addZonedDays(today, -6);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Toronto",
    weekday: "short",
  }).format(today);
  const weekIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
  const weekStartMonday = addZonedDays(today, weekIndex < 0 ? 0 : -weekIndex);
  const myId = user.id;
  const dueTodayFilter = { ...OPEN_TASK, dueAt: { gte: today, lt: tomorrow } };
  const upcomingFilter = { ...OPEN_TASK, dueAt: { gte: tomorrow } };
  const overdueFilter = { ...OPEN_TASK, dueAt: { lt: today } };
  const myDoneFilter = {
    ...taskAssignedTo(myId),
    status: { in: [...TASK_DONE] },
  };

  const [
    dueTodayCount,
    upcomingCount,
    myOpenTasks,
    teamOpenTasks,
    unassignedTasks,
    overdueTasks,
    myOpenTickets,
    teamOpenTickets,
    unassignedTickets,
    openTickets,
    overdueTaskItems,
    myTasks,
    othersTasks,
    waitingTasks,
    myTickets,
    othersTickets,
    waitingTickets,
    publishedPages,
    draftPages,
    streams,
    posts,
    jobs,
    newSubmissions,
    newQuotes,
    newApplications,
    subscribers,
    recentSubmissions,
    mail,
    recentNotifications,
    myDoneTasks,
    monthDueTasks,
    recentTaskEvents,
  ] = await Promise.all([
    prisma.internalTask.count({ where: dueTodayFilter }),
    prisma.internalTask.count({ where: upcomingFilter }),
    prisma.internalTask.count({ where: { ...OPEN_TASK, ...taskAssignedTo(myId) } }),
    prisma.internalTask.count({ where: { ...OPEN_TASK, ...taskAssignedToOthers(myId) } }),
    prisma.internalTask.count({ where: { ...OPEN_TASK, ...taskUnassigned() } }),
    prisma.internalTask.count({ where: overdueFilter }),
    prisma.ticket.count({ where: { ...OPEN_TICKET, ...ticketAssignedTo(myId) } }).catch(() => 0),
    prisma.ticket.count({ where: { ...OPEN_TICKET, ...ticketAssignedToOthers(myId) } }).catch(() => 0),
    prisma.ticket.count({ where: { ...OPEN_TICKET, ...ticketUnassigned() } }).catch(() => 0),
    prisma.ticket.count({ where: OPEN_TICKET }).catch(() => 0),
    prisma.internalTask.findMany({
      where: overdueFilter,
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
      take: 8,
      include: taskInclude,
    }),
    prisma.internalTask.findMany({
      where: { ...OPEN_TASK, ...taskAssignedTo(myId) },
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
      take: 8,
      include: taskInclude,
    }),
    prisma.internalTask.findMany({
      where: { ...OPEN_TASK, ...taskAssignedToOthers(myId) },
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
      take: 8,
      include: taskInclude,
    }),
    prisma.internalTask.findMany({
      where: { ...OPEN_TASK, ...taskUnassigned() },
      orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
      take: 6,
      include: taskInclude,
    }),
    prisma.ticket.findMany({
      where: { ...OPEN_TICKET, ...ticketAssignedTo(myId) },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 6,
      include: ticketInclude,
    }),
    prisma.ticket.findMany({
      where: { ...OPEN_TICKET, ...ticketAssignedToOthers(myId) },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 6,
      include: ticketInclude,
    }),
    prisma.ticket.findMany({
      where: { ...OPEN_TICKET, ...ticketUnassigned() },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 6,
      include: ticketInclude,
    }),
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
      ? prisma.formSubmission
          .findMany({ orderBy: { createdAt: "desc" }, take: 5 })
          .catch(() => [])
      : Promise.resolve([]),
    getResolvedMail().catch(
      (): { isConfigured: boolean; hasCareerNotifyList: boolean } => ({
        isConfigured: false,
        hasCareerNotifyList: false,
      }),
    ),
    prisma.workdeskNotification
      .findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
      .catch(() => []),
    prisma.internalTask.count({ where: myDoneFilter }),
    prisma.internalTask.findMany({
      where: { ...OPEN_TASK, dueAt: { gte: monthStart, lt: nextMonth } },
      select: {
        id: true,
        title: true,
        dueAt: true,
        priority: true,
        assignees: { include: { user: { select: { id: true, name: true } } } },
      },
      take: 250,
    }),
    prisma.workdeskEvent
      .findMany({
        where: { taskId: { not: null }, createdAt: { gte: weekStart } },
        select: { createdAt: true },
      })
      .catch(() => []),
  ]);

  const taskLookup = taskSearchWhere(query);
  const ticketLookup = ticketSearchWhere(query);
  const [foundTasks, foundTickets] = query
    ? await Promise.all([
        taskLookup
          ? prisma.internalTask.findMany({
              where: taskLookup,
              orderBy: { updatedAt: "desc" },
              take: 6,
              include: taskInclude,
            })
          : [],
        ticketLookup
          ? prisma.ticket.findMany({
              where: ticketLookup,
              orderBy: { updatedAt: "desc" },
              take: 6,
              include: ticketInclude,
            })
          : [],
      ])
    : [[], []];

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const hour = zonedHour();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayLabel = formatDate(new Date(), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const todayKey = calendarDateKey(today);
  const selectedKey = calendarDateKey(selectedDay);
  const dueCounts: Record<string, number> = {};
  const mineDay: { id: string; title: string; priority: string; assignees: string[] }[] = [];
  const othersDay: { id: string; title: string; priority: string; assignees: string[] }[] = [];
  const unassignedDay: { id: string; title: string; priority: string; assignees: string[] }[] = [];
  for (const task of monthDueTasks) {
    if (!task.dueAt) continue;
    const key = calendarDateKey(task.dueAt);
    dueCounts[key] = (dueCounts[key] ?? 0) + 1;
    if (key !== selectedKey) continue;
    const item = {
      id: task.id,
      title: task.title,
      priority: task.priority,
      assignees: task.assignees.map((row) => row.user.name),
    };
    const ids = task.assignees.map((row) => row.user.id);
    if (ids.length === 0) unassignedDay.push(item);
    else if (ids.includes(myId)) mineDay.push(item);
    else othersDay.push(item);
  }

  const activityPoints = Array.from({ length: 7 }, (_, index) => {
    const date = addZonedDays(weekStart, index);
    const key = calendarDateKey(date);
    return {
      key,
      label: weekdayShort(date),
      count: recentTaskEvents.filter((event) => calendarDateKey(event.createdAt) === key).length,
    };
  });

  const [
    openTaskCount,
    completedThisWeek,
    activityEvents,
    upcomingTasks,
    recentTickets,
    taskStatusGroups,
    statusSummary,
  ] = await Promise.all([
    prisma.internalTask.count({ where: OPEN_TASK }),
    prisma.internalTask.count({
      where: {
        OR: [{ completedAt: { gte: weekStartMonday } }, { closedAt: { gte: weekStartMonday } }],
      },
    }),
    prisma.workdeskEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        actorStaff: { select: { name: true } },
        actorCustomer: { select: { name: true } },
        task: { select: { id: true, reference: true } },
        ticket: { select: { id: true, reference: true } },
      },
    }),
    prisma.internalTask.findMany({
      where: { ...OPEN_TASK, dueAt: { gte: today } },
      orderBy: { dueAt: "asc" },
      take: 7,
      include: taskInclude,
    }),
    prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: ticketInclude,
    }),
    prisma.internalTask.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    getStatusSummary().catch(() => null),
  ]);

  const statusOrder = ["OPEN", "IN_PROGRESS", "WAITING", "COMPLETED", "CLOSED"] as const;
  const statusCounts = new Map(taskStatusGroups.map((row) => [row.status, row._count._all]));
  const statusTotal = statusOrder.reduce((sum, status) => sum + (statusCounts.get(status) ?? 0), 0) || 1;

  const quickActions = [
    { href: `/admin/tasks/new?due=${selectedKey}`, label: "Create task", Icon: Plus },
    { href: "/admin/tickets?create=1", label: "Create ticket", Icon: Headset },
    { href: "/admin/tasks", label: "All tasks", Icon: ClipboardList },
    { href: "/admin/tickets", label: "All tickets", Icon: Users },
    { href: "/admin/products", label: "Add product", Icon: Boxes },
    ...(canSeeCms ? [{ href: "/admin/collections/services", label: "Services", Icon: Wrench }] : []),
    { href: "/admin/notifications", label: "Notifications", Icon: Bell },
    { href: "/admin/audit", label: "Audit log", Icon: ShieldAlert },
  ];

  const ticketStats = [
    {
      label: "Assigned to me",
      value: myOpenTickets,
      href: "/admin/tickets?view=mine",
      Icon: UserRound,
    },
    {
      label: "Assigned to others",
      value: teamOpenTickets,
      href: "/admin/tickets?view=team",
      Icon: Users,
    },
    {
      label: "Unassigned",
      value: unassignedTickets,
      href: "/admin/tickets?view=unassigned",
      Icon: ClipboardList,
    },
    {
      label: "Open tickets",
      value: openTickets,
      href: "/admin/tickets",
      Icon: Headset,
    },
  ];

  const siteStats = [
    ...(canSeeCms
      ? [
          {
            label: "Pages",
            value: publishedPages,
            hint: draftPages > 0 ? `${draftPages} draft${draftPages === 1 ? "" : "s"}` : undefined,
            href: "/admin/pages",
            Icon: FileText,
          },
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
    <>
      {params.denied === "1" && (
        <div className="mb-6">
          <Alert tone="danger">
            You do not have access to that section.
          </Alert>
        </div>
      )}

      {!mail.isConfigured && canSeeCms && (
        <div className="mb-6">
          <Alert tone="warning">
            <strong>SMTP is not configured.</strong> Assignment emails will not send until
            the mail server is added under{" "}
            <Link href="/admin/settings" className="font-semibold underline">
              Site Settings
            </Link>
            .
          </Alert>
        </div>
      )}

      {canSeeCms && "hasCareerNotifyList" in mail && !mail.hasCareerNotifyList && (
        <div className="mb-6">
          <Alert tone="warning">
            <strong>No career notification emails.</strong> Résumés are saved under{" "}
            <Link href="/admin/applications" className="font-semibold underline">
              Applications
            </Link>{" "}
            but nobody is emailed a copy until you add addresses under{" "}
            <Link href="/admin/settings" className="font-semibold underline">
              Site Settings
            </Link>
            .
          </Alert>
        </div>
      )}

      {params.error === "title" && (
        <div className="mb-6">
          <Alert tone="danger">Give the task a title of at least 3 characters.</Alert>
        </div>
      )}

      <div className="space-y-5">
        <div className="min-w-0">
          <DashboardHero
            className="mb-0"
            hello={hello}
            firstName={firstName}
            todayLabel={todayLabel}
            summary={`You have ${overdueTasks} overdue ${overdueTasks === 1 ? "task" : "tasks"}, ${upcomingCount} upcoming ${upcomingCount === 1 ? "task" : "tasks"} and ${myOpenTickets === 0 ? "no tickets" : `${myOpenTickets} ${myOpenTickets === 1 ? "ticket" : "tickets"}`} assigned to you.`}
            persona={user.dashboardPersona}
            accountHref="/admin/account"
            meta={<OfficeClock />}
            actions={
              <>
                <WorkSearch
                  action="/admin"
                  query={query}
                  kind="both"
                  compact
                  className="mb-0 w-full sm:w-72"
                  hidden={params.day ? { day: params.day } : undefined}
                />
                <Link
                  href={`/admin/tasks/new?due=${selectedKey}`}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  New task
                </Link>
                <Link
                  href="/admin/tickets?create=1"
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-navy-800 transition duration-150 hover:border-brand-300 hover:bg-brand-50"
                >
                  New ticket
                </Link>
                <details className="relative">
                  <summary className="inline-flex h-9 cursor-pointer list-none items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-800 transition duration-150 hover:border-brand-300 [&::-webkit-details-marker]:hidden">
                    Quick actions
                  </summary>
                  <div className="wc-rise absolute right-0 z-20 mt-1 w-48 origin-top rounded-lg border border-slate-200 bg-white p-1 shadow-md">
                    {quickActions.map((action) => (
                      <Link key={action.href} href={action.href} className="block rounded-md px-2 py-1.5 text-sm font-medium text-navy-800 hover:bg-slate-50">
                        {action.label}
                      </Link>
                    ))}
                  </div>
                </details>
              </>
            }
          />
          <div className="mt-3">
            {query ? (
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
                        overdue={isOverdue(task.dueAt, task.status, TASK_DONE)}
                        assignees={task.assignees.map((row) => row.user.name)}
                        you={user.name}
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
                        you={user.name}
                      />
                    ))}
                  </WorkList>
                </WorkSection>
              </div>
            ) : null}
          </div>
        </div>

        <WidgetBoard
          userId={user.id}
          widgets={[
            {
              id: "overview",
              title: "Operations",
              span: 3,
              node: (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
                  <ColorStatLink index={0} href="/admin/tasks?view=all" label="Open tasks" value={openTaskCount} hint="Still in progress" tone="sky" Icon={ClipboardList} />
                  <ColorStatLink index={1} href="/admin/tasks?view=today" label="Today's tasks" value={dueTodayCount} hint={dueTodayCount === 1 ? "1 item due before end of day" : "Due before end of day"} tone="cyan" Icon={CalendarDays} />
                  <ColorStatLink index={2} href="/admin/tasks?view=upcoming" label="Upcoming" value={upcomingCount} hint={upcomingCount > 0 ? "Due after today" : "Nothing scheduled ahead"} tone="sky" Icon={CalendarClock} />
                  <ColorStatLink index={3} href="/admin/tasks?view=overdue" label="Overdue tasks" value={overdueTasks} hint={overdueTasks > 0 ? "Needs attention" : "Nothing overdue"} tone={overdueTasks > 0 ? "rose" : "amber"} Icon={TriangleAlert} />
                  <ColorStatLink index={4} href="/admin/tasks?view=unassigned" label="Unassigned tasks" value={unassignedTasks} hint={unassignedTasks > 0 ? "Waiting for an owner" : "Every open task has an owner"} tone="violet" Icon={UserRound} />
                  <ColorStatLink index={5} href="/admin/tickets" label="Open tickets" value={openTickets} hint="Customer work still open" tone="emerald" Icon={Headset} />
                  <ColorStatLink index={6} href="/admin/tasks?view=completed" label="Completed this week" value={completedThisWeek} hint="Finished since Monday" tone="emerald" Icon={CircleCheck} />
                </div>
              ),
            },
            {
              id: "quick",
              title: "Quick actions",
              span: 3,
              node: (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                  {quickActions.map((action) => (
                    <Link key={action.href} href={action.href} className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-3 text-center text-xs font-semibold text-navy-800 transition duration-150 hover:-translate-y-px hover:border-brand-300 hover:shadow-sm">
                      <action.Icon className="size-4 text-brand-700" aria-hidden="true" />
                      <span className="truncate">{action.label}</span>
                    </Link>
                  ))}
                </div>
              ),
            },
            {
              id: "weather",
              title: "Weather",
              span: 3,
              node: (
                <Suspense fallback={<WeatherSkeleton />}>
                  <WeatherPanel />
                </Suspense>
              ),
            },
            {
              id: "trends",
              title: "Charts",
              span: 2,
              node: (
                <div className="grid min-w-0 items-start gap-3 xl:grid-cols-2">
                  <ActivityChartCard points={activityPoints} />
                  <TaskDonutCard done={myDoneTasks} open={myOpenTasks} href="/admin/tasks?view=completed" />
                </div>
              ),
            },
            {
              id: "calendar",
              title: "Calendar",
              node: (
                <CollapsibleCalendar>
                  <WorkdeskCalendar
                    monthLabel={formatDate(monthStart, { month: "long", year: "numeric" })}
                    prevMonthKey={calendarDateKey(previousMonth)}
                    nextMonthKey={calendarDateKey(nextMonth)}
                    weeks={calendarWeeks(monthStart)}
                    todayKey={todayKey}
                    selectedKey={selectedKey}
                    selectedLabel={formatDate(selectedDay, { weekday: "long", month: "long", day: "numeric" })}
                    dueCounts={dueCounts}
                    mine={mineDay}
                    others={othersDay}
                    unassigned={unassignedDay}
                    userId={user.id}
                  />
                </CollapsibleCalendar>
              ),
            },
            {
              id: "schedule",
              title: "Upcoming schedule",
              span: 2,
              node: (
                <div className="min-w-0 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <p className="text-sm font-bold text-navy-900">Coming up</p>
                    <Link href="/admin/tasks?view=upcoming" className="text-xs font-semibold text-brand-700 hover:underline">View upcoming</Link>
                  </div>
                  {upcomingTasks.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-slate-500">Nothing is scheduled ahead.</p>
                  ) : (
                    <ol className="relative divide-y divide-slate-100">
                      {upcomingTasks.map((task, index) => (
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
              ),
            },
            {
              id: "insights",
              title: "Workload & operations insights",
              node: (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <dl className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active tasks</dt>
                      <dd className="text-2xl font-extrabold tabular-nums text-navy-900"><CountUp value={openTaskCount} /></dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Overdue</dt>
                      <dd className="text-2xl font-extrabold tabular-nums text-rose-700"><CountUp value={overdueTasks} /></dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Done this week</dt>
                      <dd className="text-2xl font-extrabold tabular-nums text-navy-900"><CountUp value={completedThisWeek} /></dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Open tickets</dt>
                      <dd className="text-2xl font-extrabold tabular-nums text-navy-900"><CountUp value={openTickets} /></dd>
                    </div>
                  </dl>
                  <div className="mt-4 space-y-2">
                    {statusOrder.map((status) => {
                      const count = statusCounts.get(status) ?? 0;
                      return (
                        <div key={status}>
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="font-semibold text-navy-800">{TASK_STATUS_LABELS[status]}</span>
                            <span className="tabular-nums text-slate-500">{count}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="wc-meter h-full rounded-full bg-brand-500" style={{ width: `${Math.round((count / statusTotal) * 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-navy-800">Unassigned open tasks</span>
                        <span className="tabular-nums text-slate-500">{unassignedTasks}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="wc-meter h-full rounded-full bg-violet-500" style={{ width: `${openTaskCount === 0 ? 0 : Math.round((unassignedTasks / openTaskCount) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              id: "activity",
              title: "Recent activity",
              span: 2,
              node: (
                <div className="rounded-xl border border-slate-200 bg-white">
                  {activityEvents.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-slate-500">No workdesk activity yet.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {activityEvents.map((event, index) => {
                        const href = event.task ? `/admin/tasks/${event.task.id}?from=${encodeURIComponent("/admin")}` : event.ticket ? `/admin/tickets/${event.ticket.id}` : "/admin/audit";
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
              ),
            },
            {
              id: "monitoring",
              title: "Monitoring",
              node: statusSummary ? (
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
              ) : (
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
              ),
            },
            {
              id: "work",
              title: "Tasks and tickets",
              span: 3,
              node: (
                <>
        <div className="min-w-0 space-y-4">
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Tickets</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ticketStats.map((stat, index) => (
            <ColorStatLink
              key={stat.label}
              {...stat}
              index={index}
              tone={(["emerald", "sky", "violet", "cyan"] as const)[index]}
            />
          ))}
        </div>
      </section>

      {overdueTaskItems.length > 0 && (
        <WorkSection
          className="mb-6"
          title="Overdue"
          href="/admin/tasks?view=overdue"
          countLabel={`View all ${overdueTasks}`}
        >
          <WorkList variant="rows" count={overdueTaskItems.length} empty="">
            {overdueTaskItems.map((task, index) => (
              <TaskRow
                key={task.id}
                index={index}
                href={`/admin/tasks/${task.id}?from=${encodeURIComponent("/admin")}`}
                reference={task.reference}
                title={task.title}
                status={task.status}
                priority={task.priority}
                dueAt={task.dueAt}
                overdue
                assignees={task.assignees.map((row) => row.user.name)}
                you={user.name}
              />
            ))}
          </WorkList>
        </WorkSection>
      )}

      <div className="mb-4 grid min-w-0 items-start gap-4 lg:grid-cols-2">
        <WorkSection title="Assigned to me" href="/admin/tasks" countLabel={`View all ${myOpenTasks}`}>
          <WorkList variant="rows" count={myTasks.length} empty="Nothing assigned to you yet. Create a task or pick one up from the team list.">
            {myTasks.map((task, index) => (
              <TaskRow
                key={task.id}
                index={index}
                href={`/admin/tasks/${task.id}?from=${encodeURIComponent("/admin")}`}
                reference={task.reference}
                title={task.title}
                status={task.status}
                priority={task.priority}
                dueAt={task.dueAt}
                overdue={isOverdue(task.dueAt, task.status, TASK_DONE)}
                assignees={task.assignees.map((row) => row.user.name)}
                you={user.name}
              />
            ))}
          </WorkList>
        </WorkSection>

        <WorkSection
          title="Assigned to others"
          href="/admin/tasks?view=team"
          countLabel={`View all ${teamOpenTasks}`}
        >
          <WorkList variant="rows" count={othersTasks.length} empty="No open tasks are assigned to other staff.">
            {othersTasks.map((task, index) => (
              <TaskRow
                key={task.id}
                index={index}
                href={`/admin/tasks/${task.id}?from=${encodeURIComponent("/admin")}`}
                reference={task.reference}
                title={task.title}
                status={task.status}
                priority={task.priority}
                dueAt={task.dueAt}
                overdue={isOverdue(task.dueAt, task.status, TASK_DONE)}
                assignees={task.assignees.map((row) => row.user.name)}
              />
            ))}
          </WorkList>
        </WorkSection>
      </div>

      {waitingTasks.length > 0 && (
        <WorkSection
          className="mb-6"
          title="Unassigned tasks"
          href="/admin/tasks?view=unassigned"
          countLabel="Assign these"
        >
          <WorkList variant="rows" count={waitingTasks.length} empty="">
            {waitingTasks.map((task, index) => (
              <TaskRow
                key={task.id}
                index={index}
                href={`/admin/tasks/${task.id}?from=${encodeURIComponent("/admin")}`}
                reference={task.reference}
                title={task.title}
                status={task.status}
                priority={task.priority}
                dueAt={task.dueAt}
                overdue={isOverdue(task.dueAt, task.status, TASK_DONE)}
                assignees={[]}
              />
            ))}
          </WorkList>
        </WorkSection>
      )}

      <div className="mb-4 grid min-w-0 items-start gap-4 lg:grid-cols-2">
        <WorkSection
          title="Tickets assigned to me"
          href="/admin/tickets?view=mine"
          countLabel={`View all ${myOpenTickets}`}
        >
          <WorkList variant="rows" count={myTickets.length} empty="Nothing assigned to you yet.">
            {myTickets.map((ticket, index) => (
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
                you={user.name}
              />
            ))}
          </WorkList>
        </WorkSection>

        <WorkSection
          title="Tickets assigned to others"
          href="/admin/tickets?view=team"
          countLabel={`View all ${teamOpenTickets}`}
        >
          <WorkList variant="rows" count={othersTickets.length} empty="No open tickets are assigned to other staff.">
            {othersTickets.map((ticket, index) => (
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
              />
            ))}
          </WorkList>
        </WorkSection>
      </div>

      {waitingTickets.length > 0 && (
        <WorkSection
          className="mb-6"
          title="Unassigned tickets"
          href="/admin/tickets?view=unassigned"
          countLabel="Assign these"
        >
          <WorkList variant="rows" count={waitingTickets.length} empty="">
            {waitingTickets.map((ticket, index) => (
              <TicketRow
                key={ticket.id}
                index={index}
                href={`/admin/tickets/${ticket.id}`}
                reference={ticket.reference}
                title={ticket.subject}
                status={ticket.status}
                priority={ticket.priority}
                subtitle={ticket.customer.name}
                assignees={[]}
              />
            ))}
          </WorkList>
        </WorkSection>
      )}

      <div className="mb-6">
          <Card>
            <CardTitle description="Technician and customer updates.">Updates</CardTitle>
            {recentNotifications.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentNotifications.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={workdeskHref(user.role, item)}
                      className="-mx-2 block rounded-lg px-2 py-2.5 hover:bg-slate-50"
                    >
                      <span className={`block truncate text-sm font-semibold ${item.readAt ? "text-navy-800" : "text-navy-900"}`}>
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{item.body}</span>
                      <span className="mt-0.5 block text-xs text-slate-400">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/notifications"
              className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
            >
              All notifications
            </Link>
          </Card>
      </div>

      {canSeeCms || canSeeEnquiries ? (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardTitle description="Website and inbox at a glance.">Site overview</CardTitle>
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              {siteStats.map((stat) => (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="rounded-lg border border-slate-200 px-3 py-3 hover:border-brand-300 hover:bg-brand-50/50"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-2xl font-extrabold tabular-nums text-navy-900">{stat.value}</p>
                  {stat.hint && <p className="mt-0.5 text-xs text-amber-600">{stat.hint}</p>}
                </Link>
              ))}
            </div>
            {recentSubmissions.length === 0 ? (
              <EmptyState
                icon={<Inbox className="size-8" />}
                title="No inquiries yet"
                description="Messages sent through the contact, support, and quote forms appear here."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentSubmissions.map((submission) => (
                  <li key={submission.id}>
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-slate-50"
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {submission.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-navy-800">{submission.name}</span>
                          <Badge tone={submission.status === "NEW" ? "info" : "neutral"}>
                            {submission.type.toLowerCase()}
                          </Badge>
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-slate-600">
                          {submission.subject || submission.message}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-400">
                          {formatDateTime(submission.createdAt)}
                          {submission.emailSentAt ? (
                            <span className="ml-2 inline-flex items-center gap-1 text-emerald-700">
                              <CircleCheck className="size-3" aria-hidden="true" />
                              emailed
                            </span>
                          ) : (
                            <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                              <TriangleAlert className="size-3" aria-hidden="true" />
                              not emailed
                            </span>
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
              <dd>
                {mail.isConfigured ? (
                  <Badge tone="success">Configured</Badge>
                ) : (
                  <Badge tone="warning">Not set up</Badge>
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-600">Public URL</dt>
              <dd className="truncate font-mono text-xs text-slate-700">
                {env.siteUrl.replace(/^https?:\/\//, "")}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Subscribers</dt>
              <dd className="font-semibold text-navy-900">{subscribers}</dd>
            </div>
          </dl>
        </Card>
      </div>
      ) : null}
        </div>
                </>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
