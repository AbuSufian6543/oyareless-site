import Link from "next/link";
import {
  Briefcase,
  CircleCheck,
  FileText,
  Inbox,
  Mail,
  Newspaper,
  Plus,
  Radio,
  TriangleAlert,
  Users,
} from "lucide-react";

import { Alert, Badge, Card, CardTitle, EmptyState, PageHeader } from "@/components/admin/ui";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    publishedPages,
    draftPages,
    streams,
    posts,
    jobs,
    newSubmissions,
    subscribers,
    recentSubmissions,
  ] = await Promise.all([
    prisma.page.count({ where: { status: "PUBLISHED" } }).catch(() => 0),
    prisma.page.count({ where: { status: "DRAFT" } }).catch(() => 0),
    prisma.stream.count({ where: { status: "PUBLISHED" } }).catch(() => 0),
    prisma.post.count({ where: { status: "PUBLISHED" } }).catch(() => 0),
    prisma.jobPosting.count({ where: { status: "PUBLISHED" } }).catch(() => 0),
    prisma.formSubmission.count({ where: { status: "NEW" } }).catch(() => 0),
    prisma.subscriber.count({ where: { status: "CONFIRMED" } }).catch(() => 0),
    prisma.formSubmission
      .findMany({ orderBy: { createdAt: "desc" }, take: 6 })
      .catch(() => []),
  ]);

  const stats = [
    {
      label: "Published pages",
      value: publishedPages,
      hint: draftPages > 0 ? `${draftPages} draft${draftPages === 1 ? "" : "s"}` : undefined,
      href: "/admin/pages",
      Icon: FileText,
    },
    { label: "Live streams", value: streams, href: "/admin/streams", Icon: Radio },
    { label: "News articles", value: posts, href: "/admin/posts", Icon: Newspaper },
    { label: "Open positions", value: jobs, href: "/admin/jobs", Icon: Briefcase },
    { label: "New enquiries", value: newSubmissions, href: "/admin/submissions", Icon: Inbox },
    { label: "Subscribers", value: subscribers, href: "/admin/subscribers", Icon: Users },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of site content and recent customer enquiries."
        actions={
          <Link
            href="/admin/pages/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            New page
          </Link>
        }
      />

      {!env.smtp.isConfigured && (
        <div className="mb-6">
          <Alert tone="warning">
            <strong>SMTP is not configured.</strong> Form submissions are being
            saved to the inbox, but no notification emails are being sent. Add
            your SMTP credentials to the <code>.env</code> file and restart the
            app, then verify the connection under Site Settings.
          </Alert>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums text-navy-900">
                  {stat.value}
                </p>
                {stat.hint && (
                  <p className="mt-1 text-xs text-amber-600">{stat.hint}</p>
                )}
              </div>
              <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <stat.Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardTitle description="The six most recent form submissions.">
              Recent enquiries
            </CardTitle>

            {recentSubmissions.length === 0 ? (
              <EmptyState
                icon={<Inbox className="size-8" />}
                title="No enquiries yet"
                description="Messages sent through the contact, support, and quote forms appear here."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentSubmissions.map((submission) => (
                  <li key={submission.id}>
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-slate-50"
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {submission.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-semibold text-navy-800">
                            {submission.name}
                          </span>
                          <Badge
                            tone={submission.status === "NEW" ? "info" : "neutral"}
                          >
                            {submission.type.toLowerCase()}
                          </Badge>
                          {submission.status === "NEW" && (
                            <Badge tone="success">New</Badge>
                          )}
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

        <div className="space-y-6">
          <Card>
            <CardTitle>Quick actions</CardTitle>
            <div className="space-y-2">
              {[
                { href: "/admin/pages/new", label: "Create a page", Icon: FileText },
                { href: "/admin/streams/new", label: "Add a live stream", Icon: Radio },
                { href: "/admin/posts/new", label: "Write an article", Icon: Newspaper },
                { href: "/admin/jobs/new", label: "Post a job", Icon: Briefcase },
                { href: "/admin/settings", label: "Edit contact details", Icon: Mail },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-navy-800 transition-colors hover:border-brand-300 hover:bg-brand-50"
                >
                  <action.Icon
                    className="size-4 shrink-0 text-brand-600"
                    aria-hidden="true"
                  />
                  {action.label}
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>System</CardTitle>
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Email delivery</dt>
                <dd>
                  {env.smtp.isConfigured ? (
                    <Badge tone="success">Configured</Badge>
                  ) : (
                    <Badge tone="warning">Not set up</Badge>
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Public URL</dt>
                <dd className="truncate font-mono text-xs text-slate-700">
                  {env.siteUrl.replace(/^https?:\/\//, "")}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
