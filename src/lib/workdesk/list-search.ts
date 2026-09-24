import type { Prisma } from "@/generated/prisma/client";

/**
 * A WT or WC number uses the unique reference index.
 * Anything else matches a name on the title, subject, customer, or assignee.
 * Notes and message bodies are left out so the query stays small.
 */

const MAX_QUERY = 80;

export function cleanWorkQuery(raw: string | undefined): string {
  return (raw ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_QUERY);
}

function referenceClause(
  text: string,
  prefix: "WT" | "WC",
): { reference: Prisma.StringFilter } | { OR: Array<{ reference: Prisma.StringFilter }> } | null {
  const compact = text.toUpperCase().replace(/[\s_]+/g, "");
  const other = prefix === "WT" ? "WC" : "WT";
  if (compact.startsWith(other)) return null;

  const match = compact.match(new RegExp(`^(?:${prefix}-?)?(\\d{1,6})$`));
  if (!match) return null;

  const digits = match[1].replace(/^0+(?=\d)/, "");
  const exact = `${prefix}-${digits.padStart(4, "0")}`;
  if (digits.length >= 4) return { reference: { equals: exact } };

  return {
    OR: [
      { reference: { equals: exact } },
      { reference: { startsWith: `${prefix}-${digits}` } },
    ],
  };
}

export function taskSearchWhere(raw: string | undefined): Prisma.InternalTaskWhereInput | null {
  const text = cleanWorkQuery(raw);
  if (!text) return null;

  const reference = referenceClause(text, "WT");
  if (reference) return reference;

  return {
    OR: [
      { title: { contains: text, mode: "insensitive" } },
      { assignees: { some: { user: { name: { contains: text, mode: "insensitive" } } } } },
    ],
  };
}

export function ticketSearchWhere(raw: string | undefined): Prisma.TicketWhereInput | null {
  const text = cleanWorkQuery(raw);
  if (!text) return null;

  const reference = referenceClause(text, "WC");
  if (reference) return reference;

  return {
    OR: [
      { subject: { contains: text, mode: "insensitive" } },
      { customer: { name: { contains: text, mode: "insensitive" } } },
      { assignedTo: { name: { contains: text, mode: "insensitive" } } },
      { assignees: { some: { user: { name: { contains: text, mode: "insensitive" } } } } },
    ],
  };
}
