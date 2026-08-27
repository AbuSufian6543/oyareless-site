-- CreateEnum
CREATE TYPE "EmbedPlacement" AS ENUM ('PAGE', 'HEAD', 'BODY_END');

-- CreateEnum
CREATE TYPE "ProbeKind" AS ENUM ('HTTP', 'TCP', 'DNS');

-- CreateEnum
CREATE TYPE "IncidentSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('NEW', 'REVIEWING', 'QUOTED', 'WON', 'LOST', 'CANCELLED');

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "icon" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "relationship" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FaqItem" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FaqItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KbCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KbCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KbArticle" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KbArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseStudy" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sector" TEXT NOT NULL DEFAULT '',
    "clientName" TEXT,
    "problem" TEXT NOT NULL DEFAULT '',
    "solution" TEXT NOT NULL DEFAULT '',
    "implementation" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL DEFAULT '',
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbedSnippet" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "html" TEXT NOT NULL,
    "placement" "EmbedPlacement" NOT NULL DEFAULT 'PAGE',
    "allowedPages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmbedSnippet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitoredEndpoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ProbeKind" NOT NULL DEFAULT 'HTTP',
    "target" TEXT NOT NULL,
    "port" INTEGER,
    "expectStatus" INTEGER NOT NULL DEFAULT 200,
    "timeoutMs" INTEGER NOT NULL DEFAULT 5000,
    "intervalSec" INTEGER NOT NULL DEFAULT 300,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitoredEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusCheck" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "latencyMs" INTEGER,
    "statusCode" INTEGER,
    "error" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incident" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" "IncidentSeverity" NOT NULL DEFAULT 'MINOR',
    "affected" TEXT NOT NULL DEFAULT '',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentUpdate" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceWindow" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "affected" TEXT NOT NULL DEFAULT '',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolUsageLog" (
    "id" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "durationMs" INTEGER,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeedTestResult" (
    "id" TEXT NOT NULL,
    "shareToken" TEXT NOT NULL,
    "downloadMbps" DOUBLE PRECISION NOT NULL,
    "uploadMbps" DOUBLE PRECISION NOT NULL,
    "latencyMs" DOUBLE PRECISION NOT NULL,
    "jitterMs" DOUBLE PRECISION NOT NULL,
    "networkName" TEXT,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpeedTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountRef" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerUser" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "recoveryCodes" JSONB,
    "inviteTokenHash" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSession" (
    "id" TEXT NOT NULL,
    "customerUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerServiceItem" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "startedAt" TIMESTAMP(3),
    "renewsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerServiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerDocument" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "status" "TicketStatus" NOT NULL DEFAULT 'NEW',
    "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "customerId" TEXT NOT NULL,
    "createdById" TEXT,
    "assignedToId" TEXT,
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorCustomerUserId" TEXT,
    "authorStaffId" TEXT,
    "authorStaffName" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketAttachment" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'NEW',
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "companyName" TEXT,
    "siteAddress" TEXT,
    "details" TEXT NOT NULL DEFAULT '',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "timeframe" TEXT,
    "budgetRange" TEXT,
    "serviceId" TEXT,
    "serviceAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customerId" TEXT,
    "internalNotes" TEXT,
    "respondedAt" TIMESTAMP(3),
    "sourcePage" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAttachment" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_order_idx" ON "ServiceCategory"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_status_order_idx" ON "Service"("status", "order");

-- CreateIndex
CREATE INDEX "Service_categoryId_order_idx" ON "Service"("categoryId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_status_order_idx" ON "Brand"("status", "order");

-- CreateIndex
CREATE INDEX "FaqItem_status_category_order_idx" ON "FaqItem"("status", "category", "order");

-- CreateIndex
CREATE UNIQUE INDEX "KbCategory_slug_key" ON "KbCategory"("slug");

-- CreateIndex
CREATE INDEX "KbCategory_order_idx" ON "KbCategory"("order");

-- CreateIndex
CREATE UNIQUE INDEX "KbArticle_slug_key" ON "KbArticle"("slug");

-- CreateIndex
CREATE INDEX "KbArticle_status_order_idx" ON "KbArticle"("status", "order");

-- CreateIndex
CREATE INDEX "KbArticle_categoryId_order_idx" ON "KbArticle"("categoryId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CaseStudy_slug_key" ON "CaseStudy"("slug");

-- CreateIndex
CREATE INDEX "CaseStudy_status_order_idx" ON "CaseStudy"("status", "order");

-- CreateIndex
CREATE UNIQUE INDEX "EmbedSnippet_slug_key" ON "EmbedSnippet"("slug");

-- CreateIndex
CREATE INDEX "EmbedSnippet_isActive_idx" ON "EmbedSnippet"("isActive");

-- CreateIndex
CREATE INDEX "MonitoredEndpoint_enabled_isPublic_order_idx" ON "MonitoredEndpoint"("enabled", "isPublic", "order");

-- CreateIndex
CREATE INDEX "StatusCheck_endpointId_checkedAt_idx" ON "StatusCheck"("endpointId", "checkedAt");

-- CreateIndex
CREATE INDEX "StatusCheck_checkedAt_idx" ON "StatusCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "Incident_resolvedAt_startedAt_idx" ON "Incident"("resolvedAt", "startedAt");

-- CreateIndex
CREATE INDEX "IncidentUpdate_incidentId_createdAt_idx" ON "IncidentUpdate"("incidentId", "createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceWindow_startsAt_idx" ON "MaintenanceWindow"("startsAt");

-- CreateIndex
CREATE INDEX "ToolUsageLog_tool_createdAt_idx" ON "ToolUsageLog"("tool", "createdAt");

-- CreateIndex
CREATE INDEX "ToolUsageLog_ipHash_createdAt_idx" ON "ToolUsageLog"("ipHash", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SpeedTestResult_shareToken_key" ON "SpeedTestResult"("shareToken");

-- CreateIndex
CREATE INDEX "SpeedTestResult_createdAt_idx" ON "SpeedTestResult"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_accountRef_key" ON "Customer"("accountRef");

-- CreateIndex
CREATE INDEX "Customer_isActive_idx" ON "Customer"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerUser_email_key" ON "CustomerUser"("email");

-- CreateIndex
CREATE INDEX "CustomerUser_customerId_idx" ON "CustomerUser"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSession_tokenHash_key" ON "CustomerSession"("tokenHash");

-- CreateIndex
CREATE INDEX "CustomerSession_customerUserId_idx" ON "CustomerSession"("customerUserId");

-- CreateIndex
CREATE INDEX "CustomerSession_expiresAt_idx" ON "CustomerSession"("expiresAt");

-- CreateIndex
CREATE INDEX "CustomerServiceItem_customerId_idx" ON "CustomerServiceItem"("customerId");

-- CreateIndex
CREATE INDEX "CustomerDocument_customerId_createdAt_idx" ON "CustomerDocument"("customerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_reference_key" ON "Ticket"("reference");

-- CreateIndex
CREATE INDEX "Ticket_customerId_status_idx" ON "Ticket"("customerId", "status");

-- CreateIndex
CREATE INDEX "Ticket_status_priority_createdAt_idx" ON "Ticket"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_assignedToId_status_idx" ON "Ticket"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketAttachment_messageId_idx" ON "TicketAttachment"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_reference_key" ON "QuoteRequest"("reference");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_createdAt_idx" ON "QuoteRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "QuoteAttachment_quoteId_idx" ON "QuoteAttachment"("quoteId");

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KbArticle" ADD CONSTRAINT "KbArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KbCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusCheck" ADD CONSTRAINT "StatusCheck_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "MonitoredEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentUpdate" ADD CONSTRAINT "IncidentUpdate_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerUser" ADD CONSTRAINT "CustomerUser_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSession" ADD CONSTRAINT "CustomerSession_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerServiceItem" ADD CONSTRAINT "CustomerServiceItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerDocument" ADD CONSTRAINT "CustomerDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "CustomerUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_authorCustomerUserId_fkey" FOREIGN KEY ("authorCustomerUserId") REFERENCES "CustomerUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_authorStaffId_fkey" FOREIGN KEY ("authorStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketAttachment" ADD CONSTRAINT "TicketAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "TicketMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAttachment" ADD CONSTRAINT "QuoteAttachment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
