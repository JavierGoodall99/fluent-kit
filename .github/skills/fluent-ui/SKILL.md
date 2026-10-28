---
name: fluent-ui
description: Build or change UI so it looks and feels like a Microsoft application, using Fluent UI React v9, Fluent icons and tokens. Use when creating pages, forms, tables, dialogs, or when restyling or migrating an existing screen. Works in any repo; detects the existing theme and brand.
---

# Fluent UI: router

Read this file, then only what your row below names. The hard rules are in the always-on block (`copilot-instructions.md`, `CLAUDE.md` or `AGENTS.md`); kit-specific component and styling details are in `deviations.md`.

## 0. Triage first

A small fix (a prop, size, spacing, text, one control) does not need this skill: the always-on block covers it.

| Task | Read | Check before you finish | Reply |
|---|---|---|---|
| **Restyle** an existing page ("make it better", "update the UI/UX") | step 1, then `.fluent-kit/DESIGNER.md` sections 1 and 3 | `check --changed`, `tsc`, `verify --start /page` | brief first, design note last |
| **New component or section** on an existing page | steps 1 to 2 | `check --changed`, `tsc`, `verify --start /page` | brief first, design note last |
| **New page, shell or overlay** | steps 1 to 4 | `check --changed`, `tsc`, `verify --start /page --full` (adds dark mode and 768px), `--click` for anything behind a click | brief first, design note last |
| **New app** (empty folder or fresh scaffold) | `references/new-project-setup.md`, then the new-page row | as for a new page | brief first, design note last |

## 1. Start

1. Run `node .fluent-kit/scripts/detect-theme.mjs .`. A custom brand or the stock theme: keep it and write text in the language it reports. Fluent v8, another UI library, or no Fluent yet: read `references/theme-and-brand.md`. If `.fluent-kit/PROFILE.md` exists, read it. The repo's own design guidance, if listed, wins over the kit.
2. Find the existing component or page that does this job and reuse it. For anything card-like (KPI tiles, summary cards, panels) run `node .fluent-kit/scripts/consistency.mjs`: it names the app's standard card style and the pages that differ.
3. Brief (new page or restyle only), three to five lines: who uses it, the job, how much data, what can go wrong, what they see in the first five seconds. If you cannot answer who, job or how much, ask once.

## 2. Pick the pattern and open one example

Choose from the requirement, not from habit. Copy the structure, not the placeholder data.

| The person needs to... | Example | Measurements (`references/measurements.md`) |
|---|---|---|
| Scan, sort and select records (up to a few hundred) | `examples/list-page.tsx` | 1 "List"; 2 "DataGrid / Table" |
| Scan thousands of records | `examples/large-list.tsx` | 2 "DataGrid / Table" |
| Find what is failing among many checks or jobs, and why | `examples/status-grid.tsx` | 2 "Message bar"; 3 "List" |
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

No row fits, or two fit: read `.fluent-kit/DESIGN.md` section 5, "Choose by requirement". Do not invent a presentation.

## 3. Build

- Design every state: loading, empty, error, partial, long text.
- A status you show comes from real data: look at one real record of each kind (API sample, fixture, type, or ask) and name your basis in the note. Placeholders (`null`, `""`, `0`, an item named "Empty") usually mean "not set up". If every item would show the same badge, show it once in the header. Numbers shown together agree: derive a percentage from its counts.
- A component you have not used before: search for its heading in `references/fluent2-component-guidance.md`.
- A migration: `references/migrating.md`.

## 4. Check, then report

- `verify` defaults to 1440 and 375px, light. It starts and stops the dev server: never run `npm run dev` yourself. Make all changes, then verify once.
- Open a screenshot only when `verify` names it. If `verify` cannot run, quote its error and do not claim the UI was verified.
- Pages behind a login: if `.verify-profile/` exists, `verify` uses it. Otherwise ask the person to run `node .fluent-kit/scripts/login.mjs` once; never add an unauthenticated route.
- Treat every `verify` error or warning as yours. If it comes from a part your change does not touch (the app shell, a shared component you did not edit), say so plainly and leave it; known app-wide issues belong in `.fluent-kit/verify-ignore.json`. Never edit a check to pass (`// fluent-kit-ignore -- reason` for one real exception, and mention it).
- New page: go through `checklist.md`.
- Design note (new page or restyle): the requirement, the pattern and the alternative you rejected, anything built differently from what was asked, assumptions (language, currency, sample data), what you could not verify.

## Off-standard requests

Do not build it, not even "restrained". Build the nearest on-standard version (a page header for a hero banner, a `MessageBar` for an announcement, the brand token for "branded") and say in two lines what was asked and what you built. Only an exception listed in `.fluent-kit/PROFILE.md` ("Approved exceptions") allows it. A `check.mjs` warning is not permission.
