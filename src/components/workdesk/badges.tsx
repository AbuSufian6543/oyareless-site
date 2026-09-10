import { Badge } from "@/components/admin/ui";
import {
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TICKET_STATUS_LABELS,
} from "@/lib/workdesk/labels";

const STATUS_TONE: Record<string, "info" | "success" | "warning" | "danger" | "neutral"> = {
  NEW: "info",
  OPEN: "info",
  IN_PROGRESS: "warning",
  WAITING: "neutral",
  RESOLVED: "success",
  COMPLETED: "success",
  CLOSED: "neutral",
};

const PRIORITY_TONE: Record<string, "info" | "success" | "warning" | "danger" | "neutral"> = {
  LOW: "neutral",
  NORMAL: "info",
  HIGH: "warning",
  EMERGENCY: "danger",
};

export function TicketStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? "neutral"}>
      {TICKET_STATUS_LABELS[status as keyof typeof TICKET_STATUS_LABELS] ?? status}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? "neutral"}>
      {TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge tone={PRIORITY_TONE[priority] ?? "neutral"}>
      {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] ?? priority}
    </Badge>
  );
}
