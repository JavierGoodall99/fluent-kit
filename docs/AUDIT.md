# Audit checklist and findings log

An audit of the kit is this list, run in this order, every time. It gives the same answer twice, and a new audit only adds what changed. Automated checks run in CI; manual checks need a person or a real agent run.

## How to run it

```
npm test            # unit tests, budgets, links
npm run audit       # tests/audit.mjs (AUD-*), reading cost, links, every example rendered (needs Edge or Chrome)
```

Then the manual checks below. Record each result in the log at the bottom: a new finding gets the next ID; a fixed one gets the version that fixed it and the check that now guards it.

## Automated checks

| ID | Check | Where |
|---|---|---|
| AUD-01 | Every "no hard-coded X" in the always-on block is enforced by a `check.mjs` rule | `tests/audit.mjs` |
| AUD-02 | Every field `detect-theme.mjs` outputs is shown by `context.mjs` | `tests/audit.mjs` |
| AUD-03 | No sentence (9 words in a row) repeated across agent-facing files | `tests/audit.mjs` |
| AUD-04 | No shipped script grows past its token limit | `tests/audit.mjs` |
| AUD-05 | Every `--option` the README, reference and cards name exists in a script | `tests/audit.mjs` |
| AUD-06 | Commands in cards can be copied as written (no `\|` from markdown tables) | `tests/audit.mjs` |
| AUD-07 | The kit repo explains itself to agents (`AGENTS.md`, `CLAUDE.md`) | `tests/audit.mjs` |
| AUD-08 | No card sets a size Fluent already sets | `tests/audit.mjs` |
| AUD-09 | Every example renders clean at 1440 and 375px: no errors, no control over text, its click-to-open state too | `tests/render-examples.mjs` |
| AUD-10 | Reading cost per route stays within budget | `tests/reading-cost.mjs` |
| AUD-11 | Agent-facing files point only at files that exist; every example is named by a card | `tests/links.mjs` |
| AUD-12 | `--finish` sizes the check, stops at the first failure, finds `tsc` (TypeScript 5 to 7) | `tests/check-finish.test.mjs` |
| AUD-13 | `context.mjs` routes correctly: empty folder, new app, migrate, cache | `tests/context.test.mjs` |
| AUD-14 | Installer: one skill copy, blocks in the right files, old files removed, repo-only files not shipped | `tests/installer-smoke.sh` |
| AUD-15 | Empty folder to a type-checked Fluent app with one command (Linux, Windows, macOS) | `tests/scaffold-smoke.sh` |

## Manual checks

| ID | Check | How |
|---|---|---|
| MAN-01 | Cost and time with Copilot | `tests/BENCHMARK.md`: vague prompts, fresh chat, record credits, time and the 6 quality checks |
| MAN-02 | Someone who did not build the kit installs it and asks for one page | Note every question they ask and every place they get stuck |
| MAN-03 | A person looks at the contact sheets of the last runs | Copilot may not see images: the browser checks are then the only visual gate |
| MAN-04 | Pattern coverage | List the screens asked for in the last runs that no card covers |
| MAN-05 | A first read of the repo as a new contributor | Open the repo cold: is it clear what ships and what is for work here? |

## Findings log

Status: **fixed** (version, guarding check) or **open**.

| # | Finding | Found by | Status |
|---|---|---|---|
| F-01 | Migrate route sent the agent to `new-app.md` and told it to ask whether this was a migration | Audit 1 | fixed 1.6.0 (AUD-13) |
| F-02 | `check.mjs` pointed to `.github/skills/` when the skill was in `.claude/skills/` | Audit 1 | fixed 1.6.0 (AUD-11) |
| F-03 | `verify` pointed to a "Surfaces" section that did not exist | Audit 1 | fixed 1.6.0 |
| F-04 | Description sizes disagreed between `SKILL.md`, `form.md` and `settings.md` | Audit 1 | fixed 1.6.0 |
| F-05 | The finish command told the agent to `npm install` Playwright, against "no new packages" | Audit 1 | fixed 1.6.0 (AUD-12) |
| F-06 | Two scripts to apply a brand, named in different places | Audit 1 | fixed 1.6.0 |
| F-07 | `--no-verify` was the agent's call; the command now decides | Audit 1 | fixed 1.6.0 (AUD-12) |
| F-08 | Taste warnings caused fix loops | Audit 1 | fixed 1.6.0 (advisory level) |
| F-09 | "open:" pointed at full-page screenshots too tall to read | Audit 1 | fixed 1.6.0 |
| F-10 | verify's dependencies changed the project's `package.json` | Audit 1 | fixed 1.6.0 |
| F-11 | With `AGENTS.md`, Copilot loaded the block twice | Audit 1 | fixed 1.6.0 (AUD-14) |
| F-12 | Same rule in several files (card style, companion packages, type sizes) | Audit 1 | fixed 1.6.0, now AUD-03 |
| F-13 | TypeScript 7 never type-checked (`typescript/bin/tsc` not exported) | Backtest 1 | fixed 1.6.1 (AUD-12) |
| F-14 | Empty folder told to install Fluent into nothing | Backtest 1 | fixed 1.6.1 (AUD-13) |
| F-15 | App starters refuse a folder holding the kit; `--overwrite` would delete it | Backtest 1 | fixed 1.6.1 (AUD-15) |
| F-16 | White frame round every new app (body margin) | Backtest 1 | fixed 1.6.1 (AUD-15) |
| F-17 | status-grid example: Re-run covered the message on phones | Backtest 1 | fixed 1.6.1 (AUD-09) |
| F-18 | verify did not see a control over text | Backtest 1 | fixed 1.6.1 (AUD-09) |
| F-19 | One crash reported as five findings | Backtest 1 | fixed 1.6.1 |
| F-20 | "No hard-coded sizes" in the block; examples and cards use px sizes and nothing checks them | Audit 2 | fixed 1.6.2 (AUD-01) |
| F-21 | `detect-theme` computed fields nothing showed; the reference promised one of them | Audit 2 | fixed 1.6.2 (AUD-02) |
| F-22 | The repo's own `.github/` block reads as the rules for work on the repo | Audit 2 | fixed 1.6.2 (AUD-07); moving the payload to `template/` is open |
| F-23 | `list.md` set sizes Fluent sets (selection column, row heights) | Audit 2 | fixed 1.6.2 (AUD-08) |
| F-24 | Command in a markdown table copied with `\|` | Audit 2 | fixed 1.6.2 (AUD-06) |
| F-25 | Scaffold named the app after its folder | Audit 2 | fixed 1.6.2 (`--title`, AUD-15) |
| F-26 | Examples never rendered in CI | Audit 2 | fixed 1.6.2 (AUD-09) |
| F-27 | Scaffold tested on Linux only | Audit 2 | fixed 1.6.2 (AUD-15 on Windows and macOS in CI) |
| F-28 | app-nav example had no way to open the nav under 1024px | AUD-09, first run | fixed 1.6.2 (AUD-09) |
| F-29 | status-grid example: "Unknown" status read "All checks fine"; collapsed group rows too tall on phones | AUD-09, first run | fixed 1.6.2 (AUD-09) |
| F-30 | Scaffold ran two installs; the Copilot turn ended while it ran | Copilot run 1 | fixed 1.6.2 (one install; the card says to wait for `Done:`) |
| F-31 | `@fluentui/react-charts` crashes server rendering in Next.js; the kit did not say so | Copilot run 1 | fixed 1.6.2 (dashboard card, context Next.js line) |
| F-32 | A dev server stayed on port 3000 after an interrupted check | Copilot run 1 | fixed 1.6.2 (verify records and clears it) |
| F-33 | The agent ran `tsc` itself next to `--finish` | Copilot run 1 | fixed 1.6.2 (the block says what `--finish` runs) |
| F-34 | `verify.mjs` (13K tokens) and `check.mjs` (8K) do too many jobs | Audit 1, 2 | open: split; AUD-04 stops growth meanwhile |
| F-35 | Two lint engines (`check.mjs` and ESLint) implement the same rules | Audit 1, 2 | open |
| F-36 | Benchmark tooling exists; the benchmark has one run | Audit 1, 2 | open (MAN-01) |
| F-37 | Not published to npm (`npx github:` downloads the whole repo) | Audit 2 | open |
| F-38 | No card for detail page, wizard, search results, sign-in, upload, chart-heavy analytics | Audit 2 | open (MAN-04) |
| F-39 | The always-on block loads on every Copilot request, UI or not | Audit 2 | open: try a path-scoped `.instructions.md` |
| F-40 | Copilot may not see the contact sheet, so the visual critique does not happen there | Copilot run 1 | open (MAN-03) |
| F-41 | `new-app.md` still carries a manual path for a starter that already has a `package.json` | Audit 2 | open: `scaffold.mjs --adopt` |

## Runs

| Date | Agent | Prompt | Result | Credits | Time |
|---|---|---|---|---|---|
| 2026-11-04 | Claude (author's assistant), kit 1.6.0 | build an api monitor dashboard (empty folder) | correct after 4 finish runs; found F-13 to F-19 | n/a | 8m 45s |
| 2026-11-04 | Claude (author's assistant), kit 1.6.1 | same | correct on the first finish run | n/a | 3m 16s |
| 2026-11-04 | Copilot, Claude Sonnet 5.5, kit 1.6.1, Windows, Next.js | same | correct, 0 errors on 6 renders; 2 turns (the first ended while the scaffold ran); found F-30 to F-33; Windows PATH lost `node` (machine, not kit) | 29.5 + 65.1 = 94.6 | 9m 18s + 9m 9s = 18m 27s |
