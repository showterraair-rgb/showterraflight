#!/usr/bin/env bash
# Restore MongoDB from a mongodump archive created by Show Terra Air backups.
# Usage: bash deploy/scripts/restore-mongodb.sh /path/to/sta-backup-....archive.gz
#
# WARNING: Uses --drop — all existing collections in the target database are replaced.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: bash deploy/scripts/restore-mongodb.sh /path/to/backup.archive.gz"
  exit 1
fi

ARCHIVE="$1"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ ! -f "$ARCHIVE" ]]; then
  echo "Backup file not found: $ARCHIVE"
  exit 1
fi

if [[ -f "$ROOT/backend/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^MONGODB_URI=' "$ROOT/backend/.env" | sed 's/\r$//')
  set +a
fi

URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/show_terra_air}"

echo "==> STOPPING API (if PM2 app sta-api exists)"
if command -v pm2 >/dev/null 2>&1; then
  pm2 stop sta-api 2>/dev/null || true
fi

echo "==> RESTORE from $ARCHIVE"
echo "    Target URI: $URI"
read -r -p "Type RESTORE to continue: " CONFIRM
if [[ "$CONFIRM" != "RESTORE" ]]; then
  echo "Aborted."
  exit 1
fi

mongorestore --uri="$URI" --archive="$ARCHIVE" --gzip --drop

echo "==> Restore complete"
if command -v pm2 >/dev/null 2>&1; then
  echo "Start API with: pm2 start sta-api"
fi
