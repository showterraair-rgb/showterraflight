#!/usr/bin/env bash
# Build both frontends for production (run locally or on CI)
# Usage: bash deploy/scripts/build-release.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Building Show Terra Air release"

# Admin
if [[ -f deploy/env/frontend-admin.production.env.example ]] && [[ ! -f frontend-admin/.env.production ]]; then
  cp deploy/env/frontend-admin.production.env.example frontend-admin/.env.production
  echo "Created frontend-admin/.env.production from example"
fi
cd frontend-admin
npm ci
npm run build
cd "$ROOT"

# Public
if [[ -f deploy/env/frontend-public.production.env.example ]] && [[ ! -f frontend-public/.env.production ]]; then
  cp deploy/env/frontend-public.production.env.example frontend-public/.env.production
  echo "Created frontend-public/.env.production from example"
fi
cd frontend-public
npm ci
npm run build
cd "$ROOT"

# Backend deps (production only)
cd backend
npm ci --omit=dev
cd "$ROOT"

echo "==> Build complete"
bash deploy/scripts/verify-static-assets.sh
echo "    frontend-admin/dist"
echo "    frontend-public/dist"
echo "    backend/node_modules (production)"
