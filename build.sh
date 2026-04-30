#!/usr/bin/env bash
set -e

VERSION=$(node -e "console.log(JSON.parse(require('fs').readFileSync('dist/manifest.json','utf8')).version)")
OUT="chat-gpt-buttons-${VERSION}.zip"

rm -f "$OUT"
cd dist
zip -r "../$OUT" manifest.json content.js pills.js popup.html popup.js icons/
cd ..

echo "Built $OUT"
