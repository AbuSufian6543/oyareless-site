export const TICKET_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING: "Waiting",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING: "Waiting",
  COMPLETED: "Completed",
  CLOSED: "Closed",
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  EMERGENCY: "Emergency",
};

export const TICKET_CATEGORIES = [
  "General",
  "Internet",
  "Phone",
  "Radio",
  "Security",
  "Billing",
  "On-site",
] as const;

export const TIME_ENTRY_KIND_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  ONSITE: "On-site",
  TRAVEL: "Travel",
  BENCH: "Bench / shop",
  OTHER: "Other",
};

export const TIME_ENTRY_KINDS = [
  "REMOTE",
  "ONSITE",
  "TRAVEL",
  "BENCH",
  "OTHER",
] as const;

export const WORK_PRODUCT_CATEGORIES = [
  "General",
  "Cabling",
  "Internet",
  "Phone",
  "Radio",
  "Security",
] as const;

export const WORK_PRODUCT_UNITS = ["each", "m", "pack", "box", "roll"] as const;
