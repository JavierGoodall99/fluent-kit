# Changelog

## Unreleased
- The installer removes an older copy of the `fluent-ui` skill from the other skill folders (`.github/skills`, `.claude/skills`, `.agents/skills`), so an agent no longer sees two skills with different rules after an upgrade.
- verify runs the dev script with npm when the package manager its lockfile points to (bun, pnpm, yarn) is not on the shell's PATH, instead of failing with "could not connect".

## 1.5.1
- The finish command applies to every change, even a one-line change or a removal, and the agent says so when it could not run it. Removing something also removes the import it leaves behind.
- Small fixes that only change an icon, text, colour or prop finish with `--no-verify` (rules and `tsc`, a few seconds). Size, spacing or layout changes keep the browser check; a restyle, page or app always gets it.
- verify prints the busy-port note once, not once per line of server output.
- Always-on block trimmed back to 248 words.

## 1.5.0
- `check.mjs --finish`: one command ends every task (rules, `tsc`, browser check only when something visible changed).
- `context.mjs <route>`: one cached call at the start of a task replaces three or four reads.
- Task and pattern cards replace the long reference files; the reference notes moved to `research/` and are not installed.
- `rules.json`: one list of banned libraries and native elements, shared by the checker, theme detection and the lint rules.
- Installer: `--claude`, `--skills-dir`, `--with-deps`; a manifest so updates remove files the kit no longer ships; `CLAUDE.md` imports `AGENTS.md` when both are used.
- verify: no false "cut off at the bottom" warning on padded pages; prints each page's heading, not only the tab title.
- Reading cost is measured in tokens and checked in CI; the list card says how to centre a DataGrid column.
