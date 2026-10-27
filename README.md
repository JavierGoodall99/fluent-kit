# Fluent kit for GitHub Copilot

Makes GitHub Copilot (and other coding agents) build React UI with the Microsoft look and feel, the same way every time: Fluent UI React v9 components, Fluent icons only, design tokens only, Fluent 2 page patterns. It works in any repo, inside a company or outside. Each app keeps its own brand color; nothing else varies.

It is guidance plus a few scripts. It does not need a build step, a package, or a service.

## Install

```
node install.mjs /path/to/your-repo
```

Options:

- `--profile <name>`: also set organisation overrides (language, tone, shared packages) from `.fluent-kit/profiles/<name>.md`. Without it, defaults apply.
- `--brand stock` or `--brand #rrggbb`: record the brand decision in `.fluent-kit/brand.json` (`stock` keeps the stock Microsoft theme, so the agent never asks for a brand color).
- `--agents`: also add the rules block to `AGENTS.md`, which Copilot's coding agent, Codex, Cursor and other agents read.
- `--dry-run`: show what would change.

Safe to run again to update. It replaces kit files, never touches your `PROFILE.md` or your `.fluent-kit/brands/` files, and only replaces its own marked block inside `.github/copilot-instructions.md` (the rest of that file stays yours).

By hand: copy `.fluent-kit/` and `.github/` into the repo root and paste the block between the `fluent-kit` markers from `.github/copilot-instructions.md` into your own file.

Then commit `.fluent-kit/` and `.github/`. Copilot reads `.github/` on its own. Check that your Copilot version supports Agent Skills (`.github/skills/`); the instructions files work without it.

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

Some rules belong to an organisation, not to Fluent: the UI language, formal or informal address, the name of a shared UI package. Put them in `.fluent-kit/PROFILE.md` (start from `.fluent-kit/profiles/_template.md`). Agents read it and it overrides the defaults. `profiles/databalk.md` is an example (Dutch UI text, formal "u").

## What's in the kit

```
install.mjs                          the installer
.github/
  copilot-instructions.md            short always-on rules (the installer inserts the marked block)
  instructions/fluent-ui.instructions.md   applies to *.ts, *.tsx, *.css
  skills/fluent-ui/
    SKILL.md                         on-demand workflow (build, migrate)
    checklist.md                     pre-delivery checks
    examples/*.tsx                   type-checked screens: theme, list, drawer, dialog, toast, nav
    references/fluent2-component-guidance.md   when to use each component, from the Fluent 2 Figma kit
    references/new-project-setup.md  step-by-step setup for a brand-new project
.fluent-kit/
  DESIGN.md                          the design system, agent-readable
  PROFILE.md                         optional organisation overrides
  profiles/                          profile template and examples
  brands/_template.md                optional place to save brand ramps
  scripts/detect-theme.mjs           theme, brand and language detection
  scripts/generate-ramp.mjs          16-step brand ramp from one color, with contrast checks
  scripts/make-theme.mjs             writes a ready theme + provider file (brand hex or stock; --next for Next.js)
  scripts/scan-colors.mjs            lists every color a repo uses
  eslint/                            lint rules and tests
```

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
- Keep `copilot-instructions.md` short. Long always-on files get ignored; detail lives in the path-specific file and the skill.
- Component guidance paraphrases Microsoft's Fluent 2 Web Figma community kit, and checked against `@fluentui/react-components` 9.74.x. Fluent UI is MIT-licensed. This kit is not affiliated with or endorsed by Microsoft. Check the terms of the Figma community file before reusing the guidance outside this repo. The kit itself is released under the [MIT License](LICENSE).
- Organisation-level Copilot instructions exist but only apply to some Copilot surfaces, so keep the repo files as the source of truth.
