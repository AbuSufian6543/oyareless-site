# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# WirelessCom.Ca Inc. — production image
#
# Two images come out of this file:
#   target=runner   the slim standalone Next.js server (the `app` service)
#   target=builder  the full toolchain, used by the one-shot `migrate` service
#                   to run `prisma migrate deploy` and the seed
# Both share build cache, so the second target costs almost nothing.
# ---------------------------------------------------------------------------

FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app


# --- Dependencies ----------------------------------------------------------
FROM base AS deps
# postinstall runs `prisma generate`, which reads prisma.config.ts. Generate
# never connects, but the config still needs a non-empty DATABASE_URL.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --include=dev


# --- Build / migration toolchain -------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `next build` needs *values* for the vars that env.ts marks required, even
# though nothing is read from the database at build time. Real values are
# injected by docker compose at runtime.
ENV NODE_ENV=production \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    AUTH_SECRET=build-time-placeholder-never-used-at-runtime

RUN npx prisma generate && npm run build

COPY docker/migrate.sh /usr/local/bin/migrate.sh
RUN chmod +x /usr/local/bin/migrate.sh


# --- Runtime ---------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone output bundles only the modules the server actually imports.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Uploaded media lives on a volume mounted here.
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
