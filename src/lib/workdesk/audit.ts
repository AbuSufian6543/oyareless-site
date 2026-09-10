import "server-only";

import { recordAudit, type AuditAction } from "@/lib/audit";

export type TicketAuditAction = Extract<AuditAction, `ticket.${string}`>;
export type TaskAuditAction = Extract<AuditAction, `task.${string}`>;

type TicketActor =
  | { kind: "staff"; id: string; name: string; email?: string }
  | { kind: "customer"; id: string; name: string; email?: string };

/**
 * Ticket create / change / delete. Writes the unified AuditLog (with IP).
 * Never stores message bodies. Survives ticket delete because AuditLog has
 * no foreign key to Ticket.
 */
export async function recordTicketAudit(input: {
  action: TicketAuditAction;
  ticketId: string;
  ticketReference: string;
  summary: string;
  actor: TicketActor;
  details?: Record<string, unknown>;
}): Promise<void> {
  await recordAudit({
    action: input.action,
    userId: input.actor.kind === "staff" ? input.actor.id : null,
    entityType: "Ticket",
    entityId: input.ticketId,
    summary: input.summary,
    details: {
      ...input.details,
      actorKind: input.actor.kind,
      actorName: input.actor.name.slice(0, 120),
      actorEmail: input.actor.email,
      actorCustomerUserId: input.actor.kind === "customer" ? input.actor.id : undefined,
      reference: input.ticketReference.slice(0, 40),
    },
  });
}

/**
 * Task create / change / delete. Same unified AuditLog as tickets and CMS.
 * Written before task delete so the trail is not lost with WorkdeskEvent rows.
 */
export async function recordTaskAudit(input: {
  action: TaskAuditAction;
  taskId: string;
  taskReference: string;
  summary: string;
  actor: { id: string; name: string; email?: string };
  details?: Record<string, unknown>;
}): Promise<void> {
  await recordAudit({
    action: input.action,
    userId: input.actor.id,
    entityType: "InternalTask",
    entityId: input.taskId,
    summary: input.summary,
    details: {
      ...input.details,
      actorKind: "staff",
      actorName: input.actor.name.slice(0, 120),
      actorEmail: input.actor.email,
      reference: input.taskReference.slice(0, 40),
    },
  });
}
