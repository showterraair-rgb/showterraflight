#!/usr/bin/env bash
# Restart API + verify health + reset main admin (run on VPS when admin login shows 502)
# Usage: bash deploy/scripts/repair-api.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Repair Show Terra API @ $(date -Iseconds)"

# Required dirs
sudo mkdir -p /var/log/show-terra-air 2>/dev/null || mkdir -p /var/log/show-terra-air 2>/dev/null || true
mkdir -p backend/logs backend/uploads/passports backend/uploads/backups
chmod 750 backend/uploads backend/uploads/passports backend/uploads/backups 2>/dev/null || true

# MongoDB
if command -v systemctl &>/dev/null; then
  if systemctl is-active --quiet mongod 2>/dev/null; then
    echo "OK: MongoDB running"
  else
    echo "WARN: MongoDB not running — starting..."
    sudo systemctl start mongod || true
  fi
fi

# Backend deps (quick fix if node_modules incomplete)
if [[ ! -d backend/node_modules/express ]]; then
  echo "==> Installing backend dependencies..."
  (cd backend && npm ci --omit=dev)
fi

# PM2
if pm2 describe sta-api &>/dev/null; then
  pm2 restart sta-api --update-env || pm2 delete sta-api
fi

if ! pm2 describe sta-api &>/dev/null; then
  pm2 start deploy/ecosystem.config.cjs --env production
fi

pm2 save

echo "==> PM2 status"
pm2 status sta-api

echo "==> Recent API logs"
pm2 logs sta-api --lines 40 --nostream || true

echo "==> Health check"
if bash deploy/scripts/health-check.sh; then
  echo "OK: API is up"
else
  echo "FAIL: API still not responding on port 5000"
  echo "Check: cat backend/.env | grep -E 'MONGODB_URI|JWT_SECRET|PORT'"
  echo "Check: pm2 logs sta-api --lines 100"
  exit 1
fi

echo "==> Reset main admin account"
(cd backend && npm run create-admin-user)

echo ""
echo "==> Done. Login at https://admin.showterraflight.com/login"
echo "    Email:    admin@showterraair.com"
echo "    Password: Admin@123456"
