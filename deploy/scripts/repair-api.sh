#!/usr/bin/env bash
# Restart API + verify health + reset main admin (run on VPS when admin login shows 502)
# Usage: bash deploy/scripts/repair-api.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Repair Show Terra API @ $(date -Iseconds)"

if [[ -d .git ]]; then
  git pull --ff-only origin main || true
fi

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
    sleep 2
  fi
fi

# Backend deps — always refresh after git pull
echo "==> Installing backend dependencies..."
(cd backend && npm ci --omit=dev)

# PM2 — clean restart from ecosystem
pm2 delete sta-api 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save

echo "==> PM2 status"
pm2 status sta-api

echo "==> Waiting for API to start..."
HEALTH_OK=false
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 2
  if curl -sf "http://127.0.0.1:5000/api/v1/health" | grep -q '"success":true'; then
    HEALTH_OK=true
    echo "OK: API healthy (attempt $i)"
    break
  fi
  echo "  attempt $i/10 — not ready yet..."
done

echo "==> Recent API logs"
pm2 logs sta-api --lines 30 --nostream || true

if [[ "$HEALTH_OK" != true ]]; then
  echo "FAIL: API not responding on port 5000"
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
