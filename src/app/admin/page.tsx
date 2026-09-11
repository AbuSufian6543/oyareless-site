import Link from "next/link";
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
  Plus,
  Radio,
  TriangleAlert,
  UserRound,
  Users,
} from "lucide-react";

import { Alert, Badge, Card, CardTitle, EmptyState } from "@/components/admin/ui";
import { WorkItem, WorkList, WorkSection, WorkStatLink } from "@/components/workdesk/work-item";
import { env } from "@/lib/env";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { getResolvedMail } from "@/lib/mail-settings";
import { prisma } from "@/lib/prisma";
import { formatDate, formatDateTime } from "@/lib/utils";
import { workdeskHref } from "@/lib/workdesk/access";
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
import { isOverdue, startOfToday, startOfTomorrow } from "@/lib/workdesk/dates";

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
  searchParams: Promise<{ denied?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const params = await searchParams;
  const canSeeCms = hasRole(user, "EDITOR");
  const today = startOfToday();
  const tomorrow = startOfTomorrow();
  const myId = user.id;
  const dueTodayFilter = { ...OPEN_TASK, dueAt: { gte: today, lt: tomorrow } };
  const upcomingFilter = { ...OPEN_TASK, dueAt: { gte: tomorrow } };
  const overdueFilter = { ...OPEN_TASK, dueAt: { lt: today } };

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
    dueTodayTasks,
    upcomingTasks,
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
    subscribers,
    recentSubmissions,
    mail,
    recentNotifications,
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
      where: dueTodayFilter,
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 10,
      include: taskInclude,
    }),
    prisma.internalTask.findMany({
      where: upcomingFilter,
      orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
      take: 10,
      include: taskInclude,
    }),
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
    canSeeCms ? prisma.formSubmission.count({ where: { status: "NEW" } }).catch(() => 0) : Promise.resolve(0),
    canSeeCms ? prisma.quoteRequest.count({ where: { status: "NEW" } }).catch(() => 0) : Promise.resolve(0),
    canSeeCms ? prisma.subscriber.count({ where: { status: "CONFIRMED" } }).catch(() => 0) : Promise.resolve(0),
    canSeeCms
      ? prisma.formSubmission
          .findMany({ orderBy: { createdAt: "desc" }, take: 5 })
          .catch(() => [])
      : Promise.resolve([]),
    getResolvedMail().catch((): { isConfigured: boolean } => ({
      isConfigured: false,
    })),
    prisma.workdeskNotification
      .findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
      .catch(() => []),
  ]);

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayLabel = formatDate(new Date(), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const taskStats = [
    {
      label: "Today's tasks",
      value: dueTodayCount,
      hint: dueTodayCount === 1 ? "1 item due before end of day" : "Due before end of day",
      href: "/admin/tasks?view=today",
      Icon: CalendarDays,
    },
    {
      label: "Upcoming tasks",
      value: upcomingCount,
      hint: upcomingCount > 0 ? "Due after today" : "Nothing scheduled ahead",
      href: "/admin/tasks?view=upcoming",
      Icon: CalendarClock,
    },
    {
      label: "Overdue",
      value: overdueTasks,
      hint: overdueTasks > 0 ? "Needs attention" : "Nothing overdue",
      href: "/admin/tasks?view=overdue",
      Icon: TriangleAlert,
      alert: overdueTasks > 0,
    },
    {
      label: "Unassigned",
      value: unassignedTasks,
      hint: unassignedTasks > 0 ? "Waiting for an owner" : "Every open task has an owner",
      href: "/admin/tasks?view=unassigned",
      Icon: ClipboardList,
    },
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
    { label: "New inquiries", value: newSubmissions, href: "/admin/submissions", Icon: Inbox },
    { label: "New quotes", value: newQuotes, href: "/admin/quotes", Icon: FileText },
  ];

  return (
    <>
      <section className="relative mb-8 overflow-hidden rounded-2xl bg-navy-900 px-6 py-7 text-white shadow-sm lg:px-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-brand-500/20" />
        <div className="pointer-events-none absolute -bottom-20 right-24 size-40 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">
              {todayLabel}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
              {hello}, {firstName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-navy-100">
              {dueTodayCount} due today · {upcomingCount} upcoming · {overdueTasks} overdue ·{" "}
              {myOpenTickets} ticket{myOpenTickets === 1 ? "" : "s"} assigned to you
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/tasks/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-brand-400"
            >
              <Plus className="size-4" aria-hidden="true" />
              New task
            </Link>
            <Link
              href="/admin/tickets?create=1"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
            >
              New ticket
            </Link>
          </div>
        </div>
      </section>

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

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">At a glance</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {taskStats.map((stat) => (
            <WorkStatLink key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Tickets</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ticketStats.map((stat) => (
            <WorkStatLink key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <WorkSection
          title="Today's tasks"
          href="/admin/tasks?view=today"
          countLabel={`${dueTodayCount} due today`}
        >
          <WorkList count={dueTodayTasks.length} empty="Nothing is due today. Upcoming work is listed next.">
            {dueTodayTasks.map((task) => (
              <WorkItem
                key={task.id}
                kind="task"
                href={`/admin/tasks/${task.id}`}
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
          title="Upcoming tasks"
          href="/admin/tasks?view=upcoming"
          countLabel={`${upcomingCount} scheduled`}
        >
          <WorkList count={upcomingTasks.length} empty="No future due dates yet. Add a date when you create or edit a task.">
            {upcomingTasks.map((task) => (
              <WorkItem
                key={task.id}
                kind="task"
                href={`/admin/tasks/${task.id}`}
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
      </div>

      {overdueTaskItems.length > 0 && (
        <WorkSection
          className="mb-8"
          title="Overdue"
          href="/admin/tasks?view=overdue"
          countLabel={`View all ${overdueTasks}`}
        >
          <WorkList count={overdueTaskItems.length} empty="">
            {overdueTaskItems.map((task) => (
              <WorkItem
                key={task.id}
                kind="task"
                href={`/admin/tasks/${task.id}`}
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

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <WorkSection title="Assigned to me" href="/admin/tasks" countLabel={`View all ${myOpenTasks}`}>
          <WorkList count={myTasks.length} empty="Nothing assigned to you. Create a task or pick one up from the team list.">
            {myTasks.map((task) => (
              <WorkItem
                key={task.id}
                kind="task"
                href={`/admin/tasks/${task.id}`}
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
          <WorkList count={othersTasks.length} empty="No open tasks are assigned to other staff.">
            {othersTasks.map((task) => (
              <WorkItem
                key={task.id}
                kind="task"
                href={`/admin/tasks/${task.id}`}
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
          className="mb-8"
          title="Unassigned tasks"
          href="/admin/tasks?view=unassigned"
          countLabel="Assign these"
        >
          <WorkList count={waitingTasks.length} empty="">
            {waitingTasks.map((task) => (
              <WorkItem
                key={task.id}
                kind="task"
                href={`/admin/tasks/${task.id}`}
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

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <WorkSection
          title="Tickets assigned to me"
          href="/admin/tickets?view=mine"
          countLabel={`View all ${myOpenTickets}`}
        >
          <WorkList count={myTickets.length} empty="No open tickets are assigned to you.">
            {myTickets.map((ticket) => (
              <WorkItem
                key={ticket.id}
                kind="ticket"
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
          <WorkList count={othersTickets.length} empty="No open tickets are assigned to other staff.">
            {othersTickets.map((ticket) => (
              <WorkItem
                key={ticket.id}
                kind="ticket"
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
          className="mb-8"
          title="Unassigned tickets"
          href="/admin/tickets?view=unassigned"
          countLabel="Assign these"
        >
          <WorkList count={waitingTickets.length} empty="">
            {waitingTickets.map((ticket) => (
              <WorkItem
                key={ticket.id}
                kind="ticket"
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

      <div className="mb-8">
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

      {canSeeCms ? (
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
    </>
  );
}
