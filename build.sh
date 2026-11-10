#!/usr/bin/env bash
# Build the site into _site (or $1): the upstream emulator's wasm and browser modules, then
# this repository's page over them. Serve it with: (cd _site && python3 -m http.server 8642)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$ROOT/_site}"
mkdir -p "$OUT" && OUT="$(cd "$OUT" && pwd)"
# patches/ change upstream for this page (the body colour). They apply for the build only.
PATCHES=("$ROOT"/patches/*.patch)
git -C "$ROOT/upstream" apply "${PATCHES[@]}"
trap 'git -C "$ROOT/upstream" apply -R "${PATCHES[@]}"' EXIT
"$ROOT/upstream/web/build.sh" "$OUT" >/dev/null
rm -rf "$OUT/smk37" "$OUT/fm1-emu-report.pdf" "$OUT/og.png"
cp "$ROOT"/web/{index.html,style.css,main.js,touch.js,icons.js,accent.js,update.js,manifest.webmanifest,icon.svg,icon-192.png,icon-512.png} "$OUT/"
# the deploy's version: installed apps check it to update (web/update.js), and the service worker
# gets a new cache with it
VERSION="${VERSION:-$(git -C "$ROOT" rev-parse --short HEAD)}"
printf '{ "version": "%s" }\n' "$VERSION" > "$OUT/version.json"
sed "s/^const VERSION = \"dev\";/const VERSION = \"$VERSION\";/" "$ROOT/web/sw.js" > "$OUT/sw.js"
grep -q "const VERSION = \"$VERSION\";" "$OUT/sw.js"
echo "built $OUT"
