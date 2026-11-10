#!/usr/bin/env bash
# Build the site into _site (or $1): the upstream emulator's wasm and browser modules, then
# this repository's page over them. Serve it with: (cd _site && python3 -m http.server 8642)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$ROOT/_site}"
mkdir -p "$OUT" && OUT="$(cd "$OUT" && pwd)"
"$ROOT/upstream/web/build.sh" "$OUT" >/dev/null
rm -rf "$OUT/smk37" "$OUT/fm1-emu-report.pdf" "$OUT/og.png"
cp "$ROOT"/web/{index.html,style.css,main.js,touch.js,manifest.webmanifest,icon.svg} "$OUT/"
echo "built $OUT"
