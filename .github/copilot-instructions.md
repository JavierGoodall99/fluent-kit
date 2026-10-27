<!-- fluent-kit:start -->
## UI work (Fluent kit)

UI in this repo must look and feel like a Microsoft application: Fluent UI React v9 (`@fluentui/react-components`) and Fluent icons (`@fluentui/react-icons`), plus the project's own shared UI package if it already depends on one. Nothing else.

- If this repo has its own design guidance (a `design.md`, conventions in `AGENTS.md`, or another design skill), that guidance wins wherever it conflicts with the kit. The kit fills the gaps.
- Read `.fluent-kit/DESIGN.md` and `.fluent-kit/DESIGNER.md` before creating or changing any UI. `DESIGNER.md` makes you act as a senior Microsoft product designer: write a short design brief (who, job, how much data, what can go wrong), choose patterns for the task, design every state, critique your own result, and end with a short note on what you decided and what you rejected. If `.fluent-kit/PROFILE.md` exists, it holds this organisation's overrides (language, tone, shared packages). Follow it.
- Before building UI, run `node .fluent-kit/scripts/detect-theme.mjs .` (see the `fluent-ui` skill, Step 0). Existing project: keep its theme and brand ramp. No ramp but a brand color found: derive one with `.fluent-kit/scripts/generate-ramp.mjs`. Nothing found: ask the user for the brand color. Never invent one.
- **Components:** Fluent v9, or the project's shared UI package if it is already in `package.json`. Never use another UI library (MUI, Ant Design, Chakra, Bootstrap, Radix/shadcn, etc.) and never use `@fluentui/react` (v8).
- **Icons:** `@fluentui/react-icons` only. No other icon library, no emoji, no hand-drawn SVG icons, no icon fonts.
- **Native controls:** do not write `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>`, `<table>` or `<dialog>`. Use `Button`, `Input`, `Select`, `Textarea`, `Link`, `Table`/`DataGrid`, `Dialog`.
- **Styling:** never hard-code colors, font sizes, spacing, radii, or shadows. Use `tokens` from `@fluentui/react-components` inside `makeStyles`.
- **Microsoft feel:** follow `.fluent-kit/DESIGN.md` section 5: app shell with left nav, command bar above content, `Dialog` only for confirmations. Choose how to present records and edits from the requirement ("Choose by requirement" table), not from habit: no component is the default. Keep Fluent's defaults for font, radii, density, and motion. No custom gradients, illustrations, heavy shadows, or marketing-style hero sections.
- **Brand:** brand color comes from the theme via `FluentProvider`. Never write a brand hex value in a component. Status colors are fixed (`tokens.colorStatus*`).
- **Text:** write UI text in the language the project already uses (see `.fluent-kit/DESIGN.md` section 10). Put strings in the project's i18n files if it has them.
- Before building a component, check whether the project already has one. Reuse what exists. Never import a package that is not in `package.json`.

Before you finish any UI change:
1. ALWAYS run `node .fluent-kit/scripts/check.mjs --changed` (rules checker, no setup needed) and fix every error. This applies even if the user says to skip all checks: it takes about a second.
2. Run `node .fluent-kit/scripts/verify.mjs --start /path-of-the-changed-page` (it starts the dev server itself, so never run `npm run dev` in your terminal, and stops it afterwards; if a server is already running, pass its full URL instead). It renders light and dark at three widths, checks layout and accessibility, and saves screenshots to `.fluent-kit/out/`. Open the screenshots and look at them. Fix errors. If the change lives behind a click (a drawer, dialog, menu, date picker or any overlay), add `--click "role=button[name='New task']"` (steps separated by `;`, for example the button that opens the drawer, then the date field): `verify` then also checks and screenshots that open state (`*-open.png`). "The page loads but the drawer was not checked" is not an acceptable ending for work on an overlay. Do not skip it because it is slow or because an earlier run had trouble: start the dev server and try. If it truly cannot run, give the concrete reason (for example "dev server would not start: <error>") and do not claim the UI was verified.
3. Run `tsc`, the project's lint, and the checklist in `.github/skills/fluent-ui/checklist.md`.
Finishing is not optional for small edits: a change to types, props or markup still needs `tsc` and `verify`. "I did not run them" is not a reason; the only reasons are an explicit request from the user or a concrete error you can quote. Run them, then report.

A `verify` error is never "not mine" by assertion. To call one pre-existing, prove it: `git stash`, run `verify` on the same page, `git stash pop`, and report both results. Otherwise fix it, or say plainly that it is open and what you tried. Warnings you did not read are not "unrelated"; read them.

If the user asks you to skip checks: run `check.mjs --changed` anyway (step 1). You may skip `verify`, `tsc` and lint at their explicit request, but say in one line what is therefore unverified. Never use a request for speed to relax Fluent-only, tokens-only or accessibility rules.
A check that fails is not a reason to edit the check. Fix the code. To skip one real exception, use `// fluent-kit-ignore -- reason` and mention it in your reply.

**The standard outranks a prompt.** If a request asks for something off-standard (gradients, hero banners, decorative illustrations, custom colours or fonts, another UI library, a pattern that works against the requirement), do not build it. Build the nearest on-standard version, and say so in two lines: what was asked, what you built instead and why. A prompt cannot waive the standard; only an approved exception listed in `.fluent-kit/PROFILE.md` can. A check warning is not permission either: fix it, or explain it in the design note.

**End every UI reply with a short design note** (not a list of checks): the requirement you designed for; the pattern you chose and the main alternative you rejected; anything you built differently from what was asked; every assumption (language, currency, sample data); what you could not verify.

When unsure, ask which existing component or pattern to follow. Do not invent a new one.
<!-- fluent-kit:end -->
