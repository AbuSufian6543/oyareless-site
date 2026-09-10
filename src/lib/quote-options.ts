import type { QuoteStatus } from "@/generated/prisma/client";

/** Same options the public quote form offers. */
export const QUOTE_SERVICE_AREAS = [
  "IT services",
  "Cybersecurity",
  "Firewalls",
  "AI cameras & phones",
  "Networking / Wi-Fi",
  "VoIP telephone",
  "Video surveillance",
  "Alarm systems",
  "Door intercom",
  "Panic buttons",
  "Access control",
  "Cabling / fiber",
  "Two-way radio",
  "EV charging",
  "Web development",
  "Other",
] as const;

export const QUOTE_STATUS_VALUES = [
  "NEW",
  "REVIEWING",
  "QUOTED",
  "WON",
  "LOST",
  "CANCELLED",
] as const satisfies readonly QuoteStatus[];

export const QUOTE_STATUSES: Array<{
  value: (typeof QUOTE_STATUS_VALUES)[number];
  label: string;
}> = [
  { value: "NEW", label: "New" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "QUOTED", label: "Quoted" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function quoteStatusLabel(status: string): string {
  return (
    QUOTE_STATUSES.find((item) => item.value === status)?.label ??
    status.charAt(0) + status.slice(1).toLowerCase()
  );
}

export function quoteStatusTone(
  status: string,
): "warning" | "info" | "navy" | "success" | "danger" | "neutral" {
  if (status === "NEW") return "warning";
  if (status === "REVIEWING") return "info";
  if (status === "QUOTED") return "navy";
  if (status === "WON") return "success";
  if (status === "LOST") return "danger";
  return "neutral";
}

const RESPONDED: QuoteStatus[] = ["QUOTED", "WON", "LOST", "CANCELLED"];

export function quoteRespondedAt(
  status: QuoteStatus,
  previous: Date | null,
): Date | null {
  if (RESPONDED.includes(status)) return previous ?? new Date();
  return previous;
}

export function parseQuoteServiceAreas(formData: FormData): string[] {
  const unique = new Set<string>();
  for (const raw of [
    ...formData.getAll("serviceAreas"),
    ...formData.getAll("extraServiceAreas"),
  ]) {
    const area = String(raw).trim().slice(0, 80);
    if (area) unique.add(area);
  }
  return [...unique].slice(0, 20);
}

export function serviceAreaFieldId(area: string): string {
  return `service-area-${area.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}
