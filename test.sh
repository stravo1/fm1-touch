#!/usr/bin/env bash
# Run this repository's tests, and upstream's page tests against this repository's main.js.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
PAGE="$(mktemp -d)"
trap 'rm -rf "$PAGE"' EXIT
cp "$ROOT"/upstream/web/{main.test.mjs,persistence.js,tryout.js} "$ROOT"/web/{main.js,touch.js} "$PAGE/"
node --test "$ROOT"/web/*.test.mjs "$PAGE/main.test.mjs"
