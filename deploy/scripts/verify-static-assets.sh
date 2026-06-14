#!/usr/bin/env bash
# Verify homepage static images exist in the public build output.
# Usage: bash deploy/scripts/verify-static-assets.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DIST="$ROOT/frontend-public/dist/images/home"

required=(hero.svg promo.svg destination.svg gallery.svg person.svg office.svg sky.svg)

if [[ ! -d "$DIST" ]]; then
  echo "FAIL: Missing directory $DIST"
  echo "Run: bash deploy/scripts/build-release.sh"
  exit 1
fi

missing=0
for file in "${required[@]}"; do
  if [[ ! -f "$DIST/$file" ]]; then
    echo "FAIL: Missing $DIST/$file"
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  exit 1
fi

echo "OK: All ${#required[@]} homepage images present in dist"
