import Link from "next/link";
import { FileText, Search } from "lucide-react";

import {
  Alert,
  Badge,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import {
  jobApplicationStatusLabel,
  jobApplicationStatusTone,
  JOB_APPLICATION_STATUSES,
} from "@/lib/careers";
import { getResolvedMail } from "@/lib/mail-settings";
import { getResolvedTurnstile } from "@/lib/turnstile";
import { prisma } from "@/lib/prisma";
import { cn, formatBytes, formatDateTime } from "@/lib/utils";
import type { JobApplicationStatus } from "@/generated/prisma/client";

export const metadata = { title: "Applications" };

const FILTERS = [
  { value: "all", label: "All" },
  ...JOB_APPLICATION_STATUSES,
] as const;

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    deleted?: string;
  }>;
}) {
  await requireAdminRole("EDITOR");
  const params = await searchParams;
  const filter = params.status ?? "NEW";
  const query = (params.q ?? "").trim();
  const statusFilter =
    filter !== "all" &&
    JOB_APPLICATION_STATUSES.some((item) => item.value === filter)
      ? (filter as JobApplicationStatus)
      : undefined;

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { jobTitle: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [applications, counts, mail, turnstile] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { job: { select: { slug: true } } },
    }),
    prisma.jobApplication.groupBy({ by: ["status"], _count: true }),
    getResolvedMail(),
    getResolvedTurnstile(),
  ]);

  const countFor = (status: string) =>
    status === "all"
      ? counts.reduce((total, row) => total + row._count, 0)
      : (counts.find((row) => row.status === status)?._count ?? 0);

  function hrefFor(status: string) {
    const search = new URLSearchParams();
    if (status !== "NEW") search.set("status", status);
    if (query) search.set("q", query);
    const qs = search.toString();
    return qs ? `/admin/applications?${qs}` : "/admin/applications";
  }

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Résumés submitted from the careers pages. Files are stored privately and are not on the public site."
      />

      {params.deleted && (
        <div className="mb-5">
          <Alert tone="success">The application was deleted.</Alert>
        </div>
      )}

      {!turnstile.isConfigured && (
        <div className="mb-5">
          <Alert tone="warning">
            Cloudflare Turnstile is not configured, so the public form will not
            accept uploads. Add the site and secret keys under{" "}
            <Link href="/admin/settings" className="font-semibold underline">
              Site Settings
            </Link>
            .
          </Alert>
        </div>
      )}

      {!mail.hasCareerNotifyList && (
        <div className="mb-5">
          <Alert tone="warning">
            No career notification emails are set. Applications are still saved
            here, but nobody is emailed a copy. Add addresses under{" "}
            <Link href="/admin/settings" className="font-semibold underline">
              Site Settings
            </Link>
            . They do not go to the office inbox.
          </Alert>
        </div>
      )}

      <form className="mb-5 flex flex-wrap items-center gap-3" method="get">
        {filter !== "all" && filter !== "NEW" ? (
          <input type="hidden" name="status" value={filter} />
        ) : null}
        {filter === "all" ? <input type="hidden" name="status" value="all" /> : null}
        <label className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search name, email, or role"
            className="field pl-10"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-navy-800 hover:bg-slate-50"
        >
          Search
        </button>
      </form>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active =
            item.value === "all" ? filter === "all" : filter === item.value;
          const href =
            item.value === "NEW" && !query
              ? "/admin/applications"
              : hrefFor(item.value);
          return (
            <Link
              key={item.value}
              href={href}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold",
                active
                  ? "bg-navy-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {item.label} ({countFor(item.value)})
            </Link>
          );
        })}
      </div>

      {applications.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText className="size-8" aria-hidden="true" />}
            title="No applications"
            description="When someone applies from /careers, their details and PDF résumé appear here."
          />
        </Card>
      ) : (
        <DataTable headers={["Applicant", "Role", "Status", "Received", "Résumé"]}>
          {applications.map((application) => (
            <tr key={application.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3.5">
                <Link
                  href={`/admin/applications/${application.id}`}
                  className="font-semibold text-navy-900 hover:text-brand-700"
                >
                  {application.name}
                </Link>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {application.email}
                </span>
              </td>
              <td className="px-4 py-3.5 text-sm text-slate-600">
                {application.jobTitle}
              </td>
              <td className="px-4 py-3.5">
                <Badge tone={jobApplicationStatusTone(application.status)}>
                  {jobApplicationStatusLabel(application.status)}
                </Badge>
              </td>
              <td className="px-4 py-3.5 text-slate-500">
                {formatDateTime(application.createdAt)}
              </td>
              <td className="px-4 py-3.5 text-xs text-slate-500">
                {formatBytes(application.sizeBytes)}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
