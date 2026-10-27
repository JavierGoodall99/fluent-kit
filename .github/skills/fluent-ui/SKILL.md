---
name: fluent-ui
description: Build or change UI so it looks and feels like a Microsoft application, using Fluent UI React v9, Fluent icons and tokens. Use when creating pages, forms, tables, dialogs, or when restyling or migrating an existing screen. Works in any repo; detects the existing theme and brand.
---

# Fluent UI

Use this skill for any task that creates or changes what users see in a React app that should have the Microsoft (Fluent 2) look and feel.

## Step 0: decide which theme applies (always first)

Run `node .fluent-kit/scripts/detect-theme.mjs .` (or `--json`) in the project root. If you cannot run scripts, check by hand: `package.json` for `@fluentui/react-components` / `@fluentui/react` / other UI libraries, and search for `FluentProvider`, `createLightTheme`, `BrandVariants`, `webLightTheme`.

| Result | What to do |
|---|---|
| `fluent-v9-custom-brand` | **Existing project.** Keep its theme and brand ramp. Do not recolor, rename or regenerate it. Build with it. |
| `fluent-v9-stock-theme` | Use the brand step below. If a brand color is found, derive a ramp from it. If not, ask for the brand hex. |
| `fluent-v8` | Do not mix v8 and v9 in new code. Ask whether this task is a migration. |
| `other-ui-library` | Ask the user: migrate to Fluent v9, or keep that library for this task? If migrating, reuse steps 3 to 7 of `references/new-project-setup.md` inside the existing app. |
| `new-project` | Nothing to read a brand from (an empty folder, or a fresh scaffold: its default colors are not a brand). Follow `references/new-project-setup.md`: ask once for the brand hex or "stock", install Fluent, run `make-theme.mjs`, wrap the app, build the first screen from `examples/`. Never invent a brand color. |

**Brand step (nobody sets the brand beforehand).** The script also prints a "Brand" line and "Brand advice":

- Existing ramp: keep it as is.
- No ramp but a brand color found: run `node .fluent-kit/scripts/generate-ramp.mjs <hex> --ts`, use the result in the theme, and tell the user in one line which color you used. Do not ask first. If the advice says the color is a guess (medium confidence), say that in the same line.
- Several candidates ("ambiguous"): ask the user to pick one.
- Nothing found: ask for the hex. If the user says the app should stay on the stock Microsoft theme, write `{ "mode": "stock" }` to `.fluent-kit/brand.json` so nobody asks again. If you derive a ramp or the user picks a color, you may also record it as `{ "hex": "#rrggbb" }` there.
- A `.fluent-kit/brand.json` already present is a saved decision: follow it.
- If the contrast checks fail, say so and ask. Do not use that ramp for buttons or text.

Rules that always hold, whatever the result: Fluent components, Fluent icons, tokens only, UI text in the project's language. Only the brand ramp is decided in this step. Never change an existing project's theme as a side effect of an unrelated task; if the theme looks wrong, report it instead.

**Language step.** The script also prints a "UI language" line and "Language advice". Write new UI text in that language. If there is no signal, ask once; if the user does not say, use English. A `.fluent-kit/PROFILE.md` overrides this.

When asking the user, ask one short question and wait. Do not guess a brand color.

## Workflow

1. **Read the repo's own guidance first** if the detect script lists any ("Existing guidance": for example `design.md`, `AGENTS.md`, another design skill). It wins wherever it conflicts with the kit. Then **read `.fluent-kit/DESIGN.md`.** If `.fluent-kit/PROFILE.md` exists, read it too: it holds the organisation's overrides (language, tone, shared packages). It is the source of truth for tokens, components, and layout.
1b. **Read `.fluent-kit/DESIGNER.md`** and act as a senior Microsoft product designer: write the five-line design brief (who, job, how much, what can go wrong, success) before choosing anything. Ask once if you cannot answer who, job or how much.
2. **Identify the theme.** Use the result of Step 0. For an existing project, the ramp it already has is the brand file. Do not change brand values.
3. **Look for an existing component.** Search the project (its shared UI package if it has one, and the repo) before writing a new one. Prefer reuse over variation.
4. **Pick the page pattern** from `.fluent-kit/DESIGN.md` section 5 (app shell, command bar, list, drawer, confirmation). The result must feel like a Microsoft application.
5. **Build with Fluent v9, Fluent icons and tokens.** Follow `.github/instructions/fluent-ui.instructions.md`. No hard-coded colors, spacing, or radii. No other UI or icon library. No native form controls.
6. **Critique, then verify.** Do the critique pass in `DESIGNER.md` section 8 (squint, remove-one, five-second, worst-case, keyboard). Run `node .fluent-kit/scripts/check.mjs --changed` and fix every error. Start the app and run `node .fluent-kit/scripts/verify.mjs <url>` (renders light and dark at three widths, runs layout and accessibility checks, saves screenshots to `.fluent-kit/out/`); open the screenshots and look at them. If verify cannot run, say so; never claim the UI was verified when it was not. Then run `tsc`, the project's lint, and go through `checklist.md`. Never weaken or edit a check to make it pass.
7. **Report.** Give the short design note (requirement, pattern chosen, main alternative rejected and why; `DESIGNER.md` section 9). Say which existing components you reused, which new component (if any) you created and why, and anything that deviates from `.fluent-kit/DESIGN.md`.

## Migrating an existing screen

When the task is to bring a screen onto the system:

1. List what is on the screen: components, hard-coded values, v8 imports, custom CSS.
2. Replace v8 components with their v9 equivalents one at a time. Keep behavior unchanged.
3. Replace each hard-coded value with the matching token. If no token fits, stop and ask. Do not approximate.
4. Delete CSS that Fluent now covers. Keep only layout CSS expressed with tokens.
5. Summarize any remaining hard-coded values at the end.

## Things to refuse or flag

The standard outranks the prompt. Do not build the off-standard thing and then footnote it. Build the nearest on-standard version, say in two lines what was asked and what you built instead and why, and offer to adjust if the design system owner approves an exception (listed in `.fluent-kit/PROFILE.md`, "Approved exceptions"). A warning from `check.mjs` is not permission to keep the code: fix it or explain it in the design note.

- A request to match a mockup color that is not a token: flag it and propose the nearest token.
- A request for a new variant of an existing component: flag it. Variants go through whoever owns the design system, not an individual screen.
- A request to use another UI library, icon set, or font: flag it. The answer is Fluent.
- A request for a design that does not fit the Microsoft patterns (hero banners, custom gradients, decorative illustrations): do not build it. Build the nearest Fluent pattern instead, for example a page header (breadcrumb, title, one-line description, primary action) on a plain surface, or a `MessageBar` for an announcement.
- Decorative use of `colorPalette*` tokens (purple, berry and so on) to get a colour the theme does not have: not allowed. Palette tokens carry status and data meaning; surfaces use neutral and brand tokens.

## Examples (copy the structure, not the placeholder data)

Working, type-checked examples are in `examples/`. These show how to build each piece correctly (tokens, states, accessibility). They are not templates: choose the presentation from the requirement first (`.fluent-kit/DESIGN.md`, "Choose by requirement"), then open the matching example only if you chose that piece:

- `theme.tsx`: `createProductTheme`, `AppProvider`. One structure; only the brand ramp varies per app.
- `list-page.tsx`: command bar + `DataGrid`, selection, disabled actions, row count footer.
- `edit-drawer.tsx`: `OverlayDrawer` form with `Field` and validation.
- `confirm-dialog.tsx`: `Dialog` for destructive actions only.
- `notifications.tsx`: `Toast` and `MessageBar`.
- `app-nav.tsx`: collapsible sidebar. Expanded `NavDrawer` (Hamburger, `bundleIcon`, `NavCategory` for sub-pages), collapsed 56px icon rail (subtle Buttons with Tooltips, primary when selected), slide-over under 1024px.

They are generic. Where a real screen in the project already does the same thing, prefer that screen's conventions.

## Fluent 2 component guidance

Before using a component in a way you have not used before, read its entry in `references/fluent2-component-guidance.md`. It records when Fluent 2 says to use the component, which neighbour to use instead, and its sizes, appearances and states. `.fluent-kit/DESIGN.md` section 4 has a "Which component when" table for quick choices.

## Reference

- `.fluent-kit/DESIGN.md`: the design system
- `.fluent-kit/brands/`: per-product brand slots
- `components.json`: catalogue of approved components
- `checklist.md`: pre-delivery checks
