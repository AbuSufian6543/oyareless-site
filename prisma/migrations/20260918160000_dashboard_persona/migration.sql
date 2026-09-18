-- Optional cartoon on the staff dashboard. Existing accounts stay unset
-- until the person picks Boy or Girl on My account or the dashboard card.

CREATE TYPE "DashboardPersona" AS ENUM ('BOY', 'GIRL');

ALTER TABLE "User" ADD COLUMN "dashboardPersona" "DashboardPersona";
