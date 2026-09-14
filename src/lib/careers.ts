/**
 * Career applications: statuses, PDF cap, and labels used by admin + mail.
 * Safe for client components.
 */

export const RESUME_MAX_BYTES = 3 * 1024 * 1024;
export const RESUME_MAX_MB = 3;

export const JOB_APPLICATION_STATUSES = [
  { value: "NEW", label: "New" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "DECLINED", label: "Declined" },
  { value: "HIRED", label: "Hired" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export type JobApplicationStatusValue =
  (typeof JOB_APPLICATION_STATUSES)[number]["value"];

export function jobApplicationStatusLabel(status: string): string {
  return (
    JOB_APPLICATION_STATUSES.find((item) => item.value === status)?.label ??
    status
  );
}

export function jobApplicationStatusTone(
  status: string,
): "warning" | "info" | "success" | "neutral" | "danger" {
  if (status === "NEW") return "warning";
  if (status === "REVIEWING" || status === "SHORTLISTED") return "info";
  if (status === "HIRED") return "success";
  if (status === "DECLINED") return "danger";
  return "neutral";
}

export const GENERAL_APPLICATION_TITLE = "General application";
