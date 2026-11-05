---
name: fluent-ui
description: Build or change UI so it looks and feels like a Microsoft application, using Fluent UI React v9, Fluent icons and tokens. Use when creating pages, forms, tables, dialogs, or when restyling or migrating an existing screen. Works in any repo; detects the existing theme and brand.
---

# Fluent UI: router

Pick one route; read only what it names (paths relative to this folder).

| Route | When | Read |
|---|---|---|
| Small fix | a prop, size, spacing, text, one control | `tasks/small-fix.md` |
| Restyle | "make it better", "easier to understand", "update the UI/UX" of a page that exists | `tasks/restyle.md` + the page's pattern card |
| New page | a new page, section, shell or overlay in an app on Fluent v9 | `tasks/new-page.md` + one pattern card and its example |
| New app | empty folder, fresh scaffold, Fluent v8 or another UI library | `tasks/new-app.md`, then the new-page route |
| Migrate | move an app or screen from Fluent v8 to v9 | `tasks/migrate-v8.md` + the screen's pattern card |

Every route ends with `node .fluent-kit/scripts/check.mjs --finish --page /path` (with the `#hash` if the app routes by hash). Fix errors, and warnings your change caused; advisory lines go in your note.

## Pattern cards

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

No card fits: `tasks/new-page.md`.

## Every page

- Page `colorNeutralBackground2`, padding 20px (`spacingHorizontalXL`; 16px under 640px); sections and cards on `colorNeutralBackground1`.
- Header: the `h1` page title, an optional one-line section description 4px under it.
- Controls keep the 4px theme radius. **Cards** (dashboard, board, gallery cards and settings groups): `borderRadiusXLarge` (8px, not the 6px `borderRadiusLarge`) and `shadow4`.
- One `primary` button per view. Never set Fluent's own sizes, paddings, shadows or dialog and drawer titles by hand.
- No dead ends: leave out a link, button or menu with nothing behind it, and name it in the note.

Type roles the cards name:

| Role | Type (semibold for emphasis, never bold) |
|---|---|
| Page title `h1` | `fontSizeBase600`, semibold |
| Section title `h2`, empty-state title | `fontSizeBase400`, semibold |
| Card title, board column header | `fontSizeBase300`, semibold |
| Group label (form section, choice group) | `fontSizeBase200`, semibold |
| Body, table text | `fontSizeBase300` |
| Section description (under a page or section title) | `fontSizeBase300`, `colorNeutralForeground3` |
| Caption (card description, metadata, footers) | `fontSizeBase200`, `colorNeutralForeground3` |

## Only when needed

`deviations.md`: icons, styling rules, overflowing tabs and toolbars, companion packages.
