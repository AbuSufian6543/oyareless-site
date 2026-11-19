import Link from "next/link";
import { FileText, Search } from "lucide-react";

import {
  deleteAllApplicationsAction,
  deleteApplicationsAction,
} from "@/app/admin/applications/actions";
import {
  ApplicationSelectBox,
  ApplicationSelection,
} from "@/components/admin/application-selection";
import {
  Alert,
  Badge,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
} from "@/components/admin/ui";
import { requireStaffAccess } from "@/lib/admin-guard";
import { applicationListPath, applicationListWhere } from "@/lib/application-list";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { canAccessApplications } from "@/lib/staff-access";
import {
  jobApplicationStatusLabel,
  jobApplicationStatusTone,
  JOB_APPLICATION_STATUSES,
} from "@/lib/careers";
import { getResolvedMail } from "@/lib/mail-settings";
import { getResolvedTurnstile } from "@/lib/turnstile";
import { prisma } from "@/lib/prisma";
import { cn, formatBytes, formatDateTime } from "@/lib/utils";

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
    none?: string;
  }>;
}) {
  await requireStaffAccess(canAccessApplications);
  const params = await searchParams;
  const listed = applicationListWhere(params.status, params.q);
  const { filter, query, where } = listed;

  const [applications, counts, matchingCount, mail, turnstile, user] = await Promise.all([
    prisma.jobApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { job: { select: { slug: true } } },
    }),
    prisma.jobApplication.groupBy({ by: ["status"], _count: true }),
    prisma.jobApplication.count({ where }),
    getResolvedMail(),
    getResolvedTurnstile(),
    getCurrentUser(),
  ]);

  const countFor = (status: string) =>
    status === "all"
      ? counts.reduce((total, row) => total + row._count, 0)
      : (counts.find((row) => row.status === status)?._count ?? 0);

  const canDelete = hasRole(user, "ADMIN");
  const deletedCount = Number.parseInt(params.deleted ?? "", 10);
  const returnTo = applicationListPath(filter, query);

  function hrefFor(status: string) {
    return applicationListPath(status, query);
  }

  return (
    <div>
      <PageHeader
        title="Applications"
        description="Résumés submitted from the careers pages. Files are stored privately and are not on the public site."
      />

      {params.deleted && (
        <div className="mb-5">
          <Alert tone="success">
            {Number.isFinite(deletedCount) && deletedCount > 1
              ? `${deletedCount} applications were deleted.`
              : "The application was deleted."}
          </Alert>
        </div>
      )}

      {params.none && (
        <div className="mb-5">
          <Alert tone="warning">Nothing was deleted.</Alert>
        </div>
      )}

      {!turnstile.isConfigured && (
        <div className="mb-5">
          <Alert tone="warning">
            Cloudflare Turnstile is not configured, so the public form will not
            accept uploads and sign-in pages will skip the human check. Add the
            site and secret keys under{" "}
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
      ) : canDelete ? (
        <ApplicationSelection
          ids={applications.map((application) => application.id)}
          deleteAction={deleteApplicationsAction}
          deleteAllAction={deleteAllApplicationsAction}
          returnTo={returnTo}
          filter={filter}
          query={query}
          matchingCount={matchingCount}
        >
          <DataTable headers={["Select", "Applicant", "Role", "Status", "Received", "Résumé"]}>
            {applications.map((application) => (
              <tr key={application.id} className="hover:bg-slate-50/70">
                <td className="w-12 px-2 py-3.5">
                  <ApplicationSelectBox
                    id={application.id}
                    label={`Select ${application.name}`}
                  />
                </td>
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
        </ApplicationSelection>
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
