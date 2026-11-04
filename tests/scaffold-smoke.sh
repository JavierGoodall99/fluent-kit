#!/usr/bin/env bash
# Scaffold smoke test (needs network: npm create vite and npm install). From a folder that holds only the kit, one
# command creates a Vite app next to the kit's files, installs Fluent, writes the theme and wraps the app; then the
# finish command type-checks it (TypeScript 7 included). Run from the repo root: bash tests/scaffold-smoke.sh
set -euo pipefail
base="$(mktemp -d)"
trap 'rm -rf "$base"' EXIT
app="$base/billing-portal"
mkdir -p "$app" && cd "$app" && git init -q
node "$OLDPWD/install.mjs" . </dev/null >/dev/null
git add -A && git -c user.email=t@t -c user.name=t commit -qm kit
node .fluent-kit/scripts/scaffold.mjs --brand "#0f6cbd" --lang nl | grep -q 'Done: Vite app "billing-portal"'
test -f .fluent-kit/scripts/check.mjs && test -f .github/skills/fluent-ui/SKILL.md     # the kit survived the starter
test ! -e fluent-kit-scaffold && test ! -e src/index.css && test ! -e src/App.css
grep -q '<html lang="nl">' index.html && grep -q '<title>Billing portal</title>' index.html
grep -q '"name": "billing-portal"' package.json && grep -q '@fluentui/react-components' package.json
grep -q 'AppProvider' src/main.tsx && grep -q 'makeStaticStyles({ body: { margin: 0 } })' src/theme.tsx
grep -q '"hex": "#0f6cbd"' .fluent-kit/brand.json
again=$(node .fluent-kit/scripts/scaffold.mjs --brand stock 2>&1 || true)   # refuses an existing app (exit 1)
grep -q "already has a package.json" <<<"$again"
node .fluent-kit/scripts/check.mjs --finish --page / | grep -q "tsc ok"
echo "scaffold smoke test: ok"
