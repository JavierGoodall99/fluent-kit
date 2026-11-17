# Fluent kit reference

For people setting the kit up for a team, or changing it. Every script also prints its own usage with `--help` (or in its header comment).

## Install options

`npx github:JavierGoodall99/fluent-kit [target] [options]`. The target defaults to the current folder; an empty folder works too. From a clone, `node install.mjs [target]` does the same. `--help` lists every option.

- `--profile <name>`: copy `.fluent-kit/profiles/<name>.md` to `.fluent-kit/PROFILE.md` (organisation overrides: language, tone, shared packages).
- `--brand stock` or `--brand #rrggbb`: record the brand decision in `.fluent-kit/brand.json`, so the agent never asks.
- `--claude`: also install for Claude Code (the rules block in `CLAUDE.md`, the skill in `.claude/skills/fluent-ui/`, which Copilot reads too). Automatic when the repo has `CLAUDE.md` or `.claude/`. Using only Copilot in such a repo: add `--skills-dir .github/skills`.
- `--agents`: the rules block goes in `AGENTS.md` (Codex, Cursor, Copilot's coding agent). `copilot-instructions.md` then holds a one-line pointer and `CLAUDE.md` an `@AGENTS.md` import, so no agent loads the block twice. Automatic when `AGENTS.md` exists.
- `--with-deps`: set up the browser check without asking (`playwright-core` and `axe-core` into `.fluent-kit/deps`; Chromium only when Edge or Chrome is missing). Same as `node .fluent-kit/scripts/verify.mjs --setup` later.
- `--ci`: write `.github/workflows/fluent-kit.yml`, a pull-request check that runs the rules whether or not the agent did.
- `--hooks`: a git pre-commit hook that runs `check.mjs --changed`.
- `--wire`: an npm script `ui:check`.
- `--dry-run`: show what would change.

Safe to run again. It replaces kit files, removes files a newer version no longer ships (listed in `.fluent-kit/manifest.json`), never touches `PROFILE.md`, `brand.json`, `baseline.json`, `config.json`, `verify-ignore.json` or `.fluent-kit/deps`, and only replaces its own marked block in `copilot-instructions.md`, `CLAUDE.md` and `AGENTS.md`.

By hand: copy `.fluent-kit/` and `.github/skills/` into the repo root and paste the block between the `fluent-kit` markers from `.github/copilot-instructions.md` into your instruction file. Check that your Copilot version supports Agent Skills; the instruction file works without it.

## How a task runs

1. **Always on:** a block of about 250 tokens: the rules no script can check, and which file to read next.
2. **One router:** `SKILL.md` sends the agent to one task card (`small-fix`, `restyle`, `new-page`, `new-app`, `migrate-v8`) and at most one pattern card. A small fix reads about 700 tokens before its first edit, a restyle about 2,500, a new page 3,000 to 4,700.
3. **One context call:** `node .fluent-kit/scripts/context.mjs <restyle|new-page|new-app|migrate>` prints the theme, brand (with the one command that applies it), language, `PROFILE.md` and the app's card style.
4. **One finishing command:** `node .fluent-kit/scripts/check.mjs --finish --page /path`.

`tests/reading-cost.mjs` keeps each route under a token budget in CI.

## The finishing command

`check.mjs --finish` runs the rules on the changed files, then `tsc` (the project's `typecheck` script, `tsc -b` for project references, or `tsc --noEmit`; TypeScript 5 to 7), then the browser check, and stops at the first failure. It sizes the browser check itself, so the agent never chooses flags:

| Change | Browser check |
|---|---|
| comments, types, formatting | none |
| only text or icons, 20 lines or fewer | none; the agent says it was not checked in a browser |
| colour, border, shadow, appearance, size, spacing, layout | 1440 and 375px, light |
| a new UI file | 1440, 768 and 375px, light and dark |

`--click "role=button[name='...']"` also opens a drawer, dialog or menu and checks it. `--no-verify` is only for when the person asked to skip checks; it is ignored when size, spacing, width or layout changed. In a Next.js app the page is read from the changed `app/**/page.tsx` when `--page` is left out.

**`verify.mjs`** starts the dev server (`dev` script, or `--cmd`), opens the page in a real browser, saves screenshots and one `contact-sheet.png` to `.fluent-kit/out/`, and reports in three levels:

- **ERROR** (must fix): no `FluentProvider`, sideways page scroll, controls cut off, console errors, serious accessibility problems, an empty page. An app that crashes on load is reported once, as the crash, with nothing else checked.
- **warn** (fix if the change caused it): a control drawn over text, cards in one grid that are not one size, a dropdown or menu taller than 340px when open (`--click` opens it), a scrolling area still on the browser's default scrollbar, font, tiny controls, containers that scroll sideways on a phone, non-Fluent controls, minor accessibility problems.
- **Advisory** (judgement calls, named in the agent's note, never a reason to re-run): long lines, words on the first screen, flat cards, repeated text, space at the bottom, dark mode.

Each problem names the first-screen screenshot that shows it. If verify cannot run it prints `NOT RUN`, and the agent says the UI was not verified; it never installs packages itself.

Sign-in: the first run that lands on a sign-in page opens Edge on `.verify-profile` (added to `.gitignore`). `verify.mjs --login http://localhost:5173` signs in without running a check. `--no-login` (and CI) never opens a window. Also: `--profile <folder>`, `--storage auth.json`, `--headed`. Known app-wide issues go in `.fluent-kit/verify-ignore.json`.

## The rules check

`check.mjs` (no dependencies) reports hard-coded colours, spacing and fonts; other UI or icon libraries; Fluent v8; native `<button>`, `<input>`, `<select>`, `<a>`, `<table>` and friends; Fluent `Select` and `Input type="date|time|range"`; inline styles; icon-only buttons without a name; `<img>` without alt; gradients; `tokens.colorPalette*` as decoration (errors); Tailwind colour classes and style libraries, and a `Dropdown`, `Combobox` or long `Menu` fed from a list with no height cap (warnings, and `::-webkit-scrollbar` styling (warnings). Exit code 1 on errors.

- `--changed`: only files changed in git. `--json`: machine-readable.
- `--baseline`: record today's findings in `.fluent-kit/baseline.json`; later runs fail only on new ones. Use it once in a repo with old violations.
- One real exception: `// fluent-kit-ignore -- reason`. The project's own shared UI package: `{"allow": ["@company/ui"]}` in `.fluent-kit/config.json`.
- What counts as banned or hard-coded lives in `.fluent-kit/rules.json`, shared by the checker, theme detection and both lint rules.

For other CI systems (Azure DevOps, GitLab), run `node .fluent-kit/scripts/check.mjs` in a step.

## Existing repos and new ones

`context.mjs` runs `detect-theme.mjs` (cached in `.fluent-kit/context.json`) and reports the theme (existing v9 ramp, stock theme, v8, another UI library, or nothing), a brand colour when there is no ramp (`colorBrandBackground` override, v8 `themePrimary`, variables named brand/primary/accent, or the most-used saturated colour), the UI language (html `lang`, i18n library, locale files), the repo's own design guidance, and possible shared UI packages. It never invents a brand colour: several candidates or none, and the agent asks. An existing project's theme is never changed as a side effect.

An empty folder (or one holding only the kit): `node .fluent-kit/scripts/scaffold.mjs --brand <#hex|stock> --lang <code> [--title "App name"] [--next]` creates a Vite (or Next.js App Router) + TypeScript app next to the kit's files, installs it with Fluent, writes the theme and wraps the app, without the starter's demo styling. Starters refuse a folder that is not empty (and their `--overwrite` would delete the kit), so it builds in a subfolder and moves the files up.

`make-theme.mjs` writes a theme and provider for Vite or Next.js App Router (it also removes the browser's default body margin, which otherwise leaves a white frame around the page, and themes every scrollbar: thin, with a thumb from `colorNeutralStrokeAccessible`, Fluent's dropdowns and menus included); `generate-ramp.mjs` builds the 16-step ramp (your colour at step 80, Microsoft's curve, contrast checks). For Microsoft's blue it reproduces the default ramp exactly. An official ramp from a designer always wins.

Fluent v8 apps migrate screen by screen (`tasks/migrate-v8.md`): baseline the v8 imports, v9 provider around the v8 one, a v8-to-v9 component table, v8 removed when no screen uses it.

## Organisation profile

Rules that belong to an organisation, not to Fluent (UI language, formal or informal address, a shared UI package, approved exceptions) go in `.fluent-kit/PROFILE.md`, started from `.fluent-kit/profiles/_template.md`. It overrides the kit. `profiles/acme-nl.md` is an example (Dutch UI text, formal "u").

## Lint (optional, ESLint v9 or v10)

```js
// eslint.config.js (combine with your typescript-eslint config)
import fluentKit from "./.fluent-kit/eslint/no-hardcoded-styles.js";
import fluentOnly from "./.fluent-kit/eslint/fluent-only.cjs";

export default [
  ...fluentOnly,
  { files: ["**/*.{ts,tsx}"], plugins: { "fluent-kit": fluentKit }, rules: { "fluent-kit/no-hardcoded-styles": "error" } },
  { files: ["**/theme.{ts,tsx}"], rules: { "fluent-kit/no-hardcoded-styles": "off" } }, // the brand ramp is the one place raw hex is allowed
];
```

Named colours (`"red"`) and border widths like `"1px solid"` are not checked. A genuine exception needs an inline `eslint-disable-next-line` with a reason.

## What's in the kit

```
.github/copilot-instructions.md       always-on block (the installer also writes it to CLAUDE.md / AGENTS.md)
.github/skills/fluent-ui/             (or .claude/skills/fluent-ui/)
  SKILL.md                            router, page basics, type roles
  tasks/                              small-fix, restyle, new-page, new-app, migrate-v8
  patterns/                           list, status-page, dashboard, alignment, form, settings, drawer, nav, feedback
  deviations.md                       icons, styling, overflowing toolbars, companion packages
  examples/*.tsx                      type-checked skeletons, 150 lines at most, each named by its card
.fluent-kit/
  scripts/check.mjs, verify.mjs       the rules check and the browser check (verify --setup, --login)
  scripts/probes.mjs                  what verify asks the page: control over text, uneven card grids, tall popups, default scrollbars
  scripts/context.mjs                 one call at the start of a task
  scripts/scaffold.mjs                a new app in an empty folder, ready for the first screen
  scripts/detect-theme.mjs, consistency.mjs, generate-ramp.mjs, make-theme.mjs, doctor.mjs, lib.mjs
  eslint/                             the two lint rules
  rules.json                          banned libraries, native elements, what counts as hard-coded
  profiles/_template.md               organisation profile template
```

Repo only: `tests/` (CI checks, reading-cost budget, the audit checks, every example rendered, installer and scaffold smoke tests, benchmark protocol and recorder), `docs/AUDIT.md` (the audit checklist and findings log), `AGENTS.md` (for work on the kit itself), `docs/` (this file, and `docs/history/`: earlier test rounds and source notes, not current guidance).

## Known limits

- Instructions are guidance; `check.mjs`, the lint rules, `tsc` and `verify` are what enforce them. "Feels like a Microsoft application" is enforced indirectly: Fluent components, Fluent defaults and the pattern cards. Review screenshots against Microsoft 365 or the Azure portal.
- React only; Fluent UI React v9 is the target. Not Angular, Vue or Blazor.
- Tested on small projects and one pilot app; the benchmark in `tests/BENCHMARK.md` has not been run by people outside the project yet.
- Component guidance paraphrases Microsoft's Fluent 2 Web Figma community kit, checked against `@fluentui/react-components` 9.74.x. Not affiliated with or endorsed by Microsoft.
