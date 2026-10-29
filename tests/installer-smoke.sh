#!/usr/bin/env bash
# Installer smoke test: installs the kit into throwaway folders and checks what landed where. Run from the repo root.
# CI runs it on Linux, macOS and Windows (Git Bash). Run: bash tests/installer-smoke.sh
set -euo pipefail
base="$(mktemp -d)"
trap 'rm -rf "$base"' EXIT
RUNNER_TEMP="$base"
target="$RUNNER_TEMP/target"
mkdir -p "$target"
node install.mjs "$target" --claude --agents
test -f "$target/.claude/skills/fluent-ui/tasks/new-page.md"
test ! -e "$target/.github/skills/fluent-ui"
grep -q ".claude/skills/fluent-ui/SKILL.md" "$target/AGENTS.md"
grep -qx "@AGENTS.md" "$target/CLAUDE.md"
claude_only="$RUNNER_TEMP/claude-only" && mkdir -p "$claude_only" && node install.mjs "$claude_only" --claude
grep -q ".claude/skills/fluent-ui/SKILL.md" "$claude_only/CLAUDE.md"
plain="$RUNNER_TEMP/plain" && mkdir -p "$plain" && node install.mjs "$plain"
test -f "$plain/.github/skills/fluent-ui/SKILL.md" && test ! -e "$plain/.claude"
test -f "$target/CLAUDE.md" && test -f "$target/AGENTS.md"
test ! -e "$target/research" && test ! -e "$target/.fluent-kit/brands" && test ! -e "$target/.fluent-kit/DESIGN.md"
node install.mjs "$target" --dry-run | grep -q "updated the Fluent kit block"
stale="$RUNNER_TEMP/stale" && mkdir -p "$stale/.github/skills/fluent-ui" "$stale/.github/skills/other" && printf -- '---\nname: fluent-ui\n---\n' > "$stale/.github/skills/fluent-ui/SKILL.md" && echo keep > "$stale/.github/skills/other/SKILL.md"
node install.mjs "$stale" --claude | grep -q "removed .github/skills/fluent-ui/"
test ! -e "$stale/.github/skills/fluent-ui" && test -f "$stale/.github/skills/other/SKILL.md" && test -f "$stale/.claude/skills/fluent-ui/SKILL.md"
echo "installer smoke test: ok"
