# Changelog

## 1.5.0
- `check.mjs --finish`: one command ends every task (rules, `tsc`, browser check only when something visible changed).
- `context.mjs <route>`: one cached call at the start of a task replaces three or four reads.
- Task and pattern cards replace the long reference files; the reference notes moved to `research/` and are not installed.
- `rules.json`: one list of banned libraries and native elements, shared by the checker, theme detection and the lint rules.
- Installer: `--claude`, `--skills-dir`, `--with-deps`; a manifest so updates remove files the kit no longer ships; `CLAUDE.md` imports `AGENTS.md` when both are used.
- verify: no false "cut off at the bottom" warning on padded pages; prints each page's heading, not only the tab title.
- Reading cost is measured in tokens and checked in CI; the list card says how to centre a DataGrid column.
