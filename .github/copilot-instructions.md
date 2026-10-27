<!-- fluent-kit:start -->
## UI work (Fluent kit)

UI in this repo must look and feel like a Microsoft application: Fluent UI React v9 (`@fluentui/react-components`) and Fluent icons (`@fluentui/react-icons`), plus the project's own shared UI package if it already depends on one. Nothing else.

- If this repo has its own design guidance (a `design.md`, conventions in `AGENTS.md`, or another design skill), that guidance wins wherever it conflicts with the kit. The kit fills the gaps.
- Read `.fluent-kit/DESIGN.md` before creating or changing any UI. If `.fluent-kit/PROFILE.md` exists, it holds this organisation's overrides (language, tone, shared packages). Follow it.
- Before building UI, run `node .fluent-kit/scripts/detect-theme.mjs .` (see the `fluent-ui` skill, Step 0). Existing project: keep its theme and brand ramp. No ramp but a brand color found: derive one with `.fluent-kit/scripts/generate-ramp.mjs`. Nothing found: ask the user for the brand color. Never invent one.
- **Components:** Fluent v9, or the project's shared UI package if it is already in `package.json`. Never use another UI library (MUI, Ant Design, Chakra, Bootstrap, Radix/shadcn, etc.) and never use `@fluentui/react` (v8).
- **Icons:** `@fluentui/react-icons` only. No other icon library, no emoji, no hand-drawn SVG icons, no icon fonts.
- **Native controls:** do not write `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>`, `<table>` or `<dialog>`. Use `Button`, `Input`, `Select`, `Textarea`, `Link`, `Table`/`DataGrid`, `Dialog`.
- **Styling:** never hard-code colors, font sizes, spacing, radii, or shadows. Use `tokens` from `@fluentui/react-components` inside `makeStyles`.
- **Microsoft feel:** follow the layout patterns in `.fluent-kit/DESIGN.md` section 5 (app shell with left nav, command bar above content, `DataGrid` for lists, side drawer for details, `Dialog` only for confirmations). Keep Fluent's defaults for font, radii, density, and motion. No custom gradients, illustrations, heavy shadows, or marketing-style hero sections.
- **Brand:** brand color comes from the theme via `FluentProvider`. Never write a brand hex value in a component. Status colors are fixed (`tokens.colorStatus*`).
- **Text:** write UI text in the language the project already uses (see `.fluent-kit/DESIGN.md` section 10). Put strings in the project's i18n files if it has them.
- Before building a component, check whether the project already has one. Reuse what exists. Never import a package that is not in `package.json`.

Before you finish any UI change, run the checklist in `.github/skills/fluent-ui/checklist.md`, the lint rules if the project has them, and `tsc`. Fix failures before presenting the result.

When unsure, ask which existing component or pattern to follow. Do not invent a new one.
<!-- fluent-kit:end -->
