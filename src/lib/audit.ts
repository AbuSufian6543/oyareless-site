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
  | "collection.deleted";

/**
 * Append-only trail of privileged actions. Useful for a security company both
 * operationally and for demonstrating internal controls.
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
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");

    await prisma.auditLog.create({
      data: {
        action: input.action,
        userId: input.userId ?? null,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary,
        details: (input.details ?? undefined) as never,
        ipAddress:
          forwarded?.split(",")[0]?.trim() ||
          headerList.get("x-real-ip") ||
          undefined,
        userAgent: headerList.get("user-agent") ?? undefined,
      },
    });
  } catch {
    // Auditing must never break the operation it is recording.
  }
}
