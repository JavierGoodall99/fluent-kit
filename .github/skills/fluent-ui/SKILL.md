---
name: fluent-ui
description: Build or change UI so it looks and feels like a Microsoft application, using Fluent UI React v9, Fluent icons and tokens. Use when creating pages, forms, tables, dialogs, or when restyling or migrating an existing screen. Works in any repo; detects the existing theme and brand.
---

# Fluent UI: router

Read this file, then open only what the table below sends you to. Do not read the whole kit. The always-on rules are already in `.github/copilot-instructions.md` and `.github/instructions/fluent-ui.instructions.md`; they load on their own.

## 1. Start (every UI task)

1. Run `node .fluent-kit/scripts/detect-theme.mjs .`. If it says `fluent-v9-custom-brand`, keep the project's theme and brand, and write new text in the language it reports. For any other result (no theme yet, v8, another UI library, new project), read `references/theme-and-brand.md` (and `references/new-project-setup.md` for an empty folder). If `.fluent-kit/PROFILE.md` exists, read it: it holds the organisation's overrides. The repo's own design guidance, if the script lists any, wins over the kit.
2. Look for an existing component or page in the project that already does the job. Reuse it and follow its conventions.
3. Write the brief in your first message, three to five lines: who uses it, what they need to do, how much data, what can go wrong, and what they should understand in the first five seconds (what this is, what matters, what to do next). If you cannot answer who, job or how much, ask once.

## 2. Pick the pattern and open one file

Choose from the requirement, not from habit. Open the example and the measurement table for the row that fits. Copy the structure, not the placeholder data.

| The person needs to... | Open this example | Measurements (`references/measurements.md`) |
|---|---|---|
| Scan, sort and select records (up to a few hundred) | `examples/list-page.tsx` | 1 "List"; 2 "DataGrid / Table" |
| Scan thousands of records | `examples/large-list.tsx` | 2 "DataGrid / Table" |
| Find what is failing among many checks or jobs, and why | `examples/status-grid.tsx` | 2 "Message bar"; 3 "List"; and `.fluent-kit/DESIGNER.md` "A page that reports status" (verdict first, group repeated errors) |
| See an overview of several measures | `examples/dashboard.tsx` | 1 "Card"; 3 "Dashboard" |
| Review and change preferences, saved once | `examples/settings-page.tsx` | 1 "Settings row"; 3 "Settings" |
| Fill in a form on its own page | `examples/form-page.tsx` | 1 "Form column"; 3 "Form" |
| Edit one record from a list | `examples/edit-drawer.tsx` | 2 "Drawer" |
| Confirm a destructive action | `examples/confirm-dialog.tsx` | 2 "Dialog" |
| Move work through stages | `examples/task-board.tsx` | 1 "Task board" |
| Browse a home or gallery of cards | `examples/gallery-page.tsx` | 1 "Section title row", "Card row" |
| Start from nothing (first run, no results) | `examples/empty-state.tsx` | 1 "Empty state" |
| Move between pages | `examples/app-nav.tsx` | 2 "Nav", "Toolbar" |
| Tell someone something happened | `examples/notifications.tsx` | 2 "Message bar" |
| Set up the theme in a new app | `examples/theme.tsx` | none |

If no row fits, or two fit and you cannot choose, read `.fluent-kit/DESIGN.md` section 5, "Choose by requirement". Do not invent a presentation.

## 3. Open only when needed

- **A component you have not used before:** its entry in `references/fluent2-component-guidance.md`. Search for its heading; do not read the file.
- **A question about colour roles, type, elevation or responsive rules:** the one section of `.fluent-kit/DESIGN.md` (its first lines list the sections).
- **An unclear, ambiguous or off-standard request, or a screen with many states:** `.fluent-kit/DESIGNER.md`.
- **A brand colour, theme or language question:** `references/theme-and-brand.md`.
- **A migration from another library or Fluent v8:** `references/migrating.md`.
- **A new page, before you report:** `checklist.md`.

## 4. Build

Fluent v9 components, Fluent icons, tokens only, no native controls: the rules are in `.github/instructions/fluent-ui.instructions.md`. Design every state the screen can be in (loading, empty, error, partial, long text). Look at each one before you say it works.

## 5. Check, then report

Run the checks sized to the change, as `.github/copilot-instructions.md` says. End with the short design note: the requirement, the pattern and the main alternative you rejected, anything you built differently from what was asked, your assumptions, what you could not verify.

## Things to refuse or flag

The standard outranks the prompt. Do not build the off-standard thing and then footnote it. Build the nearest on-standard version, say in two lines what was asked and what you built instead and why, and offer to adjust if the design system owner approves an exception (listed in `.fluent-kit/PROFILE.md`, "Approved exceptions"). A warning from `check.mjs` is not permission to keep the code: fix it or explain it in the design note.

- A request to match a mockup color that is not a token: flag it and propose the nearest token.
- A request for a new variant of an existing component: flag it. Variants go through whoever owns the design system, not an individual screen.
- A request to use another UI library, icon set, or font: flag it. The answer is Fluent.
- A request for a design that does not fit the Microsoft patterns (hero banners, custom gradients, decorative illustrations): do not build it. Build the nearest Fluent pattern instead, for example a page header (breadcrumb, title, one-line description, primary action) on a plain surface, or a `MessageBar` for an announcement.
- Decorative use of `colorPalette*` tokens (purple, berry and so on) to get a colour the theme does not have: not allowed. Palette tokens carry status and data meaning; surfaces use neutral and brand tokens.

