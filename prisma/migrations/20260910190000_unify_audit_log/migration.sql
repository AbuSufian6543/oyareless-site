-- Fold the separate ticket audit table into AuditLog so CMS, tickets, and
-- tasks share one append-only trail. Copy IP and user-agent. AuditLog has no
-- foreign key to Ticket or InternalTask, so deleting work still keeps the row.

INSERT INTO "AuditLog" (
  "id",
  "action",
  "entityType",
  "entityId",
  "summary",
  "details",
  "ipAddress",
  "userAgent",
  "createdAt",
  "userId"
)
SELECT
  t."id",
  t."action",
  'Ticket',
  t."ticketId",
  t."summary",
  jsonb_strip_nulls(
    CASE
      WHEN t."details" IS NULL THEN '{}'::jsonb
      WHEN jsonb_typeof(t."details") = 'object' THEN t."details"
      ELSE jsonb_build_object('legacy', t."details")
    END || jsonb_build_object(
      'actorKind', t."actorKind",
      'actorName', t."actorName",
      'reference', t."ticketReference",
      'actorCustomerUserId', t."actorCustomerUserId"
    )
  ),
  t."ipAddress",
  t."userAgent",
  t."createdAt",
  t."actorUserId"
FROM "TicketAuditLog" t
WHERE NOT EXISTS (
  SELECT 1 FROM "AuditLog" existing WHERE existing."id" = t."id"
);

DROP TABLE "TicketAuditLog";

CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
