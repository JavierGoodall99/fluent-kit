# Fluent design kit: Microsoft look and feel

Read by AI agents and developers. Fluent UI React v9 is the foundation, so every app feels like a Microsoft application (Microsoft 365, Azure portal, Teams). This kit works in any React repo. Organisation-specific rules (language, tone, shared packages) go in `.fluent-kit/PROFILE.md`; if that file exists, it overrides the defaults here. If the repo has its own design guidance (a `design.md`, conventions in `AGENTS.md`, another design skill), that guidance wins over this file wherever they conflict; this file fills the gaps.

Some projects have their own shared UI or theme package. Use it only if the project already depends on one; `.fluent-kit/scripts/detect-theme.mjs` lists likely candidates. If there is none, use Fluent v9 directly. Never import or create a package that is not in `package.json`. Checked against `@fluentui/react-components` 9.74.x.

Read `.fluent-kit/DESIGNER.md` as well: it covers how to think about a screen (brief, hierarchy, content, states, self-critique), where this file covers the parts and tokens.

## Framework and styling notes

- **Next.js (App Router):** a file that uses `makeStyles`, Fluent hooks or event handlers needs `"use client"`. Do not pass icon components or elements from a Server Component to a Client Component; pass a string and pick the icon inside the client component.
- **Next.js, Fluent and `data-tabster-dummy` hydration warnings:** a hydration error whose only server-side difference is `<i data-tabster-dummy ...>` elements comes from Fluent's focus helper (tabster) touching the HTML before React hydrates that chunk. It depends on timing, shows up on pages with toolbars, tab lists, menus or grids, and is not a mistake in the page. `verify.mjs` reports it as a warning. Do not restructure the page, wrap components in client-only mounts, or add `suppressHydrationWarning` to chase it; mention it in the design note as an open Fluent issue. Any other hydration difference is a real error.
- **Next.js and the virtualized DataGrid:** the sortable virtualized grid can fail hydration when it is rendered on the server (the header does not match what the browser renders). Mount it on the client only and show a `Spinner` until then (`useSyncExternalStore(() => () => {}, () => true, () => false)` as the "mounted" flag). Found in the Copilot behaviour test (prompt 9).
- **Tailwind:** if the project uses it, keep its existing use for page layout. In new code, take colors, typography, radii and shadows from Fluent tokens (`makeStyles` + `tokens`), not Tailwind color utilities, unless the project's own guidance says otherwise.

## 0. Source of truth

"Microsoft design" means **Fluent 2**, the design language of Microsoft 365, Teams, Windows and Azure. Its guidance lives at [fluent2.microsoft.design](https://fluent2.microsoft.design/); the React implementation is Fluent UI React v9. [microsoft.design](https://microsoft.design/) is Microsoft's design community and editorial site (articles, motion, wallpapers), not the system documentation, so use it for inspiration only. When this file and Fluent 2 disagree, Fluent 2 wins unless this file says why (usually: the product brand ramp).

The one deliberate deviation from stock Microsoft: each app keeps its own brand ramp. Nothing else changes.

## 1. Visual theme

- **Character:** calm, neutral, dense enough for work. Productivity software, not a marketing site.
- **Feel:** Microsoft. Neutral surfaces, Segoe UI, 4px corner radius, light shadows, restrained motion, command bars and side panels. If a screen would look out of place next to the Azure portal or Microsoft 365, it is wrong.
- **Principle:** apps built with this kit share one structure and differ only in brand accent. If a choice is not about brand color, it is the same in every app.
- **Foundation:** Fluent UI React v9 and Fluent icons only. We customize through the theme, never by overriding Fluent internals.

## 2. Color roles

Colors are never written as values in components. Use tokens.

| Role | Token | Notes |
|---|---|---|
| Page background | `tokens.colorNeutralBackground2` | |
| Surface (cards, panels) | `tokens.colorNeutralBackground1` | |
| Primary text | `tokens.colorNeutralForeground1` | |
| Secondary text | `tokens.colorNeutralForeground2` | |
| Disabled text | `tokens.colorNeutralForegroundDisabled` | |
| Border | `tokens.colorNeutralStroke1` | Subtle: `colorNeutralStroke2` |
| Hover on subtle surfaces | `tokens.colorSubtleBackgroundHover` | |
| Brand accent (buttons, links, selection) | `tokens.colorBrandBackground`, `tokens.colorBrandForeground1`, `tokens.colorBrandForegroundLink` | **Varies per app** |
| Success | `tokens.colorStatusSuccessBackground1`, `tokens.colorStatusSuccessForeground1` | Fixed |
| Warning | `tokens.colorStatusWarningBackground1`, `tokens.colorStatusWarningForeground1` | Fixed |
| Danger | `tokens.colorStatusDangerBackground1`, `tokens.colorStatusDangerForeground1` | Fixed |

Only the brand rows vary per app. Everything else is identical.

### Brand slots

Each app supplies a 16-step brand ramp to `createLightTheme` / `createDarkTheme` (see `.github/skills/fluent-ui/examples/theme.tsx`).

How the brand is chosen. Nobody sets the brand beforehand; the agent finds it:

1. Run `node .fluent-kit/scripts/detect-theme.mjs .` in the project.
2. **The project already has a 16-step Fluent ramp** (`createLightTheme` or `BrandVariants`): keep it exactly. Do not change or regenerate it.
3. **No ramp, but a brand color is found** (a `colorBrandBackground` override, a variable named brand/primary/accent, or the most-used saturated color): run `node .fluent-kit/scripts/generate-ramp.mjs <hex> --ts`, put the result where the theme is created, and tell the user in one line which color was used. Do not ask first. If the color came only from usage counts (the script says "medium" confidence), say in the same line that it is a guess.
4. **Several candidate colors** (the script says "ambiguous"): ask the user to pick one. Show the candidates.
5. **No brand color found**: ask the user for the brand hex, or whether the app should stay on the stock Microsoft theme. Never invent one. Save the answer in `.fluent-kit/brand.json` (`{ "mode": "stock" }` or `{ "hex": "#rrggbb" }`) so it is not asked again; `detect-theme.mjs` honours that file.
6. If the generated ramp fails a contrast check (the script reports it), say so and ask. Do not ship it for buttons or text. Never use `--force` on `make-theme.mjs` to bypass it unless the design owner approved the colour.

`.fluent-kit/scripts/generate-ramp.mjs` puts the brand color at step 80 exactly and follows the curve of Microsoft's default ramp for the other steps. Given Microsoft's own blue (`#0f6cbd`) it reproduces Microsoft's default ramp exactly. For other colors it is an approximation of Microsoft's Theme Designer, not a copy. If the design owner supplies an official ramp, that replaces the generated one.

Never change an existing project's theme as a side effect of an unrelated task. Moving a project onto a different theme setup is a separate, deliberate task.

- **Figma:** Microsoft's [Fluent 2 Web kit](https://www.figma.com/design/BUqKY7PSo3NwriK96ywdLG/Microsoft-Fluent-2-Web--Community-) has a `Brand` variable collection with the same 16 steps (`Brand-10` to `Brand-160`; the default has `Brand-80` = `#0F6CBD`). Designers swap the brand by changing that collection, and the steps map one-to-one to the 10 to 160 keys of `BrandVariants` in code.

Ramps worth keeping can be saved in `.fluent-kit/brands/<name>.md` (see `.fluent-kit/brands/_template.md`). This is optional; an existing project's own theme file is its brand file.

## 3. Typography

- **Font:** the Fluent theme's default (`'Segoe UI'` stack; the Fluent 2 Figma kit's Typography variables also use Segoe UI). Never set a font family, never import web fonts.
- Use the Fluent `Text` component or the ready-made text components below. In `makeStyles`, use `tokens.fontSize*`, `tokens.lineHeight*` and `tokens.fontWeight*`. Never write a pixel size.
- Use `Text as="h1"` (and so on) where a semantic heading is needed.
- Weights: regular, semibold, bold. Use semibold for titles and emphasis; avoid bold except where Fluent already uses it.

Full scale (values from the Fluent 2 Figma kit, Typography variables, checked against `@fluentui/react-components` 9.74.11):

| Size token | px | Line-height token | px | v9 component (weight) |
|---|---|---|---|---|
| `fontSizeBase100` | 10 | `lineHeightBase100` | 14 | `Caption2` |
| `fontSizeBase200` | 12 | `lineHeightBase200` | 16 | `Caption1` |
| `fontSizeBase300` | 14 | `lineHeightBase300` | 20 | `Body1` (`Body1Strong` for semibold) |
| `fontSizeBase400` | 16 | `lineHeightBase400` | 22 | `Subtitle2` (semibold) |
| `fontSizeBase500` | 20 | `lineHeightBase500` | 28 | `Subtitle1` (semibold) |
| `fontSizeBase600` | 24 | `lineHeightBase600` | 32 | `Title3` (semibold) |
| `fontSizeHero700` | 28 | `lineHeightHero700` | 36 | `Title2` (semibold) |
| `fontSizeHero800` | 32 | `lineHeightHero800` | 40 | `Title1` (semibold) |
| `fontSizeHero900` | 40 | `lineHeightHero900` | 52 | `LargeTitle` (semibold) |
| `fontSizeHero1000` | 68 | `lineHeightHero1000` | 92 | `Display` (semibold) |

- The Figma kit lists the 900 line height as 56; Fluent v9 ships 52. Code uses the token, so 52 wins. Do not hard-code 56.
- v9 also has `fontWeightMedium` (500), which the Figma kit does not list. Do not use it in new screens.
- The size-to-component pairing in the last column is from Fluent v9's text components, not from the Figma variables.

Common uses:

| Use | Size token | Weight token |
|---|---|---|
| Page title | `fontSizeBase600` | `fontWeightSemibold` |
| Section title | `fontSizeBase500` | `fontWeightSemibold` |
| Body | `fontSizeBase300` | `fontWeightRegular` |
| Secondary / caption | `fontSizeBase200` | `fontWeightRegular` |

## 4. Components and icons

Use in this order: (1) the project's shared UI package, if it has one, (2) Fluent v9, (3) ask before building anything new. No other UI library, ever.

| Need | Use |
|---|---|
| Buttons | `Button` (one `primary` per view), `ToolbarButton` in command bars |
| Form inputs | `Input`, `Textarea`, `RadioGroup`, `Dropdown`, `Combobox`, `Checkbox`, `Switch`, `SearchBox`, `DatePicker` and `TimePicker` (companion packages, see below), each inside `Field`. **Do not use `Select`**: it wraps the browser's own `<select>`, so the open list is the operating system's menu, not a Fluent one (`check.mjs` flags it). 2 to 5 visible choices are a `RadioGroup`; anything longer or searchable is a `Dropdown` (with `Option`) or `Combobox`. Never `<Input type="date">`, `time`, `datetime-local`, `month`, `week` or `range`: they open the browser's own control (`check.mjs` flags them). |
| Lists and tables | The project's shared data table if it has one; otherwise `DataGrid` / `Table`. `DataGrid` when rows are selectable, sortable or navigable cell by cell; `Table` when columns and rows are purely visual; `List` when there is only one column of information (per the Fluent 2 DataGrid guidance) |
| Command bar | `Toolbar` with `ToolbarButton`, `ToolbarDivider`, `Menu` for overflow |
| Side panels (when the requirement calls for one) | `OverlayDrawer` (temporary) or `InlineDrawer` (persistent) with `DrawerHeader`, `DrawerBody` |
| Confirmations | `Dialog` |
| Notifications | `Toast` (via `Toaster`) for transient, `MessageBar` for persistent |
| Navigation | The project's app shell if it has one; otherwise `NavDrawer`, `NavItem` |
| Breadcrumb | `Breadcrumb` |
| People | `Persona`, `Avatar` |
| Status and labels | `Badge`, `Tag` |
| Counts (nav items, notifications) | `CounterBadge` (colors: `brand`, `danger`, `important`, `informative` only) |
| Help | `Tooltip`, `InfoLabel` |
| Loading | `Spinner`, `Skeleton`, `ProgressBar` |
| Page header, organisation or environment selector | The project's shared components if they exist; otherwise compose from Fluent (`Text`, `Breadcrumb`, `Button`, `Combobox`) |

Full catalogue: `components.json`.

### Official companion packages

Some Fluent v9 components ship in their own package, not in `@fluentui/react-components`. These are Fluent's own and may be added when the requirement needs them (they are not "another UI library"). Name the package and why in the design note. Several are pre-1.0 (`-compat`, `-preview`) so their API can change: pin the version and expect updates. Anything not on this list: ask before adding a dependency. A companion package being a separate install is not a reason to fall back to a native control: install it, pin it and name it in the design note.

| Need | Package (checked on npm, 2026-10) |
|---|---|
| Date picker, calendar | `@fluentui/react-datepicker-compat` (also `@fluentui/react-calendar-compat`) |
| Time picker | `@fluentui/react-timepicker-compat` |
| Charts | `@fluentui/react-charts` |
| Carousel, Rating | `@fluentui/react-carousel`, `@fluentui/react-rating-preview` |
| Virtualized DataGrid (thousands of rows) | `@fluentui-contrib/react-data-grid-react-window` with `react-window@1` (Microsoft's `fluentui-contrib`, the package the Fluent DataGrid docs point to for virtualization). Example: `examples/large-list.tsx` |

There is no single date-range component in Fluent v9. Use two date pickers (from, to) with min and max limits so the end cannot be before the start, and make either end optional.


### Icons

- Only `@fluentui/react-icons`. No other icon library, no emoji, no custom SVG icons.
- Regular style by default. Use `bundleIcon(XFilled, XRegular)` for navigation and toggles so the active state is filled.
- Sizes: 16 inline with text, 20 in buttons and command bars, 24 in navigation.
- Icon-only buttons have `aria-label` and a `Tooltip`.

### Which component when

Details per component are in `.github/skills/fluent-ui/references/fluent2-component-guidance.md` (from the Fluent 2 Figma kit).

| Need | Use | Not |
|---|---|---|
| Feedback that needs a decision or blocks work | `Dialog` | `Toast` |
| Short confirmation of something that just happened | `Toast` | `MessageBar` |
| Persistent message about the page or a section | `MessageBar` | `Toast` |
| Extra info with structure, links or actions | `Popover` | `Tooltip` |
| Plain-text hint or icon-button name | `Tooltip` | `Popover` |
| Choose one of 2 to 5 options, visible | `RadioGroup` | `Dropdown` |
| Choose one of many options | `Dropdown` or `Combobox` | `RadioGroup` |
| Pick a date | `DatePicker` (`@fluentui/react-datepicker-compat`) | `Input type="date"` (the browser's own calendar, unthemed, browser-specific locale) |
| Pick a time | `TimePicker` (`@fluentui/react-timepicker-compat`) | `Input type="time"` |
| Setting that applies immediately | `Switch` | `Checkbox` |
| Choice confirmed on save, or multi-select | `Checkbox` | `Switch` |
| Label with extra info | `InfoLabel` | an icon next to a `Label` |
| Label, control, hint and validation | `Field` | loose `Label` + control |
| Short free text | `Input` | `Textarea` |
| Precise number in a small range | `SpinButton` | `Slider` |
| Imprecise value in a range | `Slider` | `Input` |
| Many records, sortable, selectable | `DataGrid` | `List` |
| Simple list of items | `List` | `DataGrid` |
| Hierarchy | `Tree` | `Accordion` |
| Optional sections people can open | `Accordion` | required task content |
| Loading with known structure | `Skeleton` | `Spinner` |
| Loading, unknown structure or short wait | `Spinner` or `ProgressBar` | `Skeleton` |
| Read-only status or count | `Badge` | `Tag` |
| Value the person picked and can remove | `Tag` | `Badge` |
| Multi-value picker with typing | `TagPicker` | `Dropdown` |
| Navigate to another page or place | `Link` | `Button` |
| Run an action | `Button` | `Link` |

## 5. Layout, spacing and page patterns

Spacing uses `tokens.spacingHorizontal*` and `tokens.spacingVertical*`. No raw `px`. Standard gaps: `M` (12) between related controls, `L` (16) between groups, `XXL` (24) between sections. Page content max width: keep the project's existing value; if it has none, let data pages fill the width (this is a kit default, not a Fluent rule). Layouts hold from 320px to 1920px.

Fluent 2 rules to follow (from [Fluent 2 layout](https://fluent2.microsoft.design/layout)):

- **4px base unit.** The spacing ramp is 0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 40, 48, 52, 56. The 2, 6 and 10 steps exist for icon padding; use them there, not for general layout.
- **Proximity groups.** Closer elements read as related. Group with space before reaching for dividers or boxes.
- **Alignment.** Text left-aligned; center only to focus one thing (an empty state, a sign-in card).
- **Grid.** 12 columns for page-level web layouts. Gutters and margins are multiples of 4 and may change at breakpoints.
- **Breakpoints (size classes).**

| Class | Width (px) |
|---|---|
| small | 320–479 |
| medium | 480–639 |
| large | 640–1023 |
| x-large | 1024–1365 |
| xx-large | 1366–1919 |
| xxx-large | 1920+ |

- **Responsive techniques**, in the order to try them: reposition, resize, reflow, show/hide metadata, re-architect (for example list plus details side by side on wide screens, list then a full-screen details view on small ones). Build one responsive layout, not separate adaptive ones.

### Choose by requirement

No presentation is the default. Before building a screen, write the requirement in one line (who, what they need to do, how many items) and pick from this table. If two rows fit, prefer what the repo already does, then the simpler one. If the requirement is unclear, ask. The files in `examples/` show how to build each piece correctly; they are not templates to copy onto every page.

| The person needs to… | Use | Notes |
|---|---|---|
| Scan, compare, sort or select among up to a few hundred records | `DataGrid` | The project's shared table first, if it has one |
| Scan, search and sort thousands of records held in the browser | Virtualized `DataGrid` (`@fluentui-contrib/react-data-grid-react-window`) | Only visible rows are in the DOM. Fixed row height, one-line cells, memoized row renderer. See `examples/large-list.tsx` |
| Work with data too big to hold in the browser (tens of thousands up, or it lives on a server) | Server-side search, sort and paging, one page (or a virtualized window) at a time | Show total count, a loading state per request, and keep the search term and sort in the URL |
| Read a few records, no sorting or selecting | `Table` | Purely visual rows and columns |
| Read a single column of items | `List` | |
| Browse items visually (images, summaries) | A grid of `Card`s | |
| Navigate a hierarchy | `Tree` | |
| See details of one record while keeping their place in a list | `OverlayDrawer`, or `InlineDrawer` if it stays open | |
| See details when there is a lot of content or it is a destination of its own | A detail page | Linkable, bookmarkable |
| Edit a few fields of one record quickly | A drawer, or edit inline in the row/cell | |
| Edit or create something with many fields or sections | A full page | Not a drawer |
| Do one short, focused task that blocks everything else | `Dialog` | |
| Confirm a destructive or irreversible action | `Dialog` | Never for a normal edit form |
| Step through a multi-stage process | A full page with steps | |
| Pick filters while looking at the results | A side panel (`InlineDrawer`) or a filter bar | |

Page patterns that make a product feel like Microsoft software:

| Pattern | How |
|---|---|
| **App shell** | Left navigation (`NavDrawer`) plus a slim top header with the app name, an organisation or environment selector if the app needs one, and the user `Persona`. Collapsible nav: full drawer, 56px icon rail, and a slide-over drawer on narrow screens (see `examples/app-nav.tsx`). Nav items blend into the drawer by default (`colorSubtleBackground`), with `colorSubtleBackgroundHover` on hover and `colorSubtleBackgroundSelected` plus the accent bar when selected; Fluent's stock item background is near-black, so override it. Global actions (theme toggle, help) go in `NavDrawerFooter`, left-aligned with the items (`footerAction` in the example): a `Button` centres its content by default, so give it `justifyContent: flex-start` and the item padding, and regular font weight like the items. Set `surfaceMotion={null}` on `NavDrawer` when the wrapper already animates width or transform, otherwise the drawer slides in twice. |
| **Page layout** | `PageHeader` (breadcrumb, title, primary action), a command bar (`Toolbar`) under it, then content on `colorNeutralBackground2` with surfaces in `colorNeutralBackground1`. |
| **Records** | Pick the presentation from the requirement (see "Choose by requirement" below). Whatever you pick, add a command bar above if there are actions (New, Delete, Refresh, filter via `SearchBox`), and always show empty, loading and error states. |
| **Forms** | Single column of `Field`s. Inline validation messages. Primary action bottom-left of the form, or in the footer of whatever surface holds it (drawer, dialog, page). |
| **Confirmations** | `Dialog`, only for destructive or irreversible actions. Never use a dialog for a normal edit form. |
| **Status** | `MessageBar` inline at the top of the content for persistent messages. `Toast` for transient confirmation. |
| **Empty state** | Short message plus one primary action. No illustrations. |

## 6. Elevation and shape

- Keep the theme's radii (4px medium). Do not round things further. `borderRadiusLarge` for dialogs only.
- Shadows: `tokens.shadow2` or `shadow4` for cards, `shadow16` for popovers and menus, `shadow28` for dialogs. Prefer borders to shadows in dense, data-heavy layouts.
- Motion: Fluent's defaults only. Fluent components already animate correctly, so most screens need no custom motion. No parallax or decorative motion. If you must animate something custom:
  - Every animation must have a purpose (orient, respond, give feedback). If removing it does not hurt usability, remove it.
  - Durations from tokens: `durationFaster` (100ms) for small state changes, `durationNormal` (200ms) as the default, `durationSlow` (300ms) for drawers and larger sections. Nothing longer than `durationUltraSlow` (500ms).
  - Easing from tokens: `curveDecelerateMid` for things entering, `curveAccelerateMid` for things leaving, `curveEasyEase` for things moving within the screen. `curveLinear` only for continuous loops.
  - Always respect `prefers-reduced-motion`: provide a no-motion fallback.

## 7. Do and don't

**Do**

- Use Fluent components and Fluent icons for everything.
- Use tokens for every color, space, radius, and shadow.
- Reuse the project's existing components before building anything.
- Follow the page patterns in section 5.
- Show empty, loading, and error states.
- Test in the app's own theme.

**Don't**

- Use any other UI or icon library, or `@fluentui/react` (v8).
- Write native `<button>`, `<input>`, `<select>`, `<option>`, `<textarea>`, `<a>`, `<table>`, `<dialog>`, or use Fluent's `Select` (it is a native `<select>` underneath).
- Write hex or rgb values. Ever.
- Override Fluent classes (`.fui-*`) with global CSS.
- Create a second button, input, or dialog.
- Change fonts, radii, or spacing per app. Only the brand ramp varies.
- Add gradients, illustrations, hero banners, pill-shaped custom buttons, or emoji.
- Use color alone to show state.

## 8. Responsive and accessibility

- Layouts that work from 320px upward (Fluent 2 "small" size class).
- Touch targets: Fluent 2 recommends 44x44 minimum on web and iOS. WCAG 2.5.8 (AA) requires at least 24px. Fluent buttons are 24px (small), 32px (medium, default) and 40px (large). On touch-first layouts use `size="large"` and aim for 44px (the AAA recommendation, WCAG 2.5.5) where space allows.
- Every input has a visible label (use `Field`). Placeholder text is a hint, never the label.
- Keyboard operable everywhere. Visible focus. Do not remove it.
- Text contrast at least 4.5:1, large text and UI components at least 3:1.
- Respect `prefers-reduced-motion`.

## 9. Agent prompt guide

When asked to build UI, an agent should:

1. Read this file (and `.fluent-kit/PROFILE.md` if it exists). Run `.fluent-kit/scripts/detect-theme.mjs` to find the theme and brand.
2. Pick the page pattern from section 5 and reuse existing components from the project.
3. Write styles with `makeStyles` and `tokens` only. Icons from `@fluentui/react-icons` only.
4. Run the lint rules, `tsc`, and the checklist in `.github/skills/fluent-ui/checklist.md`.

Example prompts that should work well:

- "Add a settings page using the Fluent design kit."
- "Migrate `InvoiceList` from Fluent v8 to v9 and remove hard-coded styles."
- "Build a list page for customers with a command bar and a details drawer."

## 10. Language and copy

- **UI text follows the project's language.** `detect-theme.mjs` reports a `locale` guess (html `lang`, i18n library, locale files). Use it. If the project has several locales, write the default one and add keys for the rest. If there are no signals (new project), ask once; if the user does not say, use English.
- Labels, buttons, placeholders, validation messages, empty states, toasts, dialogs, `aria-label`s and tooltips are all UI text. Code, identifiers, comments and commit messages stay in English unless the repo does otherwise.
- Sentence case, not Title Case: "Clear filters", "Edit columns", "New document".
- Set the `lang` attribute on the document to the UI language so screen readers and spell check use it.
- Dates, numbers and currency go through `Intl` with the UI locale, never hand-formatted.
- Put strings in the project's i18n/resource files, not inline in JSX, if the project has them. If it has none, keep strings inline and do not add an i18n library unasked.
- Tone and formality (for example formal or informal address) belong to the organisation: see `.fluent-kit/PROFILE.md`. Without a profile, match the tone of the existing strings.
