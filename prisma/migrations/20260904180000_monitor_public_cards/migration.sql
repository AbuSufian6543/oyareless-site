-- Additive: public status cards need a slug, optional logo, category, and a
-- homepage URL that is separate from the server-only probe target.

ALTER TABLE "MonitoredEndpoint" ADD COLUMN "slug" TEXT;
ALTER TABLE "MonitoredEndpoint" ADD COLUMN "websiteUrl" TEXT;
ALTER TABLE "MonitoredEndpoint" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "MonitoredEndpoint" ADD COLUMN "category" TEXT NOT NULL DEFAULT '';

UPDATE "MonitoredEndpoint" SET "slug" = "id" WHERE "slug" IS NULL;

ALTER TABLE "MonitoredEndpoint" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "MonitoredEndpoint_slug_key" ON "MonitoredEndpoint"("slug");
