#!/usr/bin/env bash
# Rollback to previous git commit and redeploy (quick rollback)
# Usage: bash deploy/scripts/rollback.sh <commit-sha>
#
# For full restore including DB, see docs/DEPLOYMENT.md backup restore section.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <commit-sha>" >&2
  exit 1
fi

COMMIT="$1"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> Rolling back to $COMMIT"
git fetch origin
git checkout "$COMMIT"

bash deploy/scripts/deploy.sh

echo "==> Rollback deploy complete. Current HEAD: $(git rev-parse --short HEAD)"
echo "To return to latest: git checkout main && bash deploy/scripts/deploy.sh"
