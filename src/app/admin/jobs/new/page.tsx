import { saveJobAction } from "@/app/admin/jobs/actions";
import { JobForm } from "@/components/admin/job-form";
import { Alert, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Post a role" };

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Post a role"
        description="Published roles appear on /careers with JobPosting structured data."
        breadcrumb={{ href: "/admin/jobs", label: "Careers" }}
      />

      {params.error && (
        <div className="mb-5">
          <Alert tone="danger">Please give the role a title.</Alert>
        </div>
      )}

      <JobForm
        action={saveJobAction}
        submitLabel="Create posting"
        values={{
          title: "",
          slug: "",
          department: "",
          location: "Sault Ste. Marie, ON",
          employmentType: "Full-time",
          summary: "",
          description: "",
          requirements: "",
          salaryRange: "",
          status: "DRAFT",
          closesAt: "",
        }}
      />
    </div>
  );
}
