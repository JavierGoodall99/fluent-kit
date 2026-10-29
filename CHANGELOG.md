# Changelog

## Unreleased
- `check.mjs --finish` ignores `--no-verify` when the change touches a size, spacing, width or layout setting, adds or removes a component (icons excepted), or adds or deletes a UI file. It says so in its summary line and runs the browser check. Text, colour and icon edits still skip it.
- Installer `--ci` writes `.github/workflows/fluent-kit.yml`, a pull-request check that runs the rules whether or not the agent ran its own.
- `doctor.mjs`: `node .fluent-kit/scripts/doctor.mjs` checks an install and its environment and prints one line per finding (ok, warn or FIX) with the command that fixes it: kit and skill files present and unedited, one copy of the skill, the always-on block pointing at the right folder, Fluent v9, TypeScript, Playwright, axe-core and Chromium, the package manager on PATH, a `dev` script, git history, valid local JSON, and `.verify-profile` kept out of git. Exit code 1 when something needs fixing.
- The always-on block no longer says `--no-verify` is for a "prop" change (a size is a prop); it is for a small fix to only an icon, text or colour, and any size, spacing, width or layout change gets the browser check.

## 1.5.1
- The finish command applies to every change, even a one-line change or a removal, and the agent says so when it could not run it. Removing something also removes the import it leaves behind.
- Small fixes that only change an icon, text, colour or prop finish with `--no-verify` (rules and `tsc`, a few seconds). Size, spacing or layout changes keep the browser check; a restyle, page or app always gets it.
- verify prints the busy-port note once, not once per line of server output.
- Always-on block kept to 250 words.
- verify tries every URL the dev server printed (it prints several when ports are busy) until one answers, and stops with one clear line, exit 2, when none does, instead of rendering into "connection refused".
- The installer removes an older copy of the `fluent-ui` skill from the other skill folders (`.github/skills`, `.claude/skills`, `.agents/skills`), so an agent no longer sees two skills with different rules after an upgrade.
- verify runs the dev script with npm when the package manager its lockfile points to (bun, pnpm, yarn) is not on the shell's PATH, instead of failing with "could not connect".

## 1.5.0
- `check.mjs --finish`: one command ends every task (rules, `tsc`, browser check only when something visible changed).
- `context.mjs <route>`: one cached call at the start of a task replaces three or four reads.
- Task and pattern cards replace the long reference files; the reference notes moved to `research/` and are not installed.
- `rules.json`: one list of banned libraries and native elements, shared by the checker, theme detection and the lint rules.
- Installer: `--claude`, `--skills-dir`, `--with-deps`; a manifest so updates remove files the kit no longer ships; `CLAUDE.md` imports `AGENTS.md` when both are used.
- verify: no false "cut off at the bottom" warning on padded pages; prints each page's heading, not only the tab title.
- Reading cost is measured in tokens and checked in CI; the list card says how to centre a DataGrid column.
