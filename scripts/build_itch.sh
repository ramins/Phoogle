#!/usr/bin/env bash
# Package game/ for itch.io: zip with index.html at the archive root.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
rm -f dist/ucr-web.zip
(cd game && zip -r ../dist/ucr-web.zip . -x '*.DS_Store')
echo "Built dist/ucr-web.zip ($(du -h dist/ucr-web.zip | cut -f1))"
