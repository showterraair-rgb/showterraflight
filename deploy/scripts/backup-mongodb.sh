#!/usr/bin/env bash
# Standalone MongoDB backup (supplement to in-app scheduled backup)
# Usage: sudo bash deploy/scripts/backup-mongodb.sh
#
# Requires mongodump on PATH. Writes to backend/uploads/backups/

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backend/uploads/backups}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE="$BACKUP_DIR/sta-manual-${TIMESTAMP}.archive.gz"

mkdir -p "$BACKUP_DIR"

# Load MONGODB_URI from backend .env if present
if [[ -f "$ROOT/backend/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^MONGODB_URI=' "$ROOT/backend/.env" | sed 's/\r$//')
  set +a
fi

URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/show_terra_air}"

echo "==> Backup to $ARCHIVE"
mongodump --uri="$URI" --archive="$ARCHIVE" --gzip

ls -lh "$ARCHIVE"
echo "==> Backup complete"
echo "Restore (manual): mongorestore --uri=\"\$MONGODB_URI\" --archive=$ARCHIVE --gzip --drop"
echo "WARNING: --drop removes existing data. Test on staging first."
