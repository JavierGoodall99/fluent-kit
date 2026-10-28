# Fluent kit for GitHub Copilot and Claude Code

Makes GitHub Copilot (and other coding agents) build React UI with the Microsoft look and feel, the same way every time: Fluent UI React v9 components, Fluent icons only, design tokens only, Fluent 2 page patterns. It works in any repo, inside a company or outside. Each app keeps its own brand color; nothing else varies.

It is guidance plus a few scripts. It does not need a build step or a service. The browser check (`verify.mjs`) needs Playwright and axe-core in your project; the installer tells you, or installs them with `--with-deps`.

## Install

From the root of your repo:

```
npx github:JavierGoodall99/fluent-kit
```

Or point it at another folder (an empty folder works too):

```
npx github:JavierGoodall99/fluent-kit /path/to/your-repo
```

Needs Node 18 or newer. No npm account or registry package is involved; npx fetches the kit straight from GitHub. If you clone the repo instead, `node install.mjs [target]` does the same thing. The target defaults to the current folder.

Options:

- `--profile <name>`: also set organisation overrides (language, tone, shared packages) from `.fluent-kit/profiles/<name>.md`. Without it, defaults apply.
- `--brand stock` or `--brand #rrggbb`: record the brand decision in `.fluent-kit/brand.json` (`stock` keeps the stock Microsoft theme, so the agent never asks for a brand color).
- `--claude`: also install for Claude Code: the rules block in `CLAUDE.md` and the skill in `.claude/skills/fluent-ui/`. Automatic when the repo already has `CLAUDE.md` or a `.claude/` folder.
- `--agents`: also add the rules block to `AGENTS.md`, which Copilot's coding agent, Codex, Cursor and other agents read. Automatic (kept in sync) when `AGENTS.md` already exists.
- `--with-deps`: also install what `verify.mjs` needs: `playwright` and `axe-core` as dev dependencies, then the Chromium browser (about 150 MB). Without it the installer only prints the command.
- `--hooks`: also install a git pre-commit hook that runs `check.mjs --changed`.
- `--wire`: also add an npm script `ui:check` to `package.json`.
- `--dry-run`: show what would change.

Safe to run again to update. It replaces kit files, removes kit files a newer version no longer ships (it keeps a list in `.fluent-kit/manifest.json`), never touches your `PROFILE.md`, `brand.json` or `.fluent-kit/brands/` files, and only replaces its own marked block inside `copilot-instructions.md`, `CLAUDE.md` and `AGENTS.md` (the rest of those files stays yours).

By hand: copy `.fluent-kit/` and `.github/skills/` into the repo root (for Claude Code, also copy `.github/skills/fluent-ui/` to `.claude/skills/fluent-ui/`) and paste the block between the `fluent-kit` markers from `.github/copilot-instructions.md` into your own instruction file.

Then commit what it installed. Copilot reads `.github/` and Claude Code reads `CLAUDE.md` and `.claude/` on their own. Check that your Copilot version supports Agent Skills (`.github/skills/`); the instructions files work without it.

## What it does in an existing repo and in a new one

When Copilot starts UI work, the `fluent-ui` skill tells it to run `.fluent-kit/scripts/detect-theme.mjs`. The script reports:

- **Theme:** existing Fluent v9 brand ramp (kept as is), stock Microsoft theme, Fluent v8, another UI library, or nothing (new project).
- **Brand color:** if there is no ramp, it looks for a brand color (a `colorBrandBackground` override, variables named brand/primary/accent, or the most-used saturated color). `generate-ramp.mjs` then builds the 16-step Fluent ramp from it. Several candidates: the agent asks which. Nothing found: the agent asks for the hex. It never invents one.
- **UI language:** from the html `lang`, an i18n library, or locale files. Nothing found: the agent asks once, then defaults to English.
- **Possible shared UI packages** (a name-pattern guess; the agent verifies).

An existing project's theme is never changed as a side effect of another task.

**New project** (an empty folder or a fresh scaffold): `.github/skills/fluent-ui/references/new-project-setup.md` walks the agent through it. Ask once for the brand hex or "stock"; install Fluent; `make-theme.mjs` writes a ready theme and provider (Vite, or Next.js App Router with server-rendering support); wrap the app; remove the scaffold's styling; build the first screen from an example. Tested from clean Vite and Next.js scaffolds: both type-check, build and render in the brand color.

`generate-ramp.mjs` puts your color at step 80 and follows Microsoft's ramp curve for the other steps. For Microsoft's own blue it reproduces Microsoft's default ramp exactly; for other colors it approximates Microsoft's Theme Designer. It checks contrast and flags ramps that fail. An official ramp from a designer always wins.

## Organisation profile (optional)

Some rules belong to an organisation, not to Fluent: the UI language, formal or informal address, the name of a shared UI package. Put them in `.fluent-kit/PROFILE.md` (start from `.fluent-kit/profiles/_template.md`). Agents read it and it overrides the defaults. `profiles/acme-nl.md` is an example (Dutch UI text, formal "u").

## What's in the kit

```
install.mjs                          the installer
.github/
  copilot-instructions.md            short always-on rules (the installer inserts the marked block here, and in CLAUDE.md / AGENTS.md)
  skills/fluent-ui/
    SKILL.md                         short router: request type -> one example + one measurement table
    deviations.md                    where the kit differs from stock Fluent v9 (controls, icons, styling, type, nav)
    checklist.md                     pre-delivery checks
    examples/*.tsx                   type-checked screens: theme, list, drawer, dialog, toast, nav
    references/fluent2-component-guidance.md   when to use each component, from the Fluent 2 Figma kit
    references/new-project-setup.md  step-by-step setup for a brand-new project
    references/measurements.md       page-pattern, component and narrow-screen numbers from Microsoft's Figma files
    references/theme-and-brand.md    theme, brand and language detection (read when not a custom-brand project)
    references/migrating.md          migrating a screen to Fluent v9
.fluent-kit/
  DESIGN.md                          the design system, agent-readable
  scripts/check.mjs, verify.mjs      the rules checker and the browser check
  scripts/login.mjs                  one-time sign-in for pages behind a login
  DESIGNER.md                        how to think like a senior Microsoft designer (brief, hierarchy, content, states, self-critique)
  PROFILE.md                         optional organisation overrides
  profiles/                          profile template and examples
  brands/_template.md                optional place to save brand ramps
  scripts/detect-theme.mjs           theme, brand and language detection
  scripts/generate-ramp.mjs          16-step brand ramp from one color, with contrast checks
  scripts/make-theme.mjs             writes a ready theme + provider file (brand hex or stock; --next for Next.js)
  scripts/scan-colors.mjs            lists every color a repo uses
  eslint/                            lint rules and tests
```

## Checks that run (no setup)

The agent is told to run these before it says it is done. You can run them too, and put the first one in CI.

```
node .fluent-kit/scripts/check.mjs --changed
node .fluent-kit/scripts/verify.mjs --start /invoices
```

- **`check.mjs`** scans your source for hard-coded colours, spacing and fonts, other UI or icon libraries, Fluent v8, native `<button>`/`<input>`/`<a>`/`<table>`, inline styles, icon-only buttons without a name, `<img>` without `alt`, gradients and `tokens.colorPalette*` decoration (errors), and Tailwind colour classes (warning). No dependencies, no ESLint needed. Exit code 1 on errors, so it works in CI, a pre-commit hook or an Azure DevOps step. `--changed` checks only files changed in git. Skip one real exception with `// fluent-kit-ignore -- reason`. Allow the project's own shared UI package with `{"allow": ["@company/ui"]}` in `.fluent-kit/config.json`.
- **Old code:** in a repo that already has violations, run `node .fluent-kit/scripts/check.mjs --baseline` once and commit `.fluent-kit/baseline.json`. From then on only new violations fail.
- **`verify.mjs`** starts your dev server (`--start`, using the `dev` script; or give a full URL if one is already running), opens the page in a real browser at 1440 and 375px in light mode (`--full` adds 768px and dark mode), saves screenshots plus one `contact-sheet.png` of every first screen to `.fluent-kit/out/`, and checks: Fluent is actually applied (`FluentProvider`), no sideways page scroll, no controls cut off, no console errors, non-Fluent controls in the rendered page, and accessibility with axe. Each problem names the screenshot that shows it, so the agent looks at one image instead of a dozen. Needs `npm i -D playwright axe-core` and `npx playwright install chromium` (or `--with-deps` at install; Edge or Chrome on the machine also works). If it cannot run it prints one line starting `NOT RUN`, and the agent must say verification was not done.

`install.mjs --wire` adds `"ui:check"` to your `package.json` scripts.

These catch what the agent ignores, not what nobody wrote a rule for. They do not judge taste: look at the screenshots.

## Pages behind a login (Microsoft sign-in, company policy, SSO)

`verify` needs to see the page. If your app asks you to sign in, or your company only allows sign-in from Edge or a managed device, do this once per project:

1. Start your app in one terminal (`npm run dev`).
2. In a second terminal, in the project folder: `node .fluent-kit/scripts/login.mjs`
   (another address? `node .fluent-kit/scripts/login.mjs http://localhost:3001`).
3. Edge opens. Sign in until your app shows. If the page you will change depends on a choice you make in the app (a tenant, a stage, a customer), pick one that has real data now: the profile remembers it, so `verify` sees the real page and not an empty one. Then close that Edge window.
4. Stop the dev server. Done.

From then on `node .fluent-kit/scripts/verify.mjs --start /` and Copilot's own checks use that signed-in Edge by themselves. Nothing to install, no extension, no flags.

- The sign-in lives in `.verify-profile/` in your project. It is your session, so the script adds it to `.gitignore`. Never commit or share it.
- When the session expires and the title `verify` prints says "Sign in", run `login.mjs` again.
- `verify` prints the page title for each screenshot. If it is not your app, the check looked at the wrong page.
- If Edge says it cannot open the profile, a window is still open on it: close all Edge windows opened by `login.mjs` and retry.
- **Known issues in your app shell** (for example a scrolling `<main>` that is not focusable) fail every page and make every `verify` exit with an error. List them once in `.fluent-kit/verify-ignore.json`, for example `["scrollable-region-focusable"]`, and fix them when you have time. `verify` then skips them, so Copilot stops chasing problems that are not in its page.
- Other ways: `--profile <folder>` to use another folder, `--storage auth.json` for a Playwright login file, `--headed` to watch the check run.
- Needs Microsoft Edge. Not tested on every company policy; if your policy rejects this profile too, the check cannot see the page and Copilot must say the UI was not verified.

## Lint setup (optional, needs ESLint v9)

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

## Known limits

- Instructions are guidance. The lint rules, `tsc` and the checklist are what enforce it.
- "Feels like a Microsoft application" is enforced only indirectly: Fluent components, Fluent defaults, and the page patterns in `DESIGN.md`. Review screenshots against Microsoft 365 or the Azure portal.
- React only. Fluent UI React v9 is the target; Angular, Vue and Blazor are not covered.
- The kit has been tested on small fake projects and with TypeScript and ESLint on its own examples, not yet on a large real repo.
- Keep the always-on block short (`tests/reading-cost.mjs` fails above 250 words). Long always-on files get ignored; detail lives in the skill.
- Component guidance paraphrases Microsoft's Fluent 2 Web Figma community kit, and checked against `@fluentui/react-components` 9.74.x. Fluent UI is MIT-licensed. This kit is not affiliated with or endorsed by Microsoft. Check the terms of the Figma community file before reusing the guidance outside this repo. The kit itself is released under the [MIT License](LICENSE).
- Organisation-level Copilot instructions exist but only apply to some Copilot surfaces, so keep the repo files as the source of truth.
