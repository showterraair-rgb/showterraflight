#!/usr/bin/env bash
# Health check — backend API (run after deploy)
# Usage: bash deploy/scripts/health-check.sh [BASE_URL]
#
# Default checks localhost (on VPS). For external: bash deploy/scripts/health-check.sh https://api.showterraair.com

set -euo pipefail

BASE="${1:-http://127.0.0.1:5000}"
URL="${BASE%/}/api/v1/health"

echo "==> Health check: $URL"

RESP=""
for i in 1 2 3 4 5 6 7 8 9 10; do
  if RESP=$(curl -sf "$URL" 2>/dev/null); then
    break
  fi
  if [[ $i -lt 10 ]]; then
    echo "  attempt $i/10 — API not ready yet, retrying..."
    sleep 2
  fi
done

if [[ -z "$RESP" ]]; then
  echo "FAIL: Could not reach $URL" >&2
  exit 1
fi

echo "$RESP" | grep -q '"success":true' || {
  echo "FAIL: Unexpected response: $RESP" >&2
  exit 1
}

echo "OK: API healthy"
echo "$RESP"
