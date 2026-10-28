---
name: fluent-ui
description: Build or change UI so it looks and feels like a Microsoft application, using Fluent UI React v9, Fluent icons and tokens. Use when creating pages, forms, tables, dialogs, or when restyling or migrating an existing screen. Works in any repo; detects the existing theme and brand.
---

# Fluent UI: router

Pick one route and read only what it names. Paths are relative to this folder.

| Route | When | Read |
|---|---|---|
| Small fix | a prop, size, spacing, text, one control | `tasks/small-fix.md` |
| Restyle | "make it better", "easier to understand", "update the UI/UX" of a page that exists | `tasks/restyle.md` + the page's pattern card |
| New page | a new page, section, shell or overlay in an app on Fluent v9 | `tasks/new-page.md` + one pattern card and its example |
| New app | empty folder, fresh scaffold, Fluent v8 or another UI library | `tasks/new-app.md`, then the new-page route |

Every route ends with one command: `node .fluent-kit/scripts/check.mjs --finish --page /path` (new page or app: add `--full`). It runs the rules, `tsc`, and `verify` only when something visible changed, and stops at the first failure.

## Pattern cards

Each card holds the layout, the measurements and the narrow-screen rules, and names its example. Copy the example's structure, not its placeholder data.

| The person needs to... | Card |
|---|---|
| scan, sort or select records, any number | `patterns/list.md` |
| find what is failing among many checks or jobs, and why | `patterns/status-page.md` |
| see an overview of measures, browse cards, move work through stages | `patterns/dashboard.md` |
| fill in a form on its own page | `patterns/form.md` |
| review and change preferences | `patterns/settings.md` |
| edit one record from a list, or confirm a destructive action | `patterns/drawer.md` |
| move between pages (app shell) | `patterns/nav.md` |
| be told something happened; an empty or first-run screen | `patterns/feedback.md` |

No card fits: `tasks/new-page.md`, "No card fits".

## Only when needed

`deviations.md`: a control, icon, style or Next.js detail that the card and example do not show.

## Off-standard requests

Gradients, hero banners, illustrations, another library, custom colours or fonts: never build them, not even "restrained". Build the nearest on-standard version (a page header, a `MessageBar`, the brand token) and say in two lines what was asked and what you built. Only the repo's own design guidance or an "Approved exceptions" entry in `.fluent-kit/PROFILE.md` allows it.
