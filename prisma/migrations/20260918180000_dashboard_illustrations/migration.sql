-- Replace boy/girl cartoons with the three technician illustrations.
-- Every existing account gets the rack illustration; staff can change it later.

CREATE TYPE "DashboardPersona_new" AS ENUM ('RACK', 'ENGINEERING', 'BENCH');

ALTER TABLE "User"
  ADD COLUMN "dashboardPersona_new" "DashboardPersona_new" NOT NULL DEFAULT 'RACK';

ALTER TABLE "User" DROP COLUMN "dashboardPersona";

DROP TYPE "DashboardPersona";

ALTER TYPE "DashboardPersona_new" RENAME TO "DashboardPersona";

ALTER TABLE "User" RENAME COLUMN "dashboardPersona_new" TO "dashboardPersona";
