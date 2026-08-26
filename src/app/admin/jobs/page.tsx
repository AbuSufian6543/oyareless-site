import Link from "next/link";
import { Briefcase, Plus, SquarePen } from "lucide-react";

import {
  Alert,
  Card,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Careers" };

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const params = await searchParams;

  const jobs = await prisma.jobPosting.findMany({
    orderBy: [{ status: "asc" }, { postedAt: "desc" }],
  });

  return (
    <div>
      <PageHeader
        title="Careers"
        description="Open roles listed on the careers page with structured data for Google Jobs."
        actions={
          <Link
            href="/admin/jobs/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            Post a role
          </Link>
        }
      />

      {params.deleted && (
        <div className="mb-5">
          <Alert tone="success">The posting was deleted.</Alert>
        </div>
      )}

      {jobs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Briefcase className="size-8" aria-hidden="true" />}
            title="No open roles"
            description="Posted roles appear on /careers and are picked up by Google Jobs."
            action={
              <Link
                href="/admin/jobs/new"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <Plus className="size-4" aria-hidden="true" />
                Post a role
              </Link>
            }
          />
        </Card>
      ) : (
        <DataTable headers={["Role", "Status", "Posted", "Closes", "Actions"]}>
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-slate-50/70">
              <td className="px-4 py-3.5">
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="font-semibold text-navy-900 hover:text-brand-700"
                >
                  {job.title}
                </Link>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {[job.department, job.location, job.employmentType]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={job.status} />
              </td>
              <td className="px-4 py-3.5 text-slate-500">
                {formatDate(job.postedAt)}
              </td>
              <td className="px-4 py-3.5 text-slate-500">
                {job.closesAt ? formatDate(job.closesAt) : "Open"}
              </td>
              <td className="px-4 py-3.5">
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-navy-800 transition-colors hover:bg-white"
                >
                  <SquarePen className="size-3.5" aria-hidden="true" />
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
