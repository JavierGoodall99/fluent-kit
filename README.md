# Fluent kit

Makes GitHub Copilot (and Claude Code) build screens that look and feel like a Microsoft app, using Fluent UI. It gives the AI clear design rules, ready-made page layouts, and a check it runs on its own work, so every screen comes out the same way. Your app keeps its own brand colour.

## Install

You need [Node](https://nodejs.org) 18 or newer. In a terminal, in your project folder:

```
npx github:JavierGoodall99/fluent-kit
```

1. When it asks to install the browser check, answer **Y**. It uses the Edge or Chrome already on your computer.
2. Commit the files it added (`.github/` and `.fluent-kit/`).

That's it. Run the same command again any time to update.

## Use it

Ask Copilot for UI the way you normally would, for example:

- "Add an invoices page with a table of invoices"
- "Make the dashboard easier to understand"
- "Migrate the settings screen from Fluent v8 to v9"

Copilot follows the kit's rules and, when it is done, opens the page in a browser, checks it and fixes what it finds. You can run that check yourself:

```
node .fluent-kit/scripts/verify.mjs --start /invoices
```

## Apps that need a sign-in

The first time the check reaches a sign-in page, an Edge window opens.

1. Sign in until your app shows. Answer **Yes** to "Stay signed in?".
2. If your app asks you to pick a tenant, stage or customer, pick one with real data.
3. Close the window. The check carries on and remembers your sign-in next time.

Your sign-in is saved in `.verify-profile/` in your project and kept out of git. Never commit or share it.

## Something not working?

```
node .fluent-kit/scripts/doctor.mjs
```

It lists what is wrong and the command that fixes each thing. Common ones:

- **Playwright is not installed:** `npm install -D playwright axe-core`
- **Edge says the profile is in use:** close the Edge window the check opened (on a Mac, quit Edge with Cmd+Q) and try again.
- **The same problem in your app's header or menu fails every check:** list it in `.fluent-kit/verify-ignore.json`, for example `["color-contrast"]`, and fix it when you have time.

Still stuck? Include the doctor's output when you report the problem.

---

## Reference

The rest of this page is for people setting the kit up for a team, or changing it.

### Install options

The target folder defaults to the current one; `npx github:JavierGoodall99/fluent-kit /path/to/repo` installs elsewhere (an empty folder works too). No npm account or registry package is involved. From a clone, `node install.mjs [target]` does the same.

Options:

- `--profile <name>`: also set organisation overrides (language, tone, shared packages) from `.fluent-kit/profiles/<name>.md`. Without it, defaults apply.
- `--brand stock` or `--brand #rrggbb`: record the brand decision in `.fluent-kit/brand.json` (`stock` keeps the stock Microsoft theme, so the agent never asks for a brand color).
- `--claude`: also install for Claude Code: the rules block in `CLAUDE.md`, and the skill in `.claude/skills/fluent-ui/` instead of `.github/skills/`. Copilot reads both folders, so one copy serves both agents and Copilot never sees the skill twice. Automatic when the repo already has `CLAUDE.md` or a `.claude/` folder.
- `--skills-dir <dir>`: put the skill in `<dir>/fluent-ui/` instead (for example `.agents/skills`, or `.github/skills`). **Using only GitHub Copilot in a repo that has a `.claude/` folder or `CLAUDE.md`?** Pass `--skills-dir .github/skills`, so the skill sits in Copilot's own folder. The installer also removes an older copy of the skill from the other folders, so the agent never sees two.
- `--agents`: also add the rules block to `AGENTS.md`, which Copilot's coding agent, Codex, Cursor and other agents read. Automatic (kept in sync) when `AGENTS.md` already exists. With both, `CLAUDE.md` gets an `@AGENTS.md` import instead of a second copy of the block (nothing at all if it already imports `AGENTS.md`).
- `--with-deps`: also install what `verify.mjs` needs: `playwright` and `axe-core` as dev dependencies, plus the Chromium browser (about 150 MB) only when Edge or Chrome is not on the machine. Run from a terminal, the installer asks instead; in CI or a script it only prints the command.
- `--ci`: also write a GitHub Actions workflow that runs the rules on every pull request.
- `--hooks`: also install a git pre-commit hook that runs `check.mjs --changed`.
- `--wire`: also add an npm script `ui:check` to `package.json`.
- `--dry-run`: show what would change.

Safe to run again to update. It replaces kit files, removes kit files a newer version no longer ships (it keeps a list in `.fluent-kit/manifest.json`), never touches your `PROFILE.md` or `brand.json`, and only replaces its own marked block inside `copilot-instructions.md`, `CLAUDE.md` and `AGENTS.md` (the rest of those files stays yours).

By hand: copy `.fluent-kit/` and `.github/skills/` into the repo root (for Claude Code, put the skill in `.claude/skills/fluent-ui/` instead, and change the two skill paths in the block to match) and paste the block between the `fluent-kit` markers from `.github/copilot-instructions.md` into your own instruction file.

Then commit what it installed. Copilot reads `.github/` (and the skill from `.claude/skills/` too); Claude Code reads `CLAUDE.md` and `.claude/`. Check that your Copilot version supports Agent Skills (`.github/skills/`); the instructions files work without it.

### How a task runs

1. **Always on:** a block of under 250 words in `copilot-instructions.md` (and `CLAUDE.md` / `AGENTS.md`): the hard rules, and which file to read next.
2. **One router:** `SKILL.md` sends the agent to one task card (`small-fix`, `restyle`, `new-page`, `new-app`, `migrate-v8`) and at most one pattern card. A restyle reads about 2,700 tokens before its first edit, a small fix about 900.
3. **One context call:** `node .fluent-kit/scripts/context.mjs <route>` prints the theme, language, your `PROFILE.md` and the app's card style in one go.
4. **One finishing command:** `node .fluent-kit/scripts/check.mjs --finish --page /path` runs the rules, `tsc`, and the browser check (`verify.mjs`) only if something visible changed. The agent answers the critique it prints.

Reading cost per route is kept under a budget by `tests/reading-cost.mjs`, which CI runs.

### What it does in an existing repo and in a new one

`context.mjs` runs `.fluent-kit/scripts/detect-theme.mjs` for the agent (and caches the result). The script reports:

- **Theme:** existing Fluent v9 brand ramp (kept as is), stock Microsoft theme, Fluent v8, another UI library, or nothing (new project).
- **Brand color:** if there is no ramp, it looks for a brand color (a `colorBrandBackground` override, variables named brand/primary/accent, or the most-used saturated color). `generate-ramp.mjs` then builds the 16-step Fluent ramp from it. Several candidates: the agent asks which. Nothing found: the agent asks for the hex. It never invents one.
- **UI language:** from the html `lang`, an i18n library, or locale files. Nothing found: the agent asks once, then defaults to English.
- **Possible shared UI packages** (a name-pattern guess; the agent verifies).

An existing project's theme is never changed as a side effect of another task.

**New project** (an empty folder or a fresh scaffold): the skill's `tasks/new-app.md` walks the agent through it. Ask once for the brand hex or "stock"; install Fluent; `make-theme.mjs` writes a ready theme and provider (Vite, or Next.js App Router with server-rendering support); wrap the app; remove the scaffold's styling; build the first screen from an example. Tested from clean Vite and Next.js scaffolds: both type-check, build and render in the brand color.

**App on Fluent v8:** the agent asks whether the task is a migration. If it is, `tasks/migrate-v8.md` moves the app to v9 screen by screen: the v9 provider goes around the v8 one, existing v8 imports are tolerated by a baseline, each screen is swapped using a v8-to-v9 component table, and v8 is removed when no screen uses it.

`generate-ramp.mjs` puts your color at step 80 and follows Microsoft's ramp curve for the other steps. For Microsoft's own blue it reproduces Microsoft's default ramp exactly; for other colors it approximates Microsoft's Theme Designer. It checks contrast and flags ramps that fail. An official ramp from a designer always wins.

### Organisation profile (optional)

Some rules belong to an organisation, not to Fluent: the UI language, formal or informal address, the name of a shared UI package. Put them in `.fluent-kit/PROFILE.md` (start from `.fluent-kit/profiles/_template.md`). Agents read it and it overrides the defaults. `profiles/acme-nl.md` is an example (Dutch UI text, formal "u").

### What's in the kit

Installed into your repo:

```
.github/
  copilot-instructions.md            always-on rules, under 250 words (the installer inserts the marked block here, and in CLAUDE.md / AGENTS.md)
  skills/fluent-ui/                  (in .claude/skills/fluent-ui/ instead when Claude Code is used)
    SKILL.md                         the router: small fix, restyle, new page, new app -> one task card + one pattern card
    tasks/                           one card per kind of task: small-fix, restyle, new-page, new-app, migrate-v8
    patterns/                        one card per page pattern, with its measurements and narrow-screen rules:
                                     list, status-page, dashboard, form, settings, drawer, nav, feedback
    deviations.md                    where the kit differs from stock Fluent v9 (controls, icons, styling, type, nav)
    examples/*.tsx                   type-checked skeletons, 150 lines at most, each pointing to its pattern card
.fluent-kit/
  scripts/check.mjs, verify.mjs      the rules checker and the browser check
  scripts/login.mjs                  manual sign-in for pages behind a login (verify also opens Edge to sign in by itself)
  scripts/context.mjs <route>        one call at the start of a task: theme, brand, language, PROFILE.md, the app's
                                     standard card style and what to read next (cached in .fluent-kit/context.json)
  scripts/detect-theme.mjs           theme, brand and language detection
  scripts/consistency.mjs            the app's standard card style and the pages that differ
  scripts/generate-ramp.mjs          16-step brand ramp from one color, with contrast checks
  scripts/make-theme.mjs             writes a ready theme + provider file (brand hex or stock; --next for Next.js)
  eslint/                            lint rules and tests
  rules.json                         banned libraries and native elements, shared by check.mjs, detect-theme and the lint rules
  profiles/_template.md              organisation profile template
```

Kept in this repo only, not installed:

```
research/                            source notes the cards were built from: measurements.md (from Microsoft's Figma
                                     files) and fluent2-component-guidance.md. Agents never read them.
tests/                               reading-cost and link checks, the benchmark recorder (record-run.mjs), and the Copilot test logs
install.mjs, package.json            the installer, and dev dependencies for CI
```

### Checks that run (no setup)

The agent ends every task with one command, which you can run too:

```
node .fluent-kit/scripts/check.mjs --finish --page /invoices
```

It runs the rules on the changed files, then `tsc` (the project's `typecheck` script, `tsc -b` for project references, or `tsc --noEmit`), then `verify` on that page, and stops at the first step that fails. `verify` is skipped with one line when nothing visible changed (comments, types and formatting don't count) or when Playwright isn't installed, and the agent then has to say the UI was not verified. Add `--full` for a new page, `--click "role=button[name='...']"` for something behind a click, and `--no-verify` when you asked it to skip checks. In a Next.js app the page is read from the changed `app/**/page.tsx` when you leave out `--page`.

**`--no-verify` cannot skip a layout check.** It is for a small fix to an icon, text or colour. When the change touches a size, spacing, width or layout setting, adds or removes a component, or adds or deletes a UI file, `--finish` ignores `--no-verify`, says so in its summary line, and runs the browser check anyway. The agent's own judgement is not what decides.

**Enforcement that does not depend on the agent.** The agent's check only runs when the agent runs it. To fail a pull request on rule errors regardless, install with `--ci`: it writes `.github/workflows/fluent-kit.yml`, which runs `node .fluent-kit/scripts/check.mjs` on every pull request (exit code 1 on errors). For another CI system (Azure DevOps, GitLab), run that one command in a step. `--hooks` adds the same check as a git pre-commit hook. On a repo with old violations, run `check.mjs --baseline` once and commit `.fluent-kit/baseline.json`, so only new violations fail.

**Something not working?** Run `node .fluent-kit/scripts/doctor.mjs`. It changes nothing and prints one line per finding (`ok`, `warn`, `FIX`) with the command that fixes it: a second copy of the skill, an instruction block pointing at the wrong folder, a missing kit file, Playwright not installed, no browser for it (no Edge, Chrome or downloaded Chromium), the package manager missing from the shell's PATH, no `dev` script, no git commit, a `.verify-profile` that is not in `.gitignore`. Exit code 1 when something needs fixing; `--json` for tools. Attach its output when reporting a problem.

- **`check.mjs`** scans your source for hard-coded colours, spacing and fonts, other UI or icon libraries, Fluent v8, native `<button>`/`<input>`/`<a>`/`<table>`, inline styles, icon-only buttons without a name, `<img>` without `alt`, gradients and `tokens.colorPalette*` decoration (errors), and Tailwind colour classes (warning). No dependencies, no ESLint needed. Exit code 1 on errors, so it works in CI, a pre-commit hook or an Azure DevOps step. `--changed` checks only files changed in git. Skip one real exception with `// fluent-kit-ignore -- reason`. Allow the project's own shared UI package with `{"allow": ["@company/ui"]}` in `.fluent-kit/config.json`.
- **Old code:** in a repo that already has violations, run `node .fluent-kit/scripts/check.mjs --baseline` once and commit `.fluent-kit/baseline.json`. From then on only new violations fail.
- **`verify.mjs`** starts your dev server (`--start`, using the `dev` script; or give a full URL if one is already running), opens the page in a real browser at 1440 and 375px in light mode (`--full` adds 768px and dark mode), saves screenshots plus one `contact-sheet.png` of every first screen to `.fluent-kit/out/`, and checks: Fluent is actually applied (`FluentProvider`), no sideways page scroll, no controls cut off, no console errors, non-Fluent controls in the rendered page, and accessibility with axe. Each problem names the screenshot that shows it, so the agent looks at one image instead of a dozen. Every call also writes `verify-report.json` and appends to `verify-runs.jsonl` in the same folder (used by the benchmark). Needs `npm i -D playwright axe-core` (the installer offers it) and a browser: Edge or Chrome on the machine, or `npx playwright install chromium`. If it cannot run it prints one line starting `NOT RUN`, and the agent must say verification was not done.

`install.mjs --wire` adds `"ui:check"` to your `package.json` scripts.

These catch what the agent ignores, not what nobody wrote a rule for. They do not judge taste: look at the screenshots.

### Sign-in details

See "Apps that need a sign-in" above for the normal flow. The window closes by itself 30 seconds after your app shows, if you leave it open.

- When the session expires, the same window opens again. In CI, or with `--no-login`, `verify` does not open a window: it reports "This is a sign-in page" and checks nothing else.
- Sign in without running a check: start the app, then `node .fluent-kit/scripts/login.mjs http://localhost:5173` (your dev server's address), sign in, and close Edge (on a Mac, quit it with Cmd+Q).
- `verify` prints the page title for each screenshot. If it is not your app, the check looked at the wrong page.
- If Edge says it cannot open the profile, a window is still open on it: close all Edge windows opened by `login.mjs` and retry.
- **Known issues in your app shell** (for example a scrolling `<main>` that is not focusable) fail every page and make every `verify` exit with an error. List them once in `.fluent-kit/verify-ignore.json`, for example `["scrollable-region-focusable"]`, and fix them when you have time. `verify` then skips them, so Copilot stops chasing problems that are not in its page.
- Other ways: `--profile <folder>` to use another folder, `--storage auth.json` for a Playwright login file, `--headed` to watch the check run.
- Needs Microsoft Edge. Not tested on every company policy; if your policy rejects this profile too, the check cannot see the page and Copilot must say the UI was not verified.

### Lint setup (optional, ESLint v9 or v10)

```js
// eslint.config.js (combine with your typescript-eslint config)
import fluentKit from "./.fluent-kit/eslint/no-hardcoded-styles.js";
import fluentOnly from "./.fluent-kit/eslint/fluent-only.cjs";

export default [
  // ...your existing config
  ...fluentOnly,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "fluent-kit": fluentKit },
    rules: { "fluent-kit/no-hardcoded-styles": "error" },
  },
  {
    // The brand ramp is the one place raw hex is allowed: point this at your theme file(s).
    files: ["**/theme.{ts,tsx}"],
    rules: { "fluent-kit/no-hardcoded-styles": "off" },
  },
];
```

Run the tests with `node .fluent-kit/eslint/no-hardcoded-styles.test.js` and `node .fluent-kit/eslint/fluent-only.test.js`.

- **Fluent-only:** imports from MUI, Ant Design, Chakra, Bootstrap, Radix, Headless UI, Mantine and others are errors, as are other icon libraries (react-icons, lucide, heroicons, Font Awesome, and so on) and Fluent v8 (`@fluentui/react`, Northstar). Native `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>`, the `<table>` family, `<dialog>` and `<progress>` are errors.
- **Tokens-only:** hard-coded colors and raw spacing/radius values.

Limits: the banned-library lists are not exhaustive; add any your team has used. Named colors (`"red"`) and border widths like `"1px solid"` are not checked. A genuine exception (for example a hidden file input) needs an inline `eslint-disable-next-line` with a reason.

### Known limits

- Instructions are guidance. `check.mjs`, the lint rules, `tsc` and `verify` are what enforce it.
- "Feels like a Microsoft application" is enforced only indirectly: Fluent components, Fluent defaults, and the pattern cards. Review screenshots against Microsoft 365 or the Azure portal.
- React only. Fluent UI React v9 is the target; Angular, Vue and Blazor are not covered.
- The kit has been tested on small fake projects and with TypeScript and ESLint on its own examples, not yet on a large real repo.
- Keep the always-on block short (`tests/reading-cost.mjs` fails above 250 words). Long always-on files get ignored; detail lives in the skill.
- Component guidance paraphrases Microsoft's Fluent 2 Web Figma community kit, and checked against `@fluentui/react-components` 9.74.x. Fluent UI is MIT-licensed. This kit is not affiliated with or endorsed by Microsoft. Check the terms of the Figma community file before reusing the guidance outside this repo. The kit itself is released under the [MIT License](LICENSE).
- Organisation-level Copilot instructions exist but only apply to some Copilot surfaces, so keep the repo files as the source of truth.
