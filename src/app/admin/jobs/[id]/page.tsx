import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";

import { deleteJobAction, saveJobAction } from "@/app/admin/jobs/actions";
import { JobForm } from "@/components/admin/job-form";
import { Alert, Card, CardTitle, PageHeader } from "@/components/admin/ui";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Edit posting" };

export default async function EditJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; created?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const [user, job] = await Promise.all([
    getCurrentUser(),
    prisma.jobPosting.findUnique({ where: { id } }),
  ]);

  if (!job) notFound();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={job.title}
        description={`Public address: /careers/${job.slug}`}
        breadcrumb={{ href: "/admin/jobs", label: "Careers" }}
        actions={
          <Link
            href={`/careers/${job.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            View
          </Link>
        }
      />

      {(query.saved || query.created) && (
        <div className="mb-5">
          <Alert tone="success">
            {query.created ? "The posting was created." : "Changes saved."}
          </Alert>
        </div>
      )}
      {query.error && (
        <div className="mb-5">
          <Alert tone="danger">Please check the required fields.</Alert>
        </div>
      )}

      <JobForm
        action={saveJobAction}
        submitLabel="Save changes"
        values={{
          id: job.id,
          title: job.title,
          slug: job.slug,
          department: job.department ?? "",
          location: job.location,
          employmentType: job.employmentType,
          summary: job.summary ?? "",
          description: job.description,
          requirements: job.requirements,
          salaryRange: job.salaryRange ?? "",
          status: job.status,
          closesAt: job.closesAt
            ? job.closesAt.toISOString().slice(0, 10)
            : "",
        }}
      />

      {hasRole(user, "ADMIN") && (
        <Card className="mt-6 border-red-200">
          <CardTitle description="Set the status to Closed instead if you want to keep a record.">
            Delete this posting
          </CardTitle>
          <form action={deleteJobAction}>
            <input type="hidden" name="id" value={job.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete posting
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
