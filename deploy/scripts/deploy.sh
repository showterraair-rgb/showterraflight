#!/usr/bin/env bash
# Deploy / update Show Terra Air on VPS (run as deploy user from app root)
# Usage: bash deploy/scripts/deploy.sh [--no-build]
#
# Assumes: git repo at /var/www/show-terra-air, backend/.env configured, PM2 installed

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

SKIP_BUILD=false
if [[ "${1:-}" == "--no-build" ]]; then
  SKIP_BUILD=true
fi

echo "==> Deploy Show Terra Air @ $(date -Iseconds)"

# Optional: pull latest (skip if deploying from tarball)
if [[ -d .git ]]; then
  git pull --ff-only origin main || git pull --ff-only origin master || true
fi

if [[ "$SKIP_BUILD" == false ]]; then
  bash deploy/scripts/build-release.sh
fi

# Ensure upload/backup dirs exist
mkdir -p backend/uploads/backups
chmod 750 backend/uploads backend/uploads/backups

# PM2
if pm2 describe sta-api &>/dev/null; then
  pm2 reload deploy/ecosystem.config.cjs --env production --update-env
else
  pm2 start deploy/ecosystem.config.cjs --env production
fi
pm2 save

# Nginx test (requires sudo)
if command -v nginx &>/dev/null; then
  sudo nginx -t && sudo systemctl reload nginx || echo "WARN: nginx reload skipped (check config/ssl)"
fi

bash deploy/scripts/health-check.sh

echo "==> Deploy finished"
