import type { Prisma } from "@/generated/prisma/client";

import {
  JOB_APPLICATION_STATUSES,
  type JobApplicationStatusValue,
} from "@/lib/careers";

const STATUSES = new Set<string>(JOB_APPLICATION_STATUSES.map((item) => item.value));

/**
 * The applications list and "delete all" must use the same filter.
 * A missing status means the New tab. "all" means every status.
 */
export function applicationListWhere(
  status: string | undefined,
  q: string | undefined,
): {
  filter: string;
  query: string;
  where: Prisma.JobApplicationWhereInput;
} {
  const filter = (status ?? "NEW").trim() || "NEW";
  const query = (q ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  const statusFilter: JobApplicationStatusValue | undefined =
    filter !== "all" && STATUSES.has(filter)
      ? (filter as JobApplicationStatusValue)
      : undefined;

  return {
    filter: statusFilter ?? (filter === "all" ? "all" : filter),
    query,
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { jobTitle: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
  };
}

export function applicationListPath(filter: string, query: string): string {
  const search = new URLSearchParams();
  if (filter !== "NEW") search.set("status", filter);
  if (query) search.set("q", query);
  const qs = search.toString();
  return qs ? `/admin/applications?${qs}` : "/admin/applications";
}
