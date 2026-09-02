-- Additive: ordered photos and promo-video links on every CMS page.
-- Empty array on existing rows. Public pages render nothing until an editor
-- adds slides.

ALTER TABLE "Page" ADD COLUMN "slideshow" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "PageRevision" ADD COLUMN "slideshow" JSONB NOT NULL DEFAULT '[]';
