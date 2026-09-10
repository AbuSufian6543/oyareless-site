-- Separate append-only audit trail for ticket CRUD. No Ticket foreign key, so
-- deleting a ticket cannot wipe the record of who created, changed, or removed it.

CREATE TABLE "TicketAuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "ticketId" TEXT,
  "ticketReference" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "details" JSONB,
  "actorKind" TEXT NOT NULL,
  "actorName" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actorUserId" TEXT,
  "actorCustomerUserId" TEXT,

  CONSTRAINT "TicketAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TicketAuditLog_createdAt_idx" ON "TicketAuditLog"("createdAt");
CREATE INDEX "TicketAuditLog_ticketId_createdAt_idx" ON "TicketAuditLog"("ticketId", "createdAt");
CREATE INDEX "TicketAuditLog_ticketReference_createdAt_idx" ON "TicketAuditLog"("ticketReference", "createdAt");
CREATE INDEX "TicketAuditLog_action_createdAt_idx" ON "TicketAuditLog"("action", "createdAt");

ALTER TABLE "TicketAuditLog"
  ADD CONSTRAINT "TicketAuditLog_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TicketAuditLog"
  ADD CONSTRAINT "TicketAuditLog_actorCustomerUserId_fkey"
  FOREIGN KEY ("actorCustomerUserId") REFERENCES "CustomerUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
