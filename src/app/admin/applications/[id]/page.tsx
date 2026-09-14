import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Mail, Phone, Trash2 } from "lucide-react";

import {
  deleteApplicationAction,
  updateApplicationAction,
} from "@/app/admin/applications/actions";
import { ConfirmDeleteForm } from "@/components/admin/confirm-delete-form";
import {
  Alert,
  Badge,
  Card,
  CardTitle,
  PageHeader,
  SelectField,
  TextAreaField,
} from "@/components/admin/ui";
import { requireAdminRole } from "@/lib/admin-guard";
import { getCurrentUser, hasRole } from "@/lib/auth";
import {
  jobApplicationStatusLabel,
  jobApplicationStatusTone,
  JOB_APPLICATION_STATUSES,
} from "@/lib/careers";
import { prisma } from "@/lib/prisma";
import { formatBytes, formatDateTime, telHref } from "@/lib/utils";

export const metadata = { title: "Application" };

export default async function ApplicationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireAdminRole("EDITOR");
  const { id } = await params;
  const query = await searchParams;
  const [user, application] = await Promise.all([
    getCurrentUser(),
    prisma.jobApplication.findUnique({
      where: { id },
      include: { job: { select: { slug: true, title: true } } },
    }),
  ]);

  if (!application) notFound();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={application.name}
        description={`${application.jobTitle} · ${formatDateTime(application.createdAt)}`}
        breadcrumb={{ href: "/admin/applications", label: "Applications" }}
        actions={
          <Badge tone={jobApplicationStatusTone(application.status)}>
            {jobApplicationStatusLabel(application.status)}
          </Badge>
        }
      />

      {query.saved && (
        <div className="mb-5">
          <Alert tone="success">The application was updated.</Alert>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-5">
          <Card>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </dt>
                <dd className="mt-1">
                  <a
                    href={`mailto:${application.email}`}
                    className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                  >
                    <Mail className="size-3.5" aria-hidden="true" />
                    {application.email}
                  </a>
                </dd>
              </div>
              {application.phone && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Phone
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={telHref(application.phone)}
                      className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                    >
                      <Phone className="size-3.5" aria-hidden="true" />
                      {application.phone}
                    </a>
                  </dd>
                </div>
              )}
              {application.location && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    City
                  </dt>
                  <dd className="mt-1 text-navy-900">{application.location}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </dt>
                <dd className="mt-1 text-navy-900">
                  {application.job?.slug ? (
                    <Link
                      href={`/careers/${application.job.slug}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {application.jobTitle}
                    </Link>
                  ) : (
                    application.jobTitle
                  )}
                </dd>
              </div>
            </dl>

            {application.message ? (
              <div className="mt-5 border-t border-slate-100 pt-5">
                <h2 className="text-sm font-semibold text-navy-800">Cover note</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {application.message}
                </p>
              </div>
            ) : null}
          </Card>

          <Card>
            <CardTitle description="Served only to signed-in editors. The file is not on a public URL.">
              Résumé
            </CardTitle>
            <p className="text-sm text-slate-600">
              {application.originalName} · {formatBytes(application.sizeBytes)}
            </p>
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <iframe
                title={`Résumé for ${application.name}`}
                src={`/api/admin/applications/${application.id}/resume`}
                className="h-[min(70vh,40rem)] w-full bg-white"
              />
            </div>
            <a
              href={`/api/admin/applications/${application.id}/resume?download=1`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Download className="size-4" aria-hidden="true" />
              Download PDF
            </a>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <form action={updateApplicationAction} className="space-y-4">
              <input type="hidden" name="id" value={application.id} />
              <SelectField
                label="Status"
                name="status"
                defaultValue={application.status}
                options={JOB_APPLICATION_STATUSES.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
              />
              <TextAreaField
                label="Internal notes"
                name="internalNotes"
                rows={5}
                defaultValue={application.internalNotes ?? ""}
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
              >
                Save
              </button>
            </form>
          </Card>

          {hasRole(user, "ADMIN") && (
            <Card className="border-red-200">
              <CardTitle description="Removes the record and the stored PDF.">
                Delete
              </CardTitle>
              <ConfirmDeleteForm
                action={deleteApplicationAction}
                id={application.id}
                message="Delete this application and its résumé? This cannot be undone."
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete application
                </button>
              </ConfirmDeleteForm>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
