-- Multiple technicians can be assigned to one customer ticket.
-- Backfill from the existing primary assignee and extra access grants.

CREATE TABLE "TicketAssignee" (
  "ticketId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TicketAssignee_pkey" PRIMARY KEY ("ticketId", "userId")
);

CREATE INDEX "TicketAssignee_userId_ticketId_idx" ON "TicketAssignee"("userId", "ticketId");

ALTER TABLE "TicketAssignee"
  ADD CONSTRAINT "TicketAssignee_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketAssignee"
  ADD CONSTRAINT "TicketAssignee_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "TicketAssignee" ("ticketId", "userId", "createdAt")
SELECT "id", "assignedToId", CURRENT_TIMESTAMP
FROM "Ticket"
WHERE "assignedToId" IS NOT NULL
ON CONFLICT ("ticketId", "userId") DO NOTHING;

INSERT INTO "TicketAssignee" ("ticketId", "userId", "createdAt")
SELECT "ticketId", "userId", "createdAt"
FROM "TicketAccessGrant"
ON CONFLICT ("ticketId", "userId") DO NOTHING;
