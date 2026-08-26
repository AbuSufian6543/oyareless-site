import Link from "next/link";
import { Download, Inbox } from "lucide-react";

import { bulkSubmissionAction } from "@/app/admin/submissions/actions";
import {
  Alert,
  Badge,
  Card,
  EmptyState,
  PageHeader,
} from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { cn, formatDateTime, truncate } from "@/lib/utils";

export const metadata = { title: "Inbox" };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "NEW", label: "New" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "SPAM", label: "Spam" },
] as const;

const TYPE_TONES: Record<string, "info" | "warning" | "success" | "navy"> = {
  CONTACT: "info",
  SUPPORT: "warning",
  QUOTE: "success",
  CALLBACK: "navy",
  APPLICATION: "navy",
  OTHER: "info",
};

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; updated?: string }>;
}) {
  const params = await searchParams;
  const filter = params.status ?? "NEW";

  const [submissions, counts] = await Promise.all([
    prisma.formSubmission.findMany({
      where: filter === "all" ? {} : { status: filter as never },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { assignedTo: { select: { name: true } } },
    }),
    prisma.formSubmission.groupBy({ by: ["status"], _count: true }),
  ]);

  const countFor = (status: string) =>
    status === "all"
      ? counts.reduce((total, row) => total + row._count, 0)
      : (counts.find((row) => row.status === status)?._count ?? 0);

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="Every contact, support, quote and application form received by the site."
        actions={
          <a
            href="/api/admin/submissions/export"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:bg-slate-50"
          >
            <Download className="size-4" aria-hidden="true" />
            Export CSV
          </a>
        }
      />

      {params.updated && (
        <div className="mb-5">
          <Alert tone="success">The selected messages were updated.</Alert>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((item) => (
          <Link
            key={item.value}
            href={`/admin/submissions?status=${item.value}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              filter === item.value
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {item.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-[0.6875rem]",
                filter === item.value
                  ? "bg-white/20"
                  : "bg-white text-slate-500",
              )}
            >
              {countFor(item.value)}
            </span>
          </Link>
        ))}
      </div>

      {submissions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox className="size-8" aria-hidden="true" />}
            title="Nothing here"
            description={
              filter === "NEW"
                ? "No new messages. Anything submitted through the site lands here."
                : "No messages match this filter."
            }
          />
        </Card>
      ) : (
        <form action={bulkSubmissionAction}>
          <Card padded={false}>
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold text-slate-600">
                Select messages, then:
              </p>
              <select
                name="status"
                defaultValue="RESOLVED"
                aria-label="New status"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-navy-800"
              >
                <option value="IN_PROGRESS">Mark in progress</option>
                <option value="RESOLVED">Mark resolved</option>
                <option value="ARCHIVED">Archive</option>
                <option value="SPAM">Mark as spam</option>
              </select>
              <button
                type="submit"
                className="rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-900"
              >
                Apply
              </button>
            </div>

            <ul className="divide-y divide-slate-100">
              {submissions.map((submission) => (
                <li
                  key={submission.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/70",
                    submission.status === "NEW" && "bg-brand-50/30",
                  )}
                >
                  <input
                    type="checkbox"
                    name="ids"
                    value={submission.id}
                    aria-label={`Select message from ${submission.name}`}
                    className="mt-1 size-4 shrink-0 rounded border-slate-300 text-brand-600"
                  />

                  <Link
                    href={`/admin/submissions/${submission.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "text-sm text-navy-900",
                          submission.status === "NEW"
                            ? "font-bold"
                            : "font-semibold",
                        )}
                      >
                        {submission.name}
                      </span>
                      <Badge tone={TYPE_TONES[submission.type] ?? "info"}>
                        {submission.type.toLowerCase()}
                      </Badge>
                      {submission.status !== "NEW" && (
                        <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-slate-400">
                          {submission.status.replace("_", " ")}
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {submission.email}
                      {submission.company ? ` · ${submission.company}` : ""}
                      {submission.assignedTo?.name
                        ? ` · assigned to ${submission.assignedTo.name}`
                        : ""}
                    </p>

                    <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                      {submission.subject && (
                        <span className="font-semibold text-navy-700">
                          {submission.subject}:{" "}
                        </span>
                      )}
                      {truncate(submission.message, 160)}
                    </p>
                  </Link>

                  <time
                    dateTime={submission.createdAt.toISOString()}
                    className="shrink-0 text-xs text-slate-400"
                  >
                    {formatDateTime(submission.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          </Card>
        </form>
      )}
    </div>
  );
}
