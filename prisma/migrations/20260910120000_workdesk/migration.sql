-- Additive workdesk: technician role, internal tasks, extra ticket access,
-- activity history, and in-site notifications. Existing ticket rows are unchanged.

ALTER TYPE "Role" ADD VALUE 'TECHNICIAN';

CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CLOSED');

CREATE TYPE "WorkdeskEventKind" AS ENUM (
  'CREATED',
  'ASSIGNED',
  'REASSIGNED',
  'STATUS_CHANGED',
  'PRIORITY_CHANGED',
  'DUE_DATE_CHANGED',
  'MESSAGE',
  'NOTE',
  'ATTACHMENT',
  'COMPLETED',
  'CLOSED',
  'REOPENED',
  'GRANT_ADDED',
  'GRANT_REMOVED'
);

CREATE TYPE "WorkdeskNotificationKind" AS ENUM ('ASSIGNMENT', 'UPDATE', 'RESOLVED', 'MESSAGE');

CREATE TABLE "TicketAccessGrant" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "grantedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TicketAccessGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TicketAccessGrant_ticketId_userId_key" ON "TicketAccessGrant"("ticketId", "userId");
CREATE INDEX "TicketAccessGrant_userId_idx" ON "TicketAccessGrant"("userId");

ALTER TABLE "TicketAccessGrant"
  ADD CONSTRAINT "TicketAccessGrant_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TicketAccessGrant"
  ADD CONSTRAINT "TicketAccessGrant_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InternalTask" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
  "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
  "dueAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InternalTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InternalTask_reference_key" ON "InternalTask"("reference");
CREATE INDEX "InternalTask_status_priority_dueAt_idx" ON "InternalTask"("status", "priority", "dueAt");
CREATE INDEX "InternalTask_createdById_status_idx" ON "InternalTask"("createdById", "status");

ALTER TABLE "InternalTask"
  ADD CONSTRAINT "InternalTask_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "InternalTaskAssignee" (
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InternalTaskAssignee_pkey" PRIMARY KEY ("taskId", "userId")
);

CREATE INDEX "InternalTaskAssignee_userId_taskId_idx" ON "InternalTaskAssignee"("userId", "taskId");

ALTER TABLE "InternalTaskAssignee"
  ADD CONSTRAINT "InternalTaskAssignee_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalTaskAssignee"
  ADD CONSTRAINT "InternalTaskAssignee_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "InternalTaskNote" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "authorStaffId" TEXT NOT NULL,
  "authorName" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InternalTaskNote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternalTaskNote_taskId_createdAt_idx" ON "InternalTaskNote"("taskId", "createdAt");

ALTER TABLE "InternalTaskNote"
  ADD CONSTRAINT "InternalTaskNote_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalTaskNote"
  ADD CONSTRAINT "InternalTaskNote_authorStaffId_fkey"
  FOREIGN KEY ("authorStaffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "InternalTaskAttachment" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "noteId" TEXT,
  "uploadedById" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InternalTaskAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InternalTaskAttachment_taskId_idx" ON "InternalTaskAttachment"("taskId");
CREATE INDEX "InternalTaskAttachment_noteId_idx" ON "InternalTaskAttachment"("noteId");

ALTER TABLE "InternalTaskAttachment"
  ADD CONSTRAINT "InternalTaskAttachment_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InternalTaskAttachment"
  ADD CONSTRAINT "InternalTaskAttachment_noteId_fkey"
  FOREIGN KEY ("noteId") REFERENCES "InternalTaskNote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InternalTaskAttachment"
  ADD CONSTRAINT "InternalTaskAttachment_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "WorkdeskEvent" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT,
  "taskId" TEXT,
  "kind" "WorkdeskEventKind" NOT NULL,
  "summary" TEXT NOT NULL,
  "meta" JSONB,
  "actorStaffId" TEXT,
  "actorCustomerUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkdeskEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkdeskEvent_ticketId_createdAt_idx" ON "WorkdeskEvent"("ticketId", "createdAt");
CREATE INDEX "WorkdeskEvent_taskId_createdAt_idx" ON "WorkdeskEvent"("taskId", "createdAt");

ALTER TABLE "WorkdeskEvent"
  ADD CONSTRAINT "WorkdeskEvent_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkdeskEvent"
  ADD CONSTRAINT "WorkdeskEvent_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkdeskEvent"
  ADD CONSTRAINT "WorkdeskEvent_actorStaffId_fkey"
  FOREIGN KEY ("actorStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkdeskEvent"
  ADD CONSTRAINT "WorkdeskEvent_actorCustomerUserId_fkey"
  FOREIGN KEY ("actorCustomerUserId") REFERENCES "CustomerUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "WorkdeskNotification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kind" "WorkdeskNotificationKind" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "ticketId" TEXT,
  "taskId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkdeskNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkdeskNotification_userId_readAt_createdAt_idx" ON "WorkdeskNotification"("userId", "readAt", "createdAt");

ALTER TABLE "WorkdeskNotification"
  ADD CONSTRAINT "WorkdeskNotification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
