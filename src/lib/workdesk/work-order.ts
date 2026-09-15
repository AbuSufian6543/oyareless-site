import { CANONICAL_PUBLIC_HOST, CANONICAL_PUBLIC_ORIGIN } from "@/lib/public-url";
import { formatLoggedDuration } from "@/lib/workdesk/hours";
import { TIME_ENTRY_KIND_LABELS, TIME_ENTRY_KINDS } from "@/lib/workdesk/labels";

export type WorkOrderKind = "ticket" | "task";

export type WorkOrderCompany = {
  name: string;
  tagline: string;
  logoUrl: string;
  addressLines: string[];
  phone: string;
  localPhone: string;
  email: string;
  websiteHost: string;
  websiteUrl: string;
  hours: string;
  footerNote: string;
};

export type WorkOrderFact = {
  label: string;
  value: string;
};

export type WorkOrderTimeRow = {
  id: string;
  dateLabel: string;
  technician: string;
  kind: string;
  kindLabel: string;
  minutes: number;
  durationLabel: string;
  notes: string[];
};

export type WorkOrderKindTotal = {
  kind: string;
  kindLabel: string;
  minutes: number;
  durationLabel: string;
};

export type WorkOrderProductRow = {
  id: string;
  name: string;
  sku: string;
  quantityLabel: string;
  note: string;
  addedBy: string;
  addedOnLabel: string;
};

export type WorkOrderNote = {
  id: string;
  at: string;
  author: string;
  visibility: "internal" | "staff" | "customer";
  visibilityLabel: string;
  body: string;
  attachments: string[];
};

export type WorkOrderCustomer = {
  name: string;
  accountRef: string;
  phone: string;
  email: string;
  address: string;
  accountNotes: string;
};

export type WorkOrderDocumentModel = {
  kind: WorkOrderKind;
  kindLabel: string;
  reference: string;
  title: string;
  description: string;
  statusLabel: string;
  priorityLabel: string;
  facts: WorkOrderFact[];
  assigned: string[];
  customer: WorkOrderCustomer | null;
  timeEntries: WorkOrderTimeRow[];
  kindTotals: WorkOrderKindTotal[];
  totalMinutes: number;
  totalDurationLabel: string;
  products: WorkOrderProductRow[];
  notes: WorkOrderNote[];
  attachments: string[];
  printedAtLabel: string;
  printedByName: string;
  backHref: string;
  backLabel: string;
};

export function workOrderPath(kind: WorkOrderKind, id: string): string {
  const safe = String(id ?? "").trim();
  return kind === "task" ? `/work-orders/task/${safe}` : `/work-orders/ticket/${safe}`;
}

export function companyAddressLines(settings: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
}): string[] {
  const locality = [
    String(settings.city ?? "").trim(),
    [String(settings.province ?? "").trim(), String(settings.postalCode ?? "").trim()]
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  return [
    settings.addressLine1,
    settings.addressLine2,
    locality,
    settings.country,
  ]
    .map((line) => String(line ?? "").trim())
    .filter(Boolean);
}

/** Site / customer address stacked the way a tech reads it on a work order. */
export function formatSiteAddress(parts: {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
}): string {
  return companyAddressLines({ ...parts, country: "" }).join("\n");
}

export function publicCompanyWebsite(): { host: string; url: string } {
  return { host: CANONICAL_PUBLIC_HOST, url: CANONICAL_PUBLIC_ORIGIN };
}

export function sumMinutes(entries: { minutes: number }[]): number {
  return entries.reduce((sum, row) => sum + Math.max(0, Math.round(Number(row.minutes) || 0)), 0);
}

export function minutesByKind(entries: { kind: string; minutes: number }[]): WorkOrderKindTotal[] {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    const kind = String(entry.kind || "OTHER");
    totals.set(kind, (totals.get(kind) ?? 0) + Math.max(0, Math.round(Number(entry.minutes) || 0)));
  }
  const known = TIME_ENTRY_KINDS.filter((kind) => (totals.get(kind) ?? 0) > 0);
  const extras = [...totals.keys()].filter(
    (kind) => !(TIME_ENTRY_KINDS as readonly string[]).includes(kind) && (totals.get(kind) ?? 0) > 0,
  );
  return [...known, ...extras].map((kind) => {
    const minutes = totals.get(kind) ?? 0;
    return {
      kind,
      kindLabel: TIME_ENTRY_KIND_LABELS[kind] ?? kind,
      minutes,
      durationLabel: formatLoggedDuration(minutes),
    };
  });
}

/** Street, then city/province/postal and country on one line — compact for print. */
export function compactAddressLines(lines: string[]): string[] {
  const clean = lines.map((line) => line.trim()).filter(Boolean);
  if (clean.length <= 2) return clean;
  return [clean[0], clean.slice(1).join(" · ")];
}

const LEAD_FACT_LABELS = new Set(["Category", "Opened", "Opened by", "Created by"]);
const DATED_FACT_LABELS = [
  "Last updated",
  "Due",
  "First response",
  "Resolved",
  "Completed",
  "Closed",
] as const;

/** Flatten job facts into short readable lines instead of a labelled grid. */
export function jobRecordLines(facts: WorkOrderFact[]): string[] {
  const byLabel = new Map(facts.map((fact) => [fact.label, fact.value]));
  const lines: string[] = [];
  const category = byLabel.get("Category");
  const opened = byLabel.get("Opened");
  const openedBy = byLabel.get("Opened by") || byLabel.get("Created by");
  const lead: string[] = [];
  if (category) lead.push(category);
  if (opened && openedBy) lead.push(`opened ${opened} by ${openedBy}`);
  else if (opened) lead.push(`opened ${opened}`);
  else if (openedBy) lead.push(`opened by ${openedBy}`);
  if (lead.length > 0) lines.push(lead.join(" · "));

  for (const label of DATED_FACT_LABELS) {
    const value = byLabel.get(label);
    if (value) lines.push(`${label} ${value}`);
  }
  for (const fact of facts) {
    if (LEAD_FACT_LABELS.has(fact.label)) continue;
    if ((DATED_FACT_LABELS as readonly string[]).includes(fact.label)) continue;
    lines.push(`${fact.label} ${fact.value}`);
  }
  return lines;
}

/**
 * Ticket work orders use the first customer/staff message as the description.
 * Skip repeating that same body in Job notes; keep later notes and any files
 * attached to the opening message.
 */
export function notesForPrint(
  document: Pick<WorkOrderDocumentModel, "kind" | "description" | "notes">,
): WorkOrderNote[] {
  if (document.kind !== "ticket" || !document.description) return document.notes;
  const openingIndex = document.notes.findIndex(
    (note) => note.visibility !== "internal" && note.body === document.description,
  );
  if (openingIndex < 0) return document.notes;
  return document.notes.flatMap((note, index) => {
    if (index !== openingIndex) return [note];
    if (note.attachments.length > 0) return [{ ...note, body: "" }];
    return [];
  });
}

export function ticketNoteMeta(message: {
  isInternal: boolean;
  authorStaffName?: string | null;
  authorCustomerUser?: { name: string } | null;
}): Pick<WorkOrderNote, "author" | "visibility" | "visibilityLabel"> {
  if (message.isInternal) {
    return {
      author: message.authorStaffName?.trim() || "Staff",
      visibility: "internal",
      visibilityLabel: "Internal",
    };
  }
  if (message.authorStaffName?.trim()) {
    return {
      author: message.authorStaffName.trim(),
      visibility: "staff",
      visibilityLabel: "Staff",
    };
  }
  return {
    author: message.authorCustomerUser?.name?.trim() || "Customer",
    visibility: "customer",
    visibilityLabel: "Customer",
  };
}
