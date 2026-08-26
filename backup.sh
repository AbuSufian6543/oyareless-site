#!/usr/bin/env bash
# ===========================================================================
# WirelessCom.Ca Inc. — backup
#
#   ./backup.sh                 write to ./backups
#   ./backup.sh /mnt/backups    write somewhere else
#   ./backup.sh --restore ./backups/wirelesscom-20260826-101500
#
# Produces a compressed SQL dump of the database plus a tarball of uploaded
# media. Add to root's crontab for nightly runs, e.g.
#   15 2 * * * /opt/wirelesscom/backup.sh /mnt/backups >> /var/log/wc-backup.log 2>&1
# ===========================================================================

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

RESTORE_FROM=""
DEST="$REPO_DIR/backups"
KEEP_DAYS="30"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --restore) RESTORE_FROM="${2:?--restore needs a directory}"; shift 2 ;;
    --keep)    KEEP_DAYS="${2:?--keep needs a number of days}"; shift 2 ;;
    -h|--help)
      cat <<'EOF'
WirelessCom.Ca Inc. — backup

  ./backup.sh                 write to ./backups
  ./backup.sh /mnt/backups    write somewhere else
  ./backup.sh --keep 14       prune backups older than 14 days (default 30)
  ./backup.sh --restore ./backups/wirelesscom-20260826-101500

Produces a gzipped SQL dump of the database plus a tarball of uploaded media.
EOF
      exit 0 ;;
    *)         DEST="$1"; shift ;;
  esac
done

SUDO=""
[[ "$(id -u)" -ne 0 ]] && SUDO="sudo"
compose() { $SUDO docker compose "$@"; }

[[ -f .env ]] || { echo "No .env found in $REPO_DIR" >&2; exit 1; }
# shellcheck disable=SC1091
set -a; . ./.env; set +a

DB_USER="${POSTGRES_USER:-wirelesscom}"
DB_NAME="${POSTGRES_DB:-wirelesscom}"

# --- Restore ---------------------------------------------------------------
if [[ -n "$RESTORE_FROM" ]]; then
  dump="$RESTORE_FROM/database.sql.gz"
  [[ -f "$dump" ]] || { echo "No database.sql.gz in $RESTORE_FROM" >&2; exit 1; }

  echo "This will REPLACE the current database with $dump."
  read -r -p "Type 'restore' to continue: " reply
  [[ "$reply" == "restore" ]] || { echo "Aborted."; exit 1; }

  compose up -d db
  sleep 5
  gunzip -c "$dump" | compose exec -T db psql -U "$DB_USER" -d postgres \
    -v ON_ERROR_STOP=1 -q

  if [[ -f "$RESTORE_FROM/uploads.tar.gz" ]]; then
    echo "Restoring uploaded media..."
    compose run --rm --no-deps -T -v "$RESTORE_FROM:/restore:ro" \
      app sh -c 'tar xzf /restore/uploads.tar.gz -C /' || \
      echo "Could not restore uploads automatically; extract uploads.tar.gz into the volume manually."
  fi

  compose up -d
  echo "Restore complete."
  exit 0
fi

# --- Backup ----------------------------------------------------------------
stamp="$(date -u '+%Y%m%d-%H%M%S')"
out="$DEST/wirelesscom-$stamp"
mkdir -p "$out"

echo "Backing up to $out"

# --clean --if-exists so the dump can be replayed over an existing database.
compose exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists \
  | gzip -9 > "$out/database.sql.gz"
echo "  database.sql.gz  $(du -h "$out/database.sql.gz" | cut -f1)"

# Uploaded media lives in a named volume, so read it through a throwaway
# container that has the volume mounted.
compose run --rm --no-deps -T -v "$out:/backup" app \
  sh -c 'tar czf /backup/uploads.tar.gz -C / app/public/uploads' 2>/dev/null \
  || echo "  (no uploads to archive yet)"
[[ -f "$out/uploads.tar.gz" ]] && \
  echo "  uploads.tar.gz   $(du -h "$out/uploads.tar.gz" | cut -f1)"

cp .env "$out/env.backup"
chmod 600 "$out/env.backup"
echo "  env.backup       (contains secrets — keep this private)"

if [[ "$KEEP_DAYS" -gt 0 ]]; then
  find "$DEST" -maxdepth 1 -type d -name 'wirelesscom-*' -mtime "+$KEEP_DAYS" \
    -exec rm -rf {} + 2>/dev/null || true
  echo "Pruned backups older than $KEEP_DAYS days."
fi

echo "Done."
