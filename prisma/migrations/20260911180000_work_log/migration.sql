-- Time entries and products used on tickets and internal tasks.
-- Operational work log (MSP-style), not invoicing or warehouse inventory.

ALTER TYPE "WorkdeskEventKind" ADD VALUE 'TIME_LOGGED';
ALTER TYPE "WorkdeskEventKind" ADD VALUE 'TIME_REMOVED';
ALTER TYPE "WorkdeskEventKind" ADD VALUE 'PRODUCT_USED';
ALTER TYPE "WorkdeskEventKind" ADD VALUE 'PRODUCT_REMOVED';

CREATE TYPE "TimeEntryKind" AS ENUM ('REMOTE', 'ONSITE', 'TRAVEL', 'BENCH', 'OTHER');

CREATE TABLE "WorkProduct" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "category" TEXT NOT NULL DEFAULT 'General',
  "unit" TEXT NOT NULL DEFAULT 'each',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkProduct_sku_key" ON "WorkProduct"("sku");
CREATE INDEX "WorkProduct_isActive_name_idx" ON "WorkProduct"("isActive", "name");

CREATE TABLE "WorkTimeEntry" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT,
  "taskId" TEXT,
  "userId" TEXT NOT NULL,
  "minutes" INTEGER NOT NULL,
  "kind" "TimeEntryKind" NOT NULL DEFAULT 'ONSITE',
  "workedOn" TIMESTAMP(3) NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkTimeEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkTimeEntry_ticket_or_task" CHECK (
    ("ticketId" IS NOT NULL AND "taskId" IS NULL) OR
    ("ticketId" IS NULL AND "taskId" IS NOT NULL)
  )
);

CREATE INDEX "WorkTimeEntry_ticketId_workedOn_idx" ON "WorkTimeEntry"("ticketId", "workedOn");
CREATE INDEX "WorkTimeEntry_taskId_workedOn_idx" ON "WorkTimeEntry"("taskId", "workedOn");
CREATE INDEX "WorkTimeEntry_userId_workedOn_idx" ON "WorkTimeEntry"("userId", "workedOn");

ALTER TABLE "WorkTimeEntry"
  ADD CONSTRAINT "WorkTimeEntry_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkTimeEntry"
  ADD CONSTRAINT "WorkTimeEntry_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkTimeEntry"
  ADD CONSTRAINT "WorkTimeEntry_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "WorkProductUsage" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT,
  "taskId" TEXT,
  "productId" TEXT,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'each',
  "note" TEXT NOT NULL DEFAULT '',
  "addedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkProductUsage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkProductUsage_ticket_or_task" CHECK (
    ("ticketId" IS NOT NULL AND "taskId" IS NULL) OR
    ("ticketId" IS NULL AND "taskId" IS NOT NULL)
  )
);

CREATE INDEX "WorkProductUsage_ticketId_createdAt_idx" ON "WorkProductUsage"("ticketId", "createdAt");
CREATE INDEX "WorkProductUsage_taskId_createdAt_idx" ON "WorkProductUsage"("taskId", "createdAt");

ALTER TABLE "WorkProductUsage"
  ADD CONSTRAINT "WorkProductUsage_ticketId_fkey"
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkProductUsage"
  ADD CONSTRAINT "WorkProductUsage_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "InternalTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkProductUsage"
  ADD CONSTRAINT "WorkProductUsage_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "WorkProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WorkProductUsage"
  ADD CONSTRAINT "WorkProductUsage_addedById_fkey"
  FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "WorkProduct" ("id", "name", "sku", "category", "unit", "isActive", "createdAt", "updatedAt") VALUES
  ('wp_cat6', 'Cat6 Ethernet cable', 'CAB-CAT6', 'Cabling', 'm', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_cat6a', 'Cat6A Ethernet cable', 'CAB-CAT6A', 'Cabling', 'm', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_rj45', 'RJ45 connector', 'CAB-RJ45', 'Cabling', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_keystone', 'Keystone jack', 'CAB-KEY', 'Cabling', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_patch24', '24-port patch panel', 'CAB-PP24', 'Cabling', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_wallplate', 'Wall plate', 'CAB-PLATE', 'Cabling', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_fiber_jmp', 'Fiber jumper', 'FIB-JMP', 'Cabling', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_fiber_m', 'Fiber cable', 'FIB-CABLE', 'Cabling', 'm', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_radio', 'Two-way radio', 'RAD-HT', 'Radio', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_antenna', 'Radio antenna', 'RAD-ANT', 'Radio', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_rad_batt', 'Radio battery', 'RAD-BAT', 'Radio', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_spk_mic', 'Speaker microphone', 'RAD-MIC', 'Radio', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_switch', 'Ethernet switch', 'NET-SW', 'Internet', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_poe', 'PoE injector', 'NET-POE', 'Internet', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_ap', 'Wi-Fi access point', 'NET-AP', 'Internet', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_fw', 'Router / firewall', 'NET-FW', 'Internet', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_ups', 'UPS', 'NET-UPS', 'Internet', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_sfp', 'SFP module', 'NET-SFP', 'Internet', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_phone', 'Desk phone', 'PHN-DESK', 'Phone', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_ata', 'Analog ATA', 'PHN-ATA', 'Phone', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_cam', 'IP camera', 'SEC-CAM', 'Security', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_cam_mnt', 'Camera mount', 'SEC-MNT', 'Security', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_nvr', 'NVR', 'SEC-NVR', 'Security', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_sim', 'SIM card', 'TEL-SIM', 'Internet', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_ties', 'Cable ties', 'CON-TIE', 'General', 'pack', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_tape', 'Electrical tape', 'CON-TAPE', 'General', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('wp_surge', 'Surge protector', 'CON-SURGE', 'General', 'each', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
