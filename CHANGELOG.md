# Changelog

## Unreleased
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
