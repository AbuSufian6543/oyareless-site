import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * DATABASE_URL is required at runtime (migrations, seed, the app). During
 * `npm ci` / `prisma generate` in a Docker build there is no real database yet,
 * so we fall back to a throwaway URL — generate never opens a connection.
 */
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://build:build@127.0.0.1:5432/build";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
