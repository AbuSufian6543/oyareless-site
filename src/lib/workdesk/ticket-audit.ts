import "server-only";

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

export type TicketAuditAction =
  | "ticket.created"
  | "ticket.replied"
  | "ticket.noted"
  | "ticket.status_changed"
  | "ticket.priority_changed"
  | "ticket.assigned"
  | "ticket.updated"
  | "ticket.access_granted"
  | "ticket.access_revoked"
  | "ticket.deleted";

export const TICKET_AUDIT_LABELS: Record<TicketAuditAction, string> = {
  "ticket.created": "Created",
  "ticket.replied": "Reply",
  "ticket.noted": "Internal note",
  "ticket.status_changed": "Status",
  "ticket.priority_changed": "Priority",
  "ticket.assigned": "Assignment",
  "ticket.updated": "Details",
  "ticket.access_granted": "Access granted",
  "ticket.access_revoked": "Access revoked",
  "ticket.deleted": "Deleted",
};

type TicketActor =
  | { kind: "staff"; id: string; name: string }
  | { kind: "customer"; id: string; name: string };

/**
 * Writes one row to the dedicated ticket audit log. Never throws, never
 * stores message bodies, and does not touch the CMS AuditLog.
 */
export async function recordTicketAudit(input: {
  action: TicketAuditAction;
  ticketId: string;
  ticketReference: string;
  summary: string;
  actor: TicketActor;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");

    await prisma.ticketAuditLog.create({
      data: {
        action: input.action,
        ticketId: input.ticketId,
        ticketReference: input.ticketReference.slice(0, 40),
        summary: input.summary.slice(0, 500),
        details: (input.details ?? undefined) as never,
        actorKind: input.actor.kind,
        actorName: input.actor.name.slice(0, 120),
        actorUserId: input.actor.kind === "staff" ? input.actor.id : undefined,
        actorCustomerUserId:
          input.actor.kind === "customer" ? input.actor.id : undefined,
        ipAddress:
          forwarded?.split(",")[0]?.trim() ||
          headerList.get("x-real-ip") ||
          undefined,
        userAgent: headerList.get("user-agent")?.slice(0, 300) || undefined,
      },
    });
  } catch {
    // Auditing must never break the ticket operation it is recording.
  }
}

export function ticketAuditLabel(action: string): string {
  return TICKET_AUDIT_LABELS[action as TicketAuditAction] ?? action;
}
