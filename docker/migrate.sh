#!/bin/sh
# ---------------------------------------------------------------------------
# One-shot job: wait for Postgres, apply the schema, seed content, then
# content-sync (new pages, unedited pages, empty photos/logos on edited pages,
# missing service cards and brand tiles, a stats strip when Home is missing one,
# additive nav). The `app` service
# waits for this to finish successfully before starting. Safe to re-run:
# the seed never overwrites edited records; content-sync fills empty photos
# and logos on edited pages and only replaces a page wholesale when it is
# unedited or forced.
# ---------------------------------------------------------------------------
set -eu

log() { printf '[migrate] %s\n' "$1"; }

if [ -z "${DATABASE_URL:-}" ]; then
  log "DATABASE_URL is not set. Refusing to continue."
  exit 1
fi

log "Waiting for the database..."
attempt=0
until node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => client.end()).then(() => process.exit(0)).catch(() => process.exit(1));
" 2>/dev/null; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    log "Database still unreachable after 2 minutes. Giving up."
    exit 1
  fi
  sleep 2
done
log "Database is reachable."

# `migrate deploy` is correct once migrations are committed to the repo; a
# fresh checkout with no migration history falls back to pushing the schema.
if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  log "Applying migrations..."
  npx prisma migrate deploy
else
  log "No migration history found; syncing the schema directly..."
  npx prisma db push --skip-generate
fi

if [ "${RUN_SEED:-true}" = "true" ]; then
  log "Seeding..."
  npx tsx prisma/seed.ts
  log "Syncing additive content (new pages, photos on edited pages, new nav)..."
  npx tsx scripts/content-sync.ts --apply
else
  log "RUN_SEED is not 'true'; skipping the seed."
fi

log "Done."
