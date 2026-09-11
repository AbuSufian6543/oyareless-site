import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "user.login"
  | "user.login_failed"
  | "user.logout"
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "user.password_changed"
  | "user.password_reset_requested"
  | "user.password_reset_completed"
  | "user.2fa_enabled"
  | "user.2fa_disabled"
  | "page.created"
  | "page.updated"
  | "page.deleted"
  | "page.published"
  | "page.restored"
  | "post.created"
  | "post.updated"
  | "post.deleted"
  | "stream.created"
  | "stream.updated"
  | "stream.deleted"
  | "job.created"
  | "job.updated"
  | "job.deleted"
  | "media.uploaded"
  | "media.replaced"
  | "media.deleted"
  | "settings.updated"
  | "settings.smtp_tested"
  | "nav.updated"
  | "redirect.updated"
  | "submission.updated"
  | "testimonial.updated"
  | "collection.created"
  | "collection.updated"
  | "collection.deleted"
  | "quote.created"
  | "quote.updated"
  | "quote.deleted"
  | "ticket.created"
  | "ticket.replied"
  | "ticket.noted"
  | "ticket.status_changed"
  | "ticket.priority_changed"
  | "ticket.assigned"
  | "ticket.updated"
  | "ticket.access_granted"
  | "ticket.access_revoked"
  | "ticket.notified"
  | "ticket.deleted"
  | "task.created"
  | "task.updated"
  | "task.noted"
  | "task.status_changed"
  | "task.priority_changed"
  | "task.due_changed"
  | "task.assigned"
  | "task.notified"
  | "task.deleted";

const ACTION_LABELS: Record<string, string> = {
  "user.login": "Signed in",
  "user.login_failed": "Sign-in failed",
  "user.logout": "Signed out",
  "ticket.created": "Ticket created",
  "ticket.replied": "Ticket reply",
  "ticket.noted": "Ticket note",
  "ticket.status_changed": "Ticket status",
  "ticket.priority_changed": "Ticket priority",
  "ticket.assigned": "Ticket assignment",
  "ticket.updated": "Ticket details",
  "ticket.access_granted": "Ticket access granted",
  "ticket.access_revoked": "Ticket access revoked",
  "ticket.notified": "Ticket notification",
  "ticket.deleted": "Ticket deleted",
  "task.created": "Task created",
  "task.updated": "Task details",
  "task.noted": "Task note",
  "task.status_changed": "Task status",
  "task.priority_changed": "Task priority",
  "task.due_changed": "Task due date",
  "task.assigned": "Task assignment",
  "task.notified": "Task notification",
  "task.deleted": "Task deleted",
};

const BLOCKED_DETAIL_KEYS = new Set([
  "body",
  "message",
  "password",
  "token",
  "secret",
  "recoveryCodes",
]);

export function auditActionLabel(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const [area, ...rest] = action.split(".");
  const event = rest.join(" ").replaceAll("_", " ");
  if (!area || !event) return action;
  return `${area.charAt(0).toUpperCase()}${area.slice(1)} ${event}`;
}

export type AuditMeta = {
  actorKind?: string;
  actorName?: string;
  actorEmail?: string;
  reference?: string;
};

export function readAuditMeta(details: unknown): AuditMeta {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }
  const data = details as Record<string, unknown>;
  return {
    actorKind: typeof data.actorKind === "string" ? data.actorKind : undefined,
    actorName: typeof data.actorName === "string" ? data.actorName : undefined,
    actorEmail: typeof data.actorEmail === "string" ? data.actorEmail : undefined,
    reference: typeof data.reference === "string" ? data.reference : undefined,
  };
}

function sanitizeDetails(
  details?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!details) return undefined;
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(details)) {
    if (BLOCKED_DETAIL_KEYS.has(key) || value === undefined) continue;
    clean[key] = value;
  }
  return Object.keys(clean).length > 0 ? clean : undefined;
}

/** Request IP and user-agent. Missing headers still allow the row to be written. */
export async function requestAuditTrace(): Promise<{
  ipAddress?: string;
  userAgent?: string;
}> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || undefined;
    return {
      ipAddress: ip ? ip.slice(0, 80) : undefined,
      userAgent: headerList.get("user-agent")?.slice(0, 300) || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Append-only trail of privileged actions. Useful for a security company both
 * operationally and for demonstrating internal controls. Every row stores the
 * caller IP when the request headers are available.
 */
export async function recordAudit(input: {
  action: AuditAction;
  userId?: string | null;
  entityType?: string;
  entityId?: string;
  summary?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  try {
    const trace = await requestAuditTrace();

    await prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary?.slice(0, 500),
        details: sanitizeDetails(input.details) as never,
        ipAddress: trace.ipAddress,
        userAgent: trace.userAgent,
      },
    });
  } catch {
    // Auditing must never break the operation it is recording.
  }
}
