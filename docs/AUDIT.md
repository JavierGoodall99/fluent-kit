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
| AUD-09 | Every example renders clean at 1440 and 375px: no errors, no control over text, no uneven card grid, its click-to-open state too (the form's dropdown is opened and measured); two bad fixtures must still be caught | `tests/render-examples.mjs` |
| AUD-10 | Reading cost per route stays within budget | `tests/reading-cost.mjs` |
| AUD-11 | Agent-facing files point only at files that exist; every example is named by a card | `tests/links.mjs` |
| AUD-12 | `--finish` sizes the check, stops at the first failure, finds `tsc` (TypeScript 5 to 7) | `tests/check-finish.test.mjs` |
| AUD-13 | `context.mjs` routes correctly: empty folder, new app, migrate, cache | `tests/context.test.mjs` |
| AUD-14 | Installer: one skill copy, blocks in the right files, old files removed, repo-only files not shipped | `tests/installer-smoke.sh` |
| AUD-15 | Empty folder to a type-checked Fluent app with one command (Linux, Windows, macOS) | `tests/scaffold-smoke.sh` |
| AUD-16 | The companion versions `deviations.md` pins are the ones the kit installs and checks against | `tests/audit.mjs` |
| AUD-17 | Examples size card grids with fixed rows; `check.mjs` flags an uncapped list-fed `Dropdown` and not a capped one | `tests/audit.mjs` |
| AUD-18 | The scrollbar rule is identical in the generated provider, the line `context.mjs` prints and the demo the examples render with | `tests/audit.mjs` |

## Manual checks

| ID | Check | How |
|---|---|---|
| MAN-01 | Cost and time with Copilot | `tests/BENCHMARK.md`: vague prompts, fresh chat, record credits, time and the 6 quality checks |
| MAN-02 | Someone who did not build the kit installs it and asks for one page | Note every question they ask and every place they get stuck |
| MAN-03 | A person looks at the contact sheets of the last runs | Copilot may not see images: the browser checks are then the only visual gate |
| MAN-04 | Pattern coverage | List the screens asked for in the last runs that no card covers |
| MAN-05 | A first read of the repo as a new contributor | Open the repo cold: is it clear what ships and what is for work here? |
| MAN-06 | Customer cases with a real agent | `tests/BENCHMARK.md` prompts 9 to 11: a card grid with uneven content, a form with a 300-option dropdown, spacing and alignment. A person checks the cards are one size, the list scrolls at 320px, numbers line up on the right |

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
| F-40 | Copilot may not see the contact sheet, so the visual critique does not happen there | Copilot run 1 | resolved: Copilot run 2 viewed it ("Viewed image"); MAN-03 stays for a person's look |
| F-41 | `new-app.md` still carries a manual path for a starter that already has a `package.json` | Audit 2 | open: `scaffold.mjs --adopt` |
| F-42 | The dashboard card asked for a "View details" link and a "..." menu with nothing behind them; the app shipped both dead | Copilot run 2 | fixed 1.6.3 (only when a page or real actions exist) |
| F-43 | "No dead ends" lived only in `restyle.md`, so new pages did not get it | Copilot run 2 | fixed 1.6.3 (`SKILL.md`, every page) |
| F-44 | The agent ran `npm view` to find a version to pin | Copilot run 2 | fixed 1.6.3 (`deviations.md` names exact versions; AUD-16) |
| F-45 | A status page with charts read both cards and both examples (about 1,400 tokens more) | Copilot run 2 | fixed 1.6.3 (`new-page.md`: only the main card's example) |
| F-46 | The agent tried to create `src/App.tsx`, which the scaffold had made | Copilot run 2 | fixed 1.6.3 (the scaffold's Done line says to edit it) |
| F-47 | `context.mjs` ran twice: PowerShell showed no output the first time | Copilot run 2 | open: watch in the next runs (terminal, not the kit) |
| F-48 | Cards in a grid took the height of their content, so they differed in size; the only rule was one line in the dashboard card and two examples used `minHeight` | Customer feedback 1 | fixed 1.7.0 (`SKILL.md` rule, fixed rows in the dashboard, gallery and data-card examples, verify grid probe; AUD-09, AUD-17) |
| F-49 | A dropdown with a long list ran from the top to the bottom of the window. Fluent caps it at 80% of the window and its positioning writes an inline `max-height`, so a `maxHeight` class on the list does nothing; a `Menu` has no cap at all | Customer feedback 1 | fixed 1.7.0 (the working recipe in `SKILL.md`, measured in a browser; `check.mjs` `popup-height`; verify popup probe; the form example; AUD-09, AUD-17) |
| F-50 | Spacing and the alignment of data had no rules beyond each card's own pixel values | Customer feedback 1 | fixed 1.7.0 (`patterns/alignment.md`, `examples/data-card.tsx`); only partly machine-checked, so MAN-06 |
| F-51 | verify took a scrolling card body for the page's scrolling area: it asked for space under the page and made screenshots taller | found while fixing F-48 | fixed 1.7.0 (page-sized scrolling areas only; AUD-09) |
| F-52 | Reading cost grew: the router gained about 155 tokens on every route and pages that show data read the alignment card (list restyle 2566 to 3188 tokens, new status page 4668 to 5307) | 1.7.0 | open: measure quality against credits in MAN-01; F-39 (a path-scoped block) is the other lever |
| F-53 | Numbers right-aligned and label and value pairs lined up are judged by a person only | 1.7.0 | open (MAN-06) |
| F-54 | Scrollbars were the browser's default (thick, arrow buttons, a bright track in dark mode) in cards, lists and Fluent's dropdowns; the kit had no rule | Customer feedback 2 | fixed 1.7.1 (one global rule in the generated provider, a `context.mjs` line for an app without it, the `SKILL.md` rule, verify probe, `check.mjs` `scrollbar-style`; AUD-09, AUD-18) |
| F-55 | The page's own scrollbar sits outside the provider and cannot read tokens | 1.7.1 | partly fixed: new apps follow the system scheme (`color-scheme` in the generated provider); an existing app keeps its page scrollbar |
| F-56 | verify's screenshots hide scrollbars (Playwright's headless default), so the contact-sheet critique cannot see them | 1.7.1 | open: the probe checks the style instead; showing them would change layout widths |
| F-57 | Content ran flush against the scrollbar (customer screenshot: status text touching the track) | Customer feedback 2 | fixed 1.7.1 (`scrollbarGutter: "stable"` in the card rule and examples); not machine-checked |
| F-58 | Four examples printed verify warnings (links and buttons under 24px, a list that scrolled sideways on a phone), and the dashboard shipped a "..." button and a "View details" link with nothing behind them; `render-examples.mjs` let warnings pass | Token audit, 2026-11 | fixed 1.8.0 (examples fixed; render-examples fails on warnings; short links reported only when crowded, `bad-links` fixture) |
| F-59 | Every route reads the card before it runs `context.mjs`, one round trip more than needed; the finish command is written three times on each route | Token audit, 2026-11 | open: needs a real agent run to price a round trip |
| F-60 | Every finish run prints all problems and the critique again, 279 to 912 tokens a run | Token audit, 2026-11 | open: print only what changed from the second run |
| F-61 | From a monorepo root without React, `context.mjs` called the app a new project and gave an install command | Token audit, 2026-11 | fixed 1.8.0 (names the workspace package; `tests/context.test.mjs`) |
| F-62 | Scope and card uniformity at finish are prose only; old whole-page failures were both | Token audit, 2026-11 | open |
| F-63 | The dropdown cap recipe was read on every route (66 tokens) though `check.mjs` catches the miss | Token audit, 2026-11 | fixed 1.8.0 (recipe in the `popup-height` and verify messages; one line left in `SKILL.md`) |
| F-64 | Cards and examples disagreed: caption colour in `list.md`, `Tooltip` on icon-only buttons, a Regular status icon, 16px narrow padding no example used | Token audit, 2026-11 | fixed 1.8.0; one rule for status (badge or icon and label) still open |
| F-65 | verify cannot tell warnings a change caused from ones the page already had | Token audit, 2026-11; bench rerun #4 on 1.10 changed the shared `App.tsx` to clear the planted tab-bar error, with 8 verify calls | fixed 1.10.0 (`--finish` checks the committed page once per commit in a worktree; verify lists those problems apart and they never fail the run) |
| F-66 | The page wrapper, card style and page title are written again in every example; no shared components | Token audit, 2026-11 | open (roadmap: company shared components) |
| F-67 | The full v8 to v9 table is read on every migration | Token audit, 2026-11 | open |
| F-68 | `context.mjs` printed profile lines that said "none" or restated kit defaults; the dashboard example carried a third chart | Token audit, 2026-11 | fixed 1.8.0 |
| F-69 | CI failed AUD-09 on `main` since 1.7.0: the bad-grid fixture's short cards fit on one line with the runner's fonts (52px), under the grid probe's 60px floor, so the probe saw one row of equal cards | CI, 1.7.0 to 1.7.1 | fixed 1.8.0 (every fixture card wraps to 3 lines or more in any font) |
| F-70 | verify's cut-off probe missed text that overflows its own box inside a card, and never looked at tabs or table cells: the bench home page at 375px had all three and passed | Bench app, first scored run | fixed 1.9.0 (wider probe; `bad-clip` fixture) |
| F-71 | Agents passed the wrong `--page` in all three bench restyles: the app routes by hash, `/tenants` fell back to Home, and `/` is Home | Bench baseline, 2026-11-18 | fixed 1.10.0 (`context.mjs` prints a Pages line; `--finish` reads the app's router and checks the page of the changed file) |
| F-72 | verify missed table text that runs over the next cell, and a table mostly off screen at 375px was only a warning, which the agent called deliberate | Bench baseline, #4 | fixed 1.10.0 (cell-spill probe and wide-table error; restyle points to `patterns/list.md` Narrow; `bad-spill` and `bad-wide-table` fixtures) |
| F-73 | With the person's dev server on the port (Vite `strictPort`), verify could not start a server, and a full URL in `--finish --page` did not help | Bench baseline, #4 and #5 | fixed 1.10.0 (verify checks the server already on the busy port; `--finish --page` takes a full URL) |
| F-74 | A restyle dropped a column nobody asked about (the activity log's ID) | Bench baseline, #5 | fixed 1.10.0 (restyle card: keep every column, field and action) |
| F-75 | The bench scorer: a card that only gained a background failed Uniform; Dutch text with "of" counted as English; a new cut-off item merged into an old message was missed; its second verify met the first one's server; on Windows it deleted the app's `.fluent-kit/deps` through junctions | Bench baseline | fixed 1.10.0 |
| F-76 | The benchmark's route rule allowed one pattern card, but `SKILL.md` sends pages with values to `patterns/alignment.md` as well | Bench baseline, #4 | fixed 1.10.0 (`BENCHMARK.md` and `record-run.mjs` allow it) |
| F-77 | No agent opened the contact sheet in three runs, although verify asks for one look every time | Bench baseline | open (the machine checks above carry the load instead) |
| F-78 | verify gave up when the page was still loading after 30 s: the first start of the bench app's dev server after a reinstall timed out three times in a row, so the agent never saw its table errors | Bench rerun, #4 | fixed 1.10.0 (one more load, waiting for the load event only) |
| F-79 | No card asked for numbers formatted for the UI language: "€ 57573" and "4210 eenheden" in a Dutch app, where the baseline agent had written 57.573 by chance | Bench rerun on 1.10, #4 and #6 | fixed 1.10.0 (`patterns/alignment.md`: `Intl.NumberFormat`) |
| F-80 | Restyles rewrote whole pages: two created a `.new.tsx` copy, and after the card said "no new copy" one deleted the page with `Remove-Item` and recreated it, dropping the ID column again. Every scope failure of the day came from a whole-file rewrite | Bench reruns on 1.10, #4, #5, #6 | fixed 1.10.0 (restyle card: "small edits to the existing file: never write the whole file at once, never delete it, never make a copy") |
| F-81 | On a phone, five text buttons wrapped into four ragged rows above the tenants, and verify had nothing to report because nothing was cut off | Bench rerun on 1.10, #6 | fixed 1.10.0 (toolbar-wrap error at 480px and under; `bad-toolbar` fixture) |
| F-82 | A search hint longer than its box ("Zoek op gebruiker of huu") at both widths; verify does not read placeholders | Bench rerun on 1.10, #5 | fixed 1.10.0 (placeholder warning; `bad-placeholder` fixture) |
| F-83 | verify used any server on a busy port, so another project's Vite on 5173 could have been checked instead of the app | Bench rerun on 1.10, #6 (TradChart running) | fixed 1.10.0 (a server found on the port must serve the app's own `index.html` title) |
| F-84 | Each bench page opened with a comment naming its flaws ("a toolbar that is cut off on a phone (#6, #7)"), and agents read it first: every run until 2026-11-18 had the answer in front of it | Bench rerun on 1.10, #6 | fixed 1.10.0 (comments removed; the flaws are listed in `BENCHMARK.md`) |
| F-85 | The number-format line sat in `patterns/alignment.md`, which the restyle route does not require: neither #4 nor #6 read it in the second rerun | Bench rerun on 1.10b | fixed 1.10.0 (moved to `SKILL.md`, which every route but the small fix reads) |
| F-86 | A cut-off message named an icon-only button as "<button>" with nothing after it, and the agent spent four check rounds, a Playwright script of its own and a hidden dev server finding it (7m 52s, 48.3 credits) | Bench rerun on 1.10c, #6 | fixed 1.10.0 (no text: the aria-label, or the button's size and place on the screen) |
| F-87 | The restyle card said "changing a shared component other pages use: say which pages it affects", which read as permission: with the planted tab-bar error listed as already there, #4 still changed `App.tsx` and disclosed it | Bench rerun on 1.10c, #4 | fixed 1.10.0 (change only the page asked about; the shell, shared components and other pages stay, and the fix goes in the note) |
| F-88 | In a list of card rows, city, units and status started at a different x on every row (the badge had no fixed width), and the note still said "aligned columns" | Bench rerun on 1.10d, #6 | fixed 1.10.0 (warning when a cell's left and right edges both shift across rows at 1024px and wider; `bad-columns` fixture) |
| F-89 | A warning the change caused (a table that scrolls a little sideways at 375px) was neither fixed nor named in the note: warnings were the agent's to judge | Bench rerun on 1.10d, #5 | fixed 1.10.0 (with the page's old problems known, every other warning fails `--finish`, shown as NEW) |
| F-90 | The before-and-after comparison ignored numbers, so a page that now scrolls 71px sideways matched the original 239px and was listed as already there; the agent's note said both "no longer scrolls sideways" and "scrolls sideways by 71px" | Bench rerun on 1.10e, #5 | fixed 1.10.0 (for a page that scrolls sideways the amount counts: another amount is new) |
| F-91 | Tenant names broke inside the word on a phone ("Woonstichti / ng") after the agent set `overflowWrap: "anywhere"` to clear a cut-off, and verify passed it | Bench rerun on 1.10e, #4 | fixed 1.10.0 (warning for a word whose letters sit on two lines at 480px and under; `bad-broken-word` fixture) |
| F-92 | To clear warnings the agent shortened labels ("Gebruiker nieuw" for "Gebruiker toegevoegd") instead of changing the layout | Bench rerun on 1.10e, #4 | fixed 1.10.0 (restyle card: fix layout with layout; never shorten a label or break a word to clear a check) |
| F-93 | An agent wrote the whole page through a Node script (`writeFileSync`), which gets round "never write the whole file at once"; a diff cannot tell that from a thorough restyle | Bench rerun on 1.10e, #4 | open (the scope checks judge the result) |
| F-94 | On a phone the activity table kept three columns: badges wrapped into two-line pills, tenant names were cut to "…" in every row, and the filter's value sat on two lines. verify passed it: an ellipsis is a deliberate cut and the badges wrapped between words | Bench rerun on 1.10f, #5 | fixed 1.10.0 (warning for a badge, button or dropdown value on two text lines, and for a table column after the first cut with "…" in half its rows or more at 480px and under; `bad-pill` and `bad-cut-column` fixtures) |
| F-95 | Six toolbar controls on two lines at 375px passed the toolbar check (up to two lines), and the note said they "fit on one line" | Bench rerun on 1.10f, #6 | fixed 1.10.0 (four or more controls must fit on one line on a phone; extras go in an Overflow menu, as `patterns/list.md` says) |
| F-96 | New problems were printed as `NEW`, and an agent that filtered the output for "ERROR" never saw one (a cut-off search hint); its note said only an old error remained | Bench rerun on 1.10g, #6 | fixed 1.10.0 (printed as `ERROR (new)`) |
| F-97 | #5 dropped the ID column in three of eight runs, although the restyle card says to keep every column | Bench reruns on 1.10, #5 | fixed 1.10.0 (`--finish` compares the number of table columns at desktop width with the page before the change: fewer is an error). A renamed header is not caught: renaming "TS" to "Tijdstip" is the point of #5 |
| F-98 | With `--click` opening a Fluent Dropdown, axe's `region` rule flagged the open list, which Fluent renders in a portal outside the page's landmarks; under the new-warnings rule the agent could not fix it and stopped with the check failing | Bench rerun on 1.10g, #5 | fixed 1.10.0 (`region` findings inside a Fluent portal are dropped) |
| F-99 | No example showed a command bar that keeps one line on a phone, so agents reached it by trial: #6 took four check rounds (CSS, a matchMedia hook, flex) and 4m 20s | Bench rerun on 1.10g, #6 | fixed 1.10.0 (`examples/command-bar.tsx`: search plus actions in `Overflow`, extras in a "..." menu; `patterns/list.md` and the toolbar-wrap message point to it) |
| F-100 | verify took a dev server that exited right after printing its URL for "the one already running", so the check died with `ERR_CONNECTION_REFUSED` (4 times on one Windows machine short of memory: #4 1.10, #5 1.10b scorer, #6 1.10h agent and scorer). The agent never saw its page | Bench reruns, 1.10 to 1.10h | fixed 1.10.0 (verify uses an exited server's URL only if something answers there; otherwise it starts the server once more, also on a refused page load; `bench-setup.mjs` clears `node_modules/.vite` and stops what listens on 5173) |
| F-101 | An agent shortened its own badge labels to fit a phone, against the restyle card ("never shorten a label"); the scorer cannot see it | Bench stage 2, #5 run 2 (1.10i) | open, one run in six, known issue for 1.11 |

## Runs

| Date | Agent | Prompt | Result | Credits | Time |
|---|---|---|---|---|---|
| 2026-11-04 | Claude (author's assistant), kit 1.6.0 | build an api monitor dashboard (empty folder) | correct after 4 finish runs; found F-13 to F-19 | n/a | 8m 45s |
| 2026-11-04 | Claude (author's assistant), kit 1.6.1 | same | correct on the first finish run | n/a | 3m 16s |
| 2026-11-04 | Copilot, Claude Sonnet 5.5, kit 1.6.1, Windows, Next.js | same | correct, 0 errors on 6 renders; 2 turns (the first ended while the scaffold ran); found F-30 to F-33; Windows PATH lost `node` (machine, not kit) | 29.5 + 65.1 = 94.6 | 9m 18s + 9m 9s = 18m 27s |
| 2026-11-04 | Copilot, Claude Sonnet 5.5, kit 1.6.2, Windows, Vite | same | correct, 0 errors and 0 warnings on 6 renders, 1 turn, 2 finish runs, viewed the contact sheet; Dutch, stock theme; status page plus 3 dashboard cards; found F-42 to F-47 | 45.9 | 11m 8s |
