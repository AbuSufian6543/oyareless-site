import Link from "next/link";
import { Suspense } from "react";
import {
  Bell,
  Boxes,
  ClipboardList,
  Headset,
  Plus,
  ShieldAlert,
  Users,
  Wrench,
} from "lucide-react";

import { Alert } from "@/components/admin/ui";
import { DashboardHero } from "@/components/workdesk/dashboard-panels";
import {
  ActivityFeed,
  CalendarPanel,
  ChartsSkeleton,
  HeroSummary,
  InsightsPanel,
  ListsSkeleton,
  MailAlerts,
  MonitoringPanel,
  OperationsStats,
  SchedulePanel,
  SearchResults,
  SiteOverview,
  StatsSkeleton,
  TrendCharts,
  WorkLists,
} from "@/components/workdesk/dashboard-sections";
import { OfficeClock } from "@/components/workdesk/office-clock";
import { WidgetBoard } from "@/components/workdesk/widget-board";
import { WeatherPanel, WeatherSkeleton } from "@/components/workdesk/weather-widget";
import { WorkSearch } from "@/components/workdesk/work-search";
import { getCurrentUser } from "@/lib/auth";
import {
  canAccessApplications,
  canAccessContent,
  canAccessEnquiries,
} from "@/lib/staff-access";
import { calendarDateKey, zonedHour } from "@/lib/timezone";
import { formatDate } from "@/lib/utils";
import { cleanWorkQuery } from "@/lib/workdesk/list-search";
import { parseDateInput, startOfToday } from "@/lib/workdesk/dates";
import { currentDashboardBounds } from "@/lib/workdesk/dashboard-load";

export const dynamic = "force-dynamic";
export const metadata = { title: "Workdesk" };

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
  const bounds = currentDashboardBounds();
  const selectedDay = parseDateInput(params.day ?? "") ?? today;
  const selectedKey = calendarDateKey(selectedDay);
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const hour = zonedHour();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayLabel = formatDate(new Date(), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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

  return (
    <>
      {params.denied === "1" ? (
        <div className="mb-4">
          <Alert tone="danger">You do not have access to that section.</Alert>
        </div>
      ) : null}
      {params.error === "title" ? (
        <div className="mb-4">
          <Alert tone="danger">Give the task a title of at least 3 characters.</Alert>
        </div>
      ) : null}
      {canSeeCms ? (
        <Suspense fallback={null}>
          <MailAlerts />
        </Suspense>
      ) : null}

      <DashboardHero
        className="mb-0"
        hello={hello}
        firstName={firstName}
        todayLabel={todayLabel}
        summary={
          <Suspense fallback={<span className="inline-block h-4 w-64 animate-pulse rounded bg-slate-200 align-middle" />}>
            <HeroSummary userId={user.id} bounds={bounds} />
          </Suspense>
        }
        persona={user.dashboardPersona}
        accountHref="/admin/account"
        meta={<OfficeClock />}
        center={
          <Suspense fallback={<WeatherSkeleton />}>
            <WeatherPanel />
          </Suspense>
        }
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
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3.5 text-sm font-semibold text-white transition duration-150 hover:bg-brand-700"
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
                  <Link key={action.href} href={action.href} className="block rounded-md px-2 py-1.5 text-sm font-medium text-navy-800 transition-colors duration-150 hover:bg-slate-50">
                    {action.label}
                  </Link>
                ))}
              </div>
            </details>
          </>
        }
      />

      {query ? (
        <Suspense fallback={<ListsSkeleton />}>
          <SearchResults query={query} you={user.name} />
        </Suspense>
      ) : null}

      <div className="mt-4">
        <WidgetBoard
          userId={user.id}
          widgets={[
            {
              id: "trends",
              title: "Charts",
              span: 2,
              node: (
                <Suspense fallback={<ChartsSkeleton />}>
                  <TrendCharts userId={user.id} bounds={bounds} />
                </Suspense>
              ),
            },
            {
              id: "calendar",
              title: "Calendar",
              place: "aside",
              node: (
                <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-slate-100" />}>
                  <CalendarPanel userId={user.id} day={params.day ?? ""} />
                </Suspense>
              ),
            },
            {
              id: "overview",
              title: "Operations",
              span: 3,
              node: (
                <Suspense fallback={<StatsSkeleton />}>
                  <OperationsStats userId={user.id} bounds={bounds} />
                </Suspense>
              ),
            },
            {
              id: "quick",
              title: "Quick actions",
              span: 3,
              node: (
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-navy-800 transition duration-150 hover:-translate-y-px hover:border-brand-300 hover:bg-brand-50"
                    >
                      <action.Icon className="size-4 text-brand-700" aria-hidden="true" />
                      {action.label}
                    </Link>
                  ))}
                </div>
              ),
            },
            {
              id: "schedule",
              title: "Upcoming schedule",
              span: 2,
              node: (
                <Suspense fallback={<div className="h-28 animate-pulse rounded-xl bg-slate-100" />}>
                  <SchedulePanel />
                </Suspense>
              ),
            },
            {
              id: "insights",
              title: "Workload & operations insights",
              node: (
                <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-slate-100" />}>
                  <InsightsPanel userId={user.id} bounds={bounds} />
                </Suspense>
              ),
            },
            {
              id: "activity",
              title: "Recent activity",
              span: 2,
              node: (
                <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-slate-100" />}>
                  <ActivityFeed />
                </Suspense>
              ),
            },
            {
              id: "monitoring",
              title: "Monitoring",
              node: (
                <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-slate-100" />}>
                  <MonitoringPanel user={user} />
                </Suspense>
              ),
            },
            {
              id: "work",
              title: "Tasks and tickets",
              span: 3,
              node: (
                <>
                  <Suspense fallback={<ListsSkeleton />}>
                    <WorkLists userId={user.id} you={user.name} bounds={bounds} />
                  </Suspense>
                  {canSeeCms || canSeeEnquiries ? (
                    <Suspense fallback={null}>
                      <SiteOverview
                        canSeeCms={canSeeCms}
                        canSeeEnquiries={canSeeEnquiries}
                        canSeeApplications={canSeeApplications}
                      />
                    </Suspense>
                  ) : null}
                </>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
