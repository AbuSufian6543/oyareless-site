-- Per-page opt-in so visitors can switch that page to a light look.
-- Existing pages stay off until an editor turns the control on.

ALTER TABLE "Page" ADD COLUMN "visitorThemeToggle" BOOLEAN NOT NULL DEFAULT false;
