#!/usr/bin/env bash
# Build the single-file game and zip it for itch.io with index.html at the archive root.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
rm -f dist/ucr-web.zip
(cd dist/web && zip -qr ../ucr-web.zip . -x '*.DS_Store')
echo "Built dist/ucr-web.zip ($(du -h dist/ucr-web.zip | cut -f1))"
