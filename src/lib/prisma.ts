import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Give Postgres time to connect; do not treat a slow query as a total outage. */
const QUERY_TIMEOUT_MS = 8_000;
const CONNECT_TIMEOUT_MS = 10_000;
const DB_COOLDOWN_MS = 5_000;

let dbDownUntil = 0;

function markDbDown() {
  dbDownUntil = Date.now() + DB_COOLDOWN_MS;
}

export function isTransientDbError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /timeout|ECONNREFUSED|ENOTFOUND|ECONNRESET|unreachable|connect|Database unreachable|DATABASE_URL/i.test(
    message,
  );
}

function isHardDbOutage(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /ECONNREFUSED|ENOTFOUND|ECONNRESET|unreachable|Database unreachable/i.test(
    message,
  );
}

export function withTimeout<T>(promise: Promise<T>, ms = QUERY_TIMEOUT_MS): Promise<T> {
  if (Date.now() < dbDownUntil) {
    return Promise.reject(new Error("Database unreachable"));
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Database query timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        if (isHardDbOutage(error)) markDbDown();
        reject(error);
      },
    );
  });
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
      idleTimeoutMillis: 10_000,
    }),
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

function rejectAll(error: unknown) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") return undefined;
        return () => Promise.reject(error);
      },
    },
  );
}

/**
 * Lazy Prisma client. Importing this module must not throw — public pages
 * catch query failures and render fallbacks when Postgres is missing or down.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    try {
      const client = getClient();
      const value = Reflect.get(client, prop, client);
      return typeof value === "function" ? value.bind(client) : value;
    } catch (error) {
      if (prop === "then") return undefined;
      return rejectAll(error);
    }
  },
}) as PrismaClient;
