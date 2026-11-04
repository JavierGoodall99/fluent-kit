# Changelog

## 1.6.1
From a backtest: an empty folder, the kit from `main`, the prompt "build an api monitor dashboard", and only the files the kit routes to. The agent got a correct dashboard, but these gaps cost it extra runs or would have shipped defects:

- **TypeScript 7 was never type-checked.** It no longer exports `typescript/bin/tsc`, so `--finish` said "TypeScript is not installed" for every new Vite app and a wrong icon import surfaced only as a crash in 6 browser renders. `tsc` is now found through the package's `bin`: the same mistake stops at `tsc` in about a second.
- **An empty folder was told to install Fluent into nothing.** `context.mjs` now says `Result: no package.json` and names one command: `node .fluent-kit/scripts/scaffold.mjs --brand <#hex|stock> --lang <code> [--next]`. It creates the app next to the kit's files (starters refuse a non-empty folder, and their `--overwrite` would delete the kit), installs Fluent, writes the theme, wraps the app and leaves out the demo styling. Tested with Vite and Next.js; `tests/scaffold-smoke.sh` runs in CI.
- **White frame around every new app.** The browser's default 8px body margin stayed after the starter's CSS was removed. The generated `AppProvider` now resets it.
- **The status-page example overlapped on phones.** Fluent fixes a `TableCell` at 44px; stacked as blocks, the Re-run button covered the error text. The example and the card now set `height: "auto"`.
- **verify did not see overlaps.** New warning when a control is drawn over text, also in the state `--click` opens (an open drawer or menu over the page does not count).
- **One crash, five findings.** An app that crashes on load is now one error, the console error, instead of also "no FluentProvider", "the page is empty" and accessibility landmarks.

## 1.6.0
Plug-and-play and cost pass, from a full audit of the kit.

- **One finishing command, no flags to choose.** `check.mjs --finish --page /path` sizes the check itself: no browser for comments, types or a text/icon edit of 20 lines or fewer (the agent says so); 1440 and 375px for colour, style or layout changes; the full check (three widths, light and dark) for a new UI file. `--full` and `--no-verify` still work; the task cards no longer mention them.
- **verify output in three levels.** ERROR (must fix), warn (fix if your change caused it), and a separate Advisory list for judgement calls (long lines, words on the first screen, flat cards, repeated text, bottom space, dark mode) that never call for a re-run. Each problem points to the first-screen screenshot, which a model can read, instead of a full-page shot up to 7000px tall. Shorter critique.
- **verify's dependencies install privately.** `node .fluent-kit/scripts/verify.mjs --setup` (and the installer's prompt or `--with-deps`) puts `playwright-core` and `axe-core` in `.fluent-kit/deps`, uses the Edge or Chrome on the machine, and downloads Chromium only when neither is there. The project's `package.json` and lockfile are untouched. When Playwright is missing, the agent is told not to install packages and to give the person that command.
- **`verify.mjs --login <url>`** replaces `login.mjs` (removed on update).
- **Migrate route fixed.** `context.mjs migrate` no longer tells the agent to ask whether this is a migration or to read `tasks/new-app.md`; a v8 `themePrimary` is detected as the brand.
- **One way to apply a brand.** The Brand line names the one command for the project (`make-theme.mjs`, or `generate-ramp.mjs --ts` when a v9 provider exists); `new-app.md` and `migrate-v8.md` defer to it.
- **No second routing.** `context.mjs` no longer ends with "Next: read ..." (the card that ran it is what the agent reads next); the unused `small-fix` route is gone.
- **Always-on block 435 → 249 tokens.** Rules the checker enforces (native controls) and the long `--no-verify` policy (the command now decides) are out of it; one clause keeps "skip the checks" honest (rules still run).
- **Each rule in one place.** The type roles and the card style live in `SKILL.md`; pattern cards name roles instead of pixel sizes, and no longer repeat Fluent's own defaults (drawer and dialog sizes, padding, shadows and titles, MessageBar and DataGrid row heights). Section descriptions are `fontSizeBase300` and captions `fontSizeBase200` everywhere (`SKILL.md`, `form.md` and `settings.md` disagreed).
- **Broken pointers fixed.** `check.mjs` names `deviations.md` in the folder the skill was installed to (it always said `.github/skills/`); verify's flat-card warning pointed to a "Surfaces" section that did not exist.
- **With `--agents`, Copilot no longer loads the block twice:** `copilot-instructions.md` gets a one-line pointer to `AGENTS.md`.
- **One definition of "hard-coded".** `check.mjs` and the ESLint rule read colour functions, hex digits and spacing properties from `rules.json` (the checker missed the logical `paddingBlockStart` family).
- **Shared helpers** (`scripts/lib.mjs`): package manager, Playwright, axe-core and browser detection in one place for install, check, verify and doctor.
- **Less shipped:** the lint rules' tests and the unused `examples/theme.tsx` stay out of projects; `detect-theme.mjs` prints JSON only (`context.mjs` is the summary).
- **Repo:** README is a quick start; the reference moved to `docs/REFERENCE.md`; the 2026-10 test transcripts, scorecard and Figma notes moved to `docs/history/`, marked as not current. Reading-cost budgets lowered to lock in the savings.

### Also in 1.6.0 (earlier unreleased work)
- `check.mjs --finish` ignores `--no-verify` when the change touches a size, spacing, width or layout setting, adds or removes a component (icons excepted), or adds or deletes a UI file. It says so in its summary line and runs the browser check. Text, colour and icon edits still skip it.
- Installer `--ci` writes `.github/workflows/fluent-kit.yml`, a pull-request check that runs the rules whether or not the agent ran its own.
- `doctor.mjs`: `node .fluent-kit/scripts/doctor.mjs` checks an install and its environment and prints one line per finding (ok, warn or FIX) with the command that fixes it: kit and skill files present and unedited, one copy of the skill, the always-on block pointing at the right folder, Fluent v9, TypeScript, Playwright, axe-core and Chromium, the package manager on PATH, a `dev` script, git history, valid local JSON, and `.verify-profile` kept out of git. Exit code 1 when something needs fixing.
- The always-on block no longer says `--no-verify` is for a "prop" change (a size is a prop); it is for a small fix to only an icon, text or colour, and any size, spacing, width or layout change gets the browser check.
- verify on a sign-in page reports only that, skips the other renders and checks (they described the identity provider's page, not the app), and prints the `login.mjs` command with the dev server's address.
- verify keeps the real keychain (macOS) and password store (Linux) for `.verify-profile`, so the session `login.mjs` saved is readable and the profile no longer looks signed out.
- verify on macOS and Linux removes a stale profile lock left by a crashed or killed Edge and retries; when another Edge still holds the profile, it names the process and says to quit it (Cmd+Q on a Mac, where closing the window leaves Edge running).
- `login.mjs` and the README say to answer Yes to "Stay signed in?" and, on a Mac, to quit Edge with Cmd+Q.
- verify recognises a Fluent v8 page (`ms-` component classes): no FluentProvider is a warning that says not to convert the app, and the non-Fluent control count says how many are v8.
- verify reports MSAL `interaction_in_progress` as a warning with the app-side fix, not as a console error the agent chases in a UI task.
- New route `tasks/migrate-v8.md` for moving an app from Fluent v8 to v9 screen by screen: baseline the existing v8 imports, put the v9 provider around the v8 one, a v8-to-v9 component table, when a screen counts as done, and the final removal of v8. The router, `new-app.md`, theme detection and verify point to it.
- Sign-in without a separate step: when verify lands on a sign-in page (not in CI, not with `--no-login`), it opens a visible Edge on `.verify-profile` (added to `.gitignore`), waits for the person to sign in, and checks again; later runs reuse the session. `login.mjs` stays as the manual way.
- The installer asks, in a terminal, whether to install Playwright and axe-core, and skips the 150 MB Chromium download when Edge or Chrome is on the machine (verify uses them). doctor no longer flags a missing Chromium in that case.

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
