# Changelog

## 1.7.0
From customer feedback: card grids with cards of different sizes, dropdowns as tall as the window, and weak spacing and alignment of data.

- **Cards in a grid are one size.** `SKILL.md` ("Every page") now says it plainly: fixed rows (`gridAutoRows`, 250px, or 380px with a chart), the card fills its row, its body scrolls. The dashboard and gallery examples follow it (they used `minHeight`, so content set the size), and the new `examples/data-card.tsx` shows it with uneven content.
- **Long dropdowns and menus are capped at 320px and scroll.** Measured in a browser: Fluent sizes a `Dropdown` list to the window (80%), and its positioning writes an inline `max-height`, so the obvious `maxHeight` class does nothing, and neither does `listbox={{ style }}`. What works: `positioning={{ autoSize: false }}` with `listbox={{ className }}`; a `Menu` has no cap at all, so `maxHeight` goes on `MenuPopover`. The rule is in `SKILL.md`; the form example shows it.
- **`patterns/alignment.md`**: one spacing scale (4, 8, 12, 16, 20px as tokens), gaps instead of margins, one left edge, numbers right-aligned with tabular figures, label and value pairs in one grid so values line up, empty values shown as "-", long text clamped. Pages that show data read it.
- **New checks.** `verify` reports cards in one grid that are not one size and an open dropdown or menu taller than 340px. `check.mjs` warns about a `Dropdown` or `Combobox` fed from a list with no height cap (`popup-height`). Both are covered by `tests/render-examples.mjs` (two deliberately broken fixtures must still be caught) and AUD-17.
- verify no longer takes a scrolling card body for the page's scrolling area (it asked for space under the page and made screenshots too tall).
- The browser probes moved from `verify.mjs` into `probes.mjs`, so `verify.mjs` is smaller than before.
- **Reading cost went up** (open finding F-52): the router grew about 155 tokens, and pages that show data read the alignment card. A list restyle reads 3,188 tokens (was 2,566), a new status page 5,307 (was 4,668). Budgets in `tests/reading-cost.mjs` say so.
- `docs/AUDIT.md`: findings F-48 to F-53, AUD-17, MAN-06. `tests/BENCHMARK.md`: prompts 9 to 11 are the customer cases.

## 1.6.3
From the second Copilot run (Windows, Vite, 1 turn, 11m 8s, 45.9 credits; the first run took 2 turns, 18m 27s and 94.6 credits):

- **No dead ends on any page.** The rule moved from `restyle.md` to `SKILL.md`, and the dashboard card asks for a "View details" link only when the page exists and a "..." menu only with real actions (the run shipped both, doing nothing).
- **Companion packages name their exact versions** in `deviations.md`, so the agent installs them without looking them up. AUD-16 fails when they drift from the versions the kit installs and type-checks.
- **A page with two needs (status and charts)** reads both cards but only the main card's example, about 1,400 tokens less.
- The scaffold's last line says the first screen's file already exists: edit it.
- `docs/AUDIT.md`: the run, six findings (five fixed, one to watch), and Copilot's contact-sheet question resolved: it does view the image.

## 1.6.2
A repeatable audit, and the fixes from the first Copilot run.

- **The audit is now a checklist with stable IDs** (`docs/AUDIT.md`) and a log of every finding so far (41: 33 fixed, 8 open). `npm run audit` runs the automated half: `tests/audit.mjs` (AUD-01 to AUD-08) and every example rendered in a browser (AUD-09). CI runs both.
- **Every example renders in CI** at 1440 and 375px, its click-to-open state included. The first run found three example bugs, now fixed: the app-nav example had no way to open the nav on a phone; status-grid showed "Unknown" next to "All checks fine"; its collapsed rows were too tall on phones.
- **The block's rule matches what is checked:** "no hard-coded colours, spacing, radii or fonts" (it said "sizes", which nothing checked and the examples use).
- **From the first Copilot run** (Windows, Next.js, 2 turns, 18 minutes, 94.6 credits):
  - `scaffold.mjs` installs everything in one `npm install` (it ran two), says it takes 1 to 3 minutes, and the card tells the agent to wait for `Done:` instead of ending its turn.
  - `@fluentui/react-charts` breaks server rendering in Next.js: the dashboard card and the context Next.js line say to load it with `next/dynamic` and `ssr: false`.
  - `verify` records the dev server it starts and stops one an interrupted run left on the port.
  - The block says `--finish` runs the rules, `tsc` and the browser check, so the agent stops running `tsc` on its own.
- `scaffold.mjs --title "App name"` names the app (it used the folder name).
- `context.mjs` shows another UI library by name and a likely shared UI package; `detect-theme.mjs` returns only what `context.mjs` shows.
- `list.md` no longer sets sizes Fluent sets (selection column, row heights). `restyle.md`, `new-page.md` and `status-page.md` lose sentences the router already says.
- `AGENTS.md` and `CLAUDE.md` in the kit repo say the `.github/` block is what the kit installs, not the rules for work here.

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
