#!/usr/bin/env bash
# Health check — backend API (run after deploy)
# Usage: bash deploy/scripts/health-check.sh [BASE_URL]
#
# Default checks localhost (on VPS). For external: bash deploy/scripts/health-check.sh https://api.showterraair.com

set -euo pipefail

BASE="${1:-http://127.0.0.1:5000}"
URL="${BASE%/}/api/v1/health"

echo "==> Health check: $URL"

RESP=$(curl -sf "$URL") || {
  echo "FAIL: Could not reach $URL" >&2
  exit 1
}

echo "$RESP" | grep -q '"success":true' || {
  echo "FAIL: Unexpected response: $RESP" >&2
  exit 1
}

echo "OK: API healthy"
echo "$RESP"
