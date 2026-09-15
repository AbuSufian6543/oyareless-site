import { notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";

import {
  createTaskFromSubmissionAction,
  updateSubmissionAction,
} from "@/app/admin/submissions/actions";
import {
  Alert,
  Badge,
  Card,
  CardTitle,
  PageHeader,
  SelectField,
  TextAreaField,
} from "@/components/admin/ui";
import { AssigneeChecklist } from "@/components/workdesk/assignee-checklist";
import { requireStaffAccess } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { canAccessEnquiries } from "@/lib/staff-access";
import { formatDateTime, telHref } from "@/lib/utils";
import { findEnquiryTask } from "@/lib/workdesk/enquiry-task";
import { listAssignableStaff } from "@/lib/workdesk/staff";

export const metadata = { title: "Message" };

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  await requireStaffAccess(canAccessEnquiries);
  const { id } = await params;
  const query = await searchParams;

  const [submission, staff, linkedTask] = await Promise.all([
    prisma.formSubmission.findUnique({
      where: { id },
      include: { assignedTo: { select: { id: true, name: true } } },
    }),
    listAssignableStaff(),
    findEnquiryTask("submission", id),
  ]);

  if (!submission) notFound();

  // Anything the form collected beyond the core fields.
  const extras = Object.entries(
    (submission.payload ?? {}) as Record<string, unknown>,
  ).filter(([, value]) => value !== null && value !== "");

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={submission.subject || `Message from ${submission.name}`}
        description={formatDateTime(submission.createdAt)}
        breadcrumb={{ href: "/admin/submissions", label: "Inbox" }}
      />

      {query.saved && (
        <div className="mb-5">
          <Alert tone="success">The message was updated.</Alert>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-5">
          <Card>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge tone="info">{submission.type.toLowerCase()}</Badge>
              <Badge
                tone={
                  submission.status === "NEW"
                    ? "warning"
                    : submission.status === "RESOLVED"
                      ? "success"
                      : "neutral"
                }
              >
                {submission.status.replace("_", " ").toLowerCase()}
              </Badge>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {submission.message}
            </p>
          </Card>

          {extras.length > 0 && (
            <Card>
              <CardTitle>Additional fields</CardTitle>
              <dl className="grid gap-3 sm:grid-cols-2">
                {extras.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {key.replace(/([A-Z])/g, " $1")}
                    </dt>
                    <dd className="mt-0.5 text-sm text-navy-800">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}

          <Card>
            <CardTitle description="Work is assigned through Tasks so managers and employees can be included — not only editors and admins.">
              Task
            </CardTitle>
            {linkedTask ? (
              <p className="text-sm text-slate-700">
                Opened as{" "}
                <Link
                  href={`/admin/tasks/${linkedTask.id}`}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  {linkedTask.reference}
                </Link>
                {linkedTask.assignees.length > 0
                  ? ` · assigned to ${linkedTask.assignees.map((row) => row.user.name).join(", ")}`
                  : " · unassigned"}
                . Reassign from the task.
              </p>
            ) : (
              <form action={createTaskFromSubmissionAction} className="space-y-4">
                <input type="hidden" name="id" value={submission.id} />
                <AssigneeChecklist staff={staff} legend="Assign staff" />
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Create task and email assigned staff
                </button>
              </form>
            )}
          </Card>

          <Card>
            <CardTitle description="Only visible to staff.">
              Triage
            </CardTitle>

            <form action={updateSubmissionAction} className="space-y-4">
              <input type="hidden" name="id" value={submission.id} />

              <SelectField
                label="Status"
                name="status"
                defaultValue={submission.status}
                options={[
                  { value: "NEW", label: "New" },
                  { value: "IN_PROGRESS", label: "In progress" },
                  { value: "RESOLVED", label: "Resolved" },
                  { value: "ARCHIVED", label: "Archived" },
                  { value: "SPAM", label: "Spam" },
                ]}
              />

              <TextAreaField
                label="Internal notes"
                name="internalNotes"
                rows={4}
                defaultValue={submission.internalNotes ?? ""}
              />

              <button
                type="submit"
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Save
              </button>
            </form>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardTitle>Sender</CardTitle>
            <p className="font-semibold text-navy-900">{submission.name}</p>
            {submission.company && (
              <p className="text-sm text-slate-600">{submission.company}</p>
            )}

            <div className="mt-4 space-y-2 text-sm">
              <a
                href={`mailto:${submission.email}?subject=${encodeURIComponent(
                  `Re: ${submission.subject || "Your inquiry"}`,
                )}`}
                className="flex items-center gap-2 font-medium text-brand-700 hover:underline"
              >
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span className="break-all">{submission.email}</span>
              </a>
              {submission.phone && (
                <a
                  href={telHref(submission.phone)}
                  className="flex items-center gap-2 font-medium text-brand-700 hover:underline"
                >
                  <Phone className="size-4 shrink-0" aria-hidden="true" />
                  {submission.phone}
                </a>
              )}
            </div>
          </Card>

          <Card>
            <CardTitle>Delivery</CardTitle>
            <dl className="space-y-2.5 text-xs">
              <div>
                <dt className="font-semibold uppercase tracking-wide text-slate-500">
                  Email notification
                </dt>
                <dd className="mt-0.5 text-slate-700">
                  {submission.emailSentAt
                    ? formatDateTime(submission.emailSentAt)
                    : "Not sent — check SMTP settings"}
                </dd>
              </div>
              {submission.sourcePage && (
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-slate-500">
                    Submitted from
                  </dt>
                  <dd className="mt-0.5 break-all text-slate-700">
                    {submission.sourcePage}
                  </dd>
                </div>
              )}
              {submission.ipAddress && (
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-slate-500">
                    IP address
                  </dt>
                  <dd className="mt-0.5 font-mono text-slate-700">
                    {submission.ipAddress}
                  </dd>
                </div>
              )}
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
