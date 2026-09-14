-- New streams stay off /live and Video & Broadcasting until an editor
-- opts in. Existing rows keep their current isPublic value.

ALTER TABLE "Stream" ALTER COLUMN "isPublic" SET DEFAULT false;
