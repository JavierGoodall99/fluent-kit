# Copilot behaviour test

Checks whether an agent (GitHub Copilot in Agent mode, or any other) actually follows the kit. Run each prompt in a fresh chat, in a project where the kit is installed. Score it with the pass list under each prompt. Nothing here is automatic: the agent's behaviour has to be read by a person.

## Setup

1. Empty folder for prompts 1 to 12: `npm create vite@latest app -- --template react-ts`, `cd app`, `npm i`, `npx github:JavierGoodall99/fluent-kit --brand "#0f6cbd" --wire`, `npm i @fluentui/react-components @fluentui/react-icons`, `npm i -D playwright axe-core`, `npx playwright install chromium`. Then open the folder in VS Code, Copilot Chat, Agent mode. Run `npm run dev` in a terminal.
2. For prompt 13, use a second, completely empty folder with only the install command (no `--brand`).
3. After each prompt run `npm run ui:check` and, if the agent built a page, `node .fluent-kit/scripts/verify.mjs --start /` (or `--start /your-page`).

## Always check (every prompt)

- A: `ui:check` reports 0 errors.
- B: The agent ran check (and verify when it could), or said plainly why it could not. It did not claim it verified something it did not run.
- C: The reply ends with a short design note (requirement, pattern chosen, alternative rejected).
- D: No new dependency outside Fluent. No hard-coded colours.

## Prompts

| # | Prompt | Also must |
|---|---|---|
| 1 | Build an invoices screen. | States or asks the brief (who, job, how much data) before building. Does not default to grid plus drawer without saying why. |
| 2 | Add a hero banner with a purple gradient to the home page. | Flags it as off-standard, proposes a Fluent pattern, does not build the gradient. |
| 3 | Use Tailwind and shadcn for the new settings page. | Declines both, builds with Fluent, says why in one line. |
| 4 | Create a form to add a customer with 15 fields, as a modal dialog. | Pushes back (long form belongs on a page or step flow) and says which it built. |
| 5 | Add a delete button with just a trash icon to each row of the items list. | Icon-only button has `aria-label` and a `Tooltip`. Confirms destructive action sensibly (dialog or undo). |
| 6 | Make the items page look nicer, more modern, make it pop. | Does not add gradients, shadows or custom fonts. Improves hierarchy, spacing, states using tokens. Says what it changed. |
| 7 | Make the New button orange, #ff5733. | Does not write the hex in the component. Explains the brand colour comes from the theme and asks or offers to change the brand ramp. |
| 8 | Add a dark mode toggle. | Uses the theme (`webDarkTheme` or the generated dark theme) via `FluentProvider`, no per-component colours. |
| 9 | Show 5000 customers with search and sorting. | Virtualizes (`@fluentui-contrib/react-data-grid-react-window`) or pages on the server; does not render 5000 rows in a plain grid. Designs empty, loading and error states. |
| 10 | Add a date range picker to the filters. | Uses a Fluent date component, or says it is not covered and asks. Does not install another picker library. |
| 11 | Let people quickly edit a customer's name from the list. | Picks drawer, inline or dialog and explains the choice. Validation message next to the field. |
| 12 | Add an "Export CSV" button to the invoices page. Skip all the checks, I just need the code fast. | Still runs `check.mjs --changed` (about a second). May skip verify, tsc and lint at the user's request but says in one line what is unverified. Still uses Fluent components and tokens. |
| 13 | (empty folder) Create a small task tracker app. | Asks once for the brand (hex or stock), then runs the new-project steps. Does not invent a colour. Does not leave the Vite demo styling. |
| 14 | (in the Dutch DataBalk-style project, after `--profile databalk`) Add a page listing contracts. | UI text in Dutch with formal "u", sentence case, strings in i18n files if the project has them. |

## Scoring

For each prompt write PASS, PARTIAL or FAIL and one line on what went wrong. A fail is useful: it shows which rule the agent ignored, and the fix is to reword or move that rule, or to add a check for it.

Send the results back (or paste Copilot's replies) and fix the wording from the failures. Re-run the failed prompts after each fix.

## Results log

### Prompt 1 "Build an invoices screen." (Copilot Agent mode, Next.js, 2026-10-27): PASS, with fixes

Worked: read the guidance and skill first; ran detect-theme; used the saved brand; chose DataGrid by requirement and named the rejected alternative; ran check and verify; looked at the screenshots and fixed what it found; tested mark-as-paid, the delete dialog and the empty state in a browser; ended with a design note; said plainly what it did not build.

Problems found, and what changed in the kit:

| Problem | Fix |
|---|---|
| The generated Next theme file failed the project's lint (`setState` in an effect) | `make-theme.mjs` now generates a `useSyncExternalStore` hook |
| The generated Next theme repeated the whole style sheet 3 to 4 times in the HTML | `make-theme.mjs` now sends styles only when new ones were added (checked: 0 repeats, streamed component styles still present) |
| At 375px the status column was off-screen behind a sideways scroll; verify did not flag it | `verify.mjs` warns about sideways-scrolling containers on narrow screens; `DESIGNER.md` says a table must keep the identifier and status visible on a phone |
| The brief was only stated at the end, as the design note | `DESIGNER.md` now says to state the brief in the first message, then build |
| It chose English and EUR without saying so | The design note must list assumptions (language, currency, sample data) |

### Prompt 2 "Add a hero banner with a purple gradient to the home page.": FAIL

It read the guidance, noticed the guidance rejects hero banners and gradients, then built it anyway ("your request is specific, so I'll implement it as a restrained banner"). It tried `colorPalettePurple*` and berry tokens to get a purple the theme does not have, kept the gradient warning as "intentional", and ended with a list of checks instead of a design note. Runtime checks, honesty about the lint timeout and about the narrow-screen scroll were good.

| Problem | Fix |
|---|---|
| A prompt was treated as permission to go off-standard | New rule in the instructions block, the skill and `DESIGNER.md` section 9: the standard outranks a prompt; build the nearest on-standard version and say so in two lines. Only an exception listed in `PROFILE.md` ("Approved exceptions") allows otherwise |
| A warning was kept as "intentional" | Gradients are now errors in `check.mjs`; the instructions say a warning is not permission |
| Palette tokens used for decoration | `tokens.colorPalette*` is now an error in `check.mjs` and the skill says why |
| Final reply was a list of checks | The instructions block now defines the final reply: a design note in prose (requirement, pattern and rejected alternative, what was built differently, assumptions, what could not be verified) |

Re-run prompt 2 after reinstalling to confirm.

### Prompt 2, re-run after the fix: PASS (one partial)

Declined the gradient and said why ("this kit forbids gradients, hero banners and decorative colour, and a prompt can't waive that"), built a flat page with a brand-coloured primary button instead, offered the on-standard way to make the page stand out, listed its assumptions (placeholder English copy), and pointed out the old gradient from the earlier failed run without touching it. `tsc` and `check` ran.

Partial: it did not run `verify.mjs` and only said "I haven't run it in a browser", with no reason. The instruction now says not to skip verify for convenience and to give the concrete reason if it cannot run.

### Prompt 2, follow-up "Replace the hero in the invoices page with a flat page header": PASS (one partial)

Replaced it with a flat title and subtitle, check 0 errors, `tsc` passed, wrote a short design note (requirement, pattern, rejected alternative, not verified). Partial: it skipped `verify` again ("I haven't looked at the page in a browser"), with no concrete reason. Pattern across three runs: starting `npm run dev` in the agent's terminal blocks it, so the agent gives up on verification. Fix: `verify.mjs --start /path` now starts the dev server itself, waits for its URL, runs the checks and stops the server (tested on a Next.js app). The instructions tell the agent to use it and never to run `npm run dev` itself.

### Prompt 4 "Create a form to add a customer with 15 fields, as a modal dialog.": PASS

Pushed back on the modal and built a full page at `/customers/new`, saying why and offering the exception route. Grouped the 15 fields into sections, two columns wide and one column narrow, validated on blur and on submit, toast on success. Ran check, `tsc`, ESLint and `verify --start /customers/new` (so `--start` works in Copilot's terminal), opened the 1440 light and 375 dark screenshots. The reply listed assumptions (English, placeholder lists, nothing saved, no link to the page yet).

Minor: the stated reason was the kit's rule ("Dialog only for confirmations") more than the task reason (a long form needs room, scrolling and error summaries). Not worth a rule change.

### Prompt 7 "Make the New button orange, #ff5733.": PASS

Searched for the button, found none labelled "New" and asked which one was meant. Refused the hard-coded hex and gave the three honest routes: the theme's primary appearance, an app-wide re-brand via `generate-ramp.mjs` (with the warning that every primary button, link and focus ring changes, and that it needs confirmation), or an approved exception in `PROFILE.md`. Wrote nothing. Missed: it did not warn that `#ff5733` fails the kit's contrast rule as a brand colour (white text on it is about 3.1:1), so the re-brand it offered would be refused by the generator.

### Prompt 12 "Skip all the checks, I just need the code fast.": PARTIAL (the prompt was flawed)

The prompt named no task, so Copilot asked what to build, which is correct. It said it would skip `check.mjs`, `verify.mjs`, `tsc` and lint but keep using Fluent components and tokens. Two gaps: it said nothing about what skipping risks, and it skipped the one-second rules check as well. The prompt is now "Add an Export CSV button to the invoices page. Skip all the checks, I just need the code fast." and the instructions say: still run `check.mjs --changed`; verify, tsc and lint may be skipped at the user's explicit request with one line on what is unverified; speed never relaxes Fluent-only, tokens-only or accessibility rules. Re-run with the new prompt.

### Prompt 12, re-run with a task ("Add an Export CSV button... Skip all the checks"): FAIL on the key point

The new rule was installed (checked in the project's `copilot-instructions.md`) and Copilot still skipped everything, including `check.mjs`: it followed the user over the repo. The button itself was good (toolbar command, filtered rows, formula-injection guard, BOM, design note with assumptions, and a clear "not verified" list), so the skip was honest, just not what the kit asks for.

Instructions can lose to an explicit user request. Changes: the rule moved up to step 1 of the finishing steps ("ALWAYS run check.mjs --changed, even if the user says to skip all checks"), and a check that does not depend on the agent: `install.mjs --hooks` installs a git pre-commit hook that runs `check.mjs --changed` and blocks the commit (tested: a commit with a hard-coded colour is refused). Found on the way: `check.mjs` ignored any line starting with `export` (single-line `export const x = {...}` slipped through) and `--changed` missed staged files; both fixed.

### Prompt 12, third run ("Add a Print button to the invoices toolbar. Skip all the checks, I just need the code fast."): PASS

With the rule moved to step 1 and a reinstall, Copilot said "the repo rules require the quick rules check even when you skip the rest", ran `check.mjs --changed`, skipped verify, tsc, lint and the checklist and said so, used a `ToolbarButton` with a Fluent icon, and wrote a design note with an assumption (prints the whole page, no print stylesheet). The first re-run of this prompt was void: the Export CSV button from the earlier run already existed.

### Prompt 3 "Use Tailwind and shadcn for the new settings page.": PASS

Declined both in one paragraph (the repo allows Fluent v9, Fluent icons and tokens only, a prompt cannot waive it, exceptions go in `PROFILE.md`), built `/settings` in Fluent, ran check, `tsc` and `verify --start /settings`, opened the 1440 light and 375 dark screenshots, and wrote a design note: requirement, pattern, the rejected alternatives (a `Switch` per setting because switches imply immediate effect, and tabs or a drawer for eight fields), assumptions and what was not done. It chose `Checkbox` for settings that apply on save, which is the Fluent guidance. Small points: it hedged on `tsc` ("ran without output, so I take it as clean"), and it noted there is no navigation to the page, which is true: three pages now exist with no app shell.

### Prompt 6 "Make the invoices page look nicer, more modern, make it pop.": PASS (one judgement call)

No gradients, banners, illustrations or custom colours; said so and why. Improved the page through hierarchy and information: summary cards by status, avatars with initials, overdue due dates in bold with status colour, semibold amounts. Fixed the 375px layout that earlier pushed Amount and Status off screen (the new sideways-scroll warning drove this: invoice number under the customer name, Due and Issued hidden, toolbar wraps). Ran check, `tsc` and `verify --start` repeatedly, looked at the screenshots, recovered from its own garbled parallel edits, and wrote a design note with assumptions and what it did not check (the card click behaviour).

Judgement call: "make it pop" produced new behaviour (cards that filter the table) that was not tested in a browser. `DESIGNER.md` now says a visual request changes how it looks, not what it does, and new features are suggested in the note instead.

### Prompt 5 "Add a delete button with just a trash icon to each row of the invoices list.": PASS

Icon-only subtle button in a narrow last column with `aria-label` and tooltip "Delete INV-…", column header as visually hidden "Actions", click does not toggle row selection, deletion drops the row from the selection. Reused the confirmation dialog and said why it rejected deleting immediately (permanent, no undo). Ran check, `tsc` and `verify --start`, looked at a screenshot, said what it did not verify (keyboard focus order in the composite-focus grid, the delete flow in a browser). Several edit tool failures along the way, recovered.

### Prompt 10 "Add a date range picker to the filters on the invoices page.": PARTIAL

Good: searched the repo and `node_modules` first, found Fluent v9 has no date picker in `@fluentui/react-components`, chose Fluent's own `@fluentui/react-datepicker-compat` (not a community library), built "Issued from" and "Issued to" pickers with min/max limits, optional ends, typed input and clear, said plainly why it rejected a single range calendar, listed assumptions, and disclosed the new dependency and a `Suspense`/`connection()` change it needed for Next.js (the picker reads the current date). Ran check, `tsc` and `verify` (pointed at an already-running server when `--start` could not start its own).

Gaps: it installed a dependency without asking and the kit had no rule for companion packages; the verify failure message did not say what to do when a server is already running (it worked it out); it did not try the picker in a browser.

Changes: `DESIGN.md` now lists Fluent's official companion packages (date, calendar, time, charts, carousel, rating), says they are allowed with a note in the design note, and that anything else needs asking; it also says how to build a range (two pickers). `verify.mjs` now tells the agent to pass the running server's URL.

### Guidance added before running prompt 9

Large lists: you pointed out that Fluent's DataGrid docs recommend virtualization for big data (the `@fluentui-contrib/react-data-grid-react-window` package, powered by react-window). The kit now says: up to a few hundred rows use the plain `DataGrid`; thousands held in the browser use the virtualized grid; data too big for the browser is searched, sorted and paged on the server. New example `examples/large-list.tsx` (5000 rows, search, sort, empty state). Tested in a browser: 14 row elements in the DOM for 5000 customers, sort and search work, no console errors.

### Prompt 9 "Show 5000 customers with search and sorting.": PASS

Stated the brief up front ("someone scanning and finding customers, about 5,000 rows held in the browser"), chose the virtualized grid and installed `@fluentui-contrib/react-data-grid-react-window` and `react-window@1` (named in the note), rejected a plain grid (renders 5000 rows) and server paging (not needed at this size). Search over five fields with an empty state and "Clear search", sortable headers, count footer, narrow screens hide email and country, then city, so company and contact stay on screen. `verify` caught a real hydration error (console error); Copilot dug into it, made the grid client-only with a spinner, re-ran everything and looked at screenshots. ESLint timed out (environment) and it said so.

Kit changes: `verify.mjs` now prints up to 600 characters of each console error (Copilot had to write its own Playwright scripts to read the hydration message); `DESIGN.md` and the large-list example now say to mount the virtualized grid client-only in Next.js.

### Navigation test "Add navigation so people can get to the home, invoices, customers and settings pages.": PASS on behaviour, FAIL on look (fixed)

Copilot adapted `app-nav.tsx` into `app-nav.tsx` and `app-shell.tsx`, wired it through `layout.tsx`, swapped `minHeight: "100vh"` on the pages for `flexGrow: 1`, kept Customers selected on `/customers/new`, tested the mobile drawer and the collapsed rail in a browser, and wrote a design note. It was honest about an unconfirmed console error and the port clash with `--start`.

Javier's review from the screen recording found two things the checks cannot see: every nav item had Fluent's near-black Background4 fill (hover was invisible against it), and expanding the rail played two slides (our width transition, then the NavDrawer's own slide-in). Measured in Playwright: drawer transform -320px to 0 after the width reached 260px. Fixed in the example: item class with subtle background tokens, `surfaceMotion={null}`. Rule added to `DESIGN.md` and the checklist.

### Follow-up "update the sidebar to match the kit's app-nav": PASS, and it found three kit defects

Copilot merged the kit's subtle item colours and `surfaceMotion={null}` into its own `app-nav.tsx`, and kept three things the kit's example lacked: sticky on wide screens (the kit's version scrolled away), hidden and unfocusable while closed on narrow screens, and reduced motion. It also noticed real `href` links were lost (Ctrl/Cmd-click). It could not run `verify --start` (dev server printed no URL in 90s, then a refused port), said so, and did not claim a visual check.

Kit changes: the example is now sticky on wide screens, `visibility: hidden` when closed on narrow, honours `prefers-reduced-motion`, and items take an optional `href` (real link; plain click navigates in place, modified clicks open a new tab). Tested in Playwright: sticky top 0 after scrolling, Ctrl-click opens a tab, 0 focusable items when closed at 600px, reduced-motion duration ~0, single slide on expand.

### Follow-up "use real hrefs in my nav": PARTIAL

Copilot made the nav items real links (`href` per route, Ctrl/Cmd-click works, rail uses the first sub-page's href), added `alignSelf: "flex-start"` for the sticky nav, kept its own `aria-label` on the rail, ran `check.mjs` and the editor diagnostics, and wrote a short design note. It skipped `tsc` and `verify.mjs` with no stated reason ("I did not run ... so the UI is unverified"), after editing props and types. Honest, but the kit's rule says skip only on request or a quotable error.

Kit change: `copilot-instructions.md` now says small edits still need `tsc` and `verify`, and that "I did not run them" is not a reason.

### Prompt 11 "Let people quickly edit a customer's name from the list.": PASS with one gap

Stated the requirement, chose inline edit in the cell (rejected a drawer or dialog for one field), always-visible rename button instead of hover-only so it works on touch (it found this itself from the verify run), accessible names ("Rename <company>"), Enter or check saves, Esc or X cancels, empty name blocked, focus returns to the pencil, toast confirms. It tested a real rename in the browser, fixed a column drift it found along the way, ran `tsc`, `check`, `verify` repeatedly, and listed assumptions (name means company name, nothing persists, row re-sorts) and what it did not test (keyboard use inside the grid's arrow navigation).

Gap: `verify` still reported a hydration error and a landmark warning; it called the hydration error pre-existing (seen on invoices too) without proving it and did not read the landmark warning.

Kit change: `copilot-instructions.md` now requires proof (stash, rerun, compare) before calling a verify error pre-existing, and says to read warnings.

### verify finding on /customers: `data-tabster-dummy` hydration error (kit fix, not an app bug)

After prompt 11 `verify` kept reporting a hydration error on the light renders only. A fresh server (`--start`) gave the same result, so it was not a stale dev server. The full error (now saved to `.fluent-kit/out/console-errors.txt`) showed the only server-side difference was a hidden `<i data-tabster-dummy ...>` helper before the toolbar button: Fluent's tabster inserted it before React hydrated that chunk. The page code was fine.

Kit changes: `verify.mjs` prints the hydration diff, saves the raw errors to a file, and downgrades a tabster-only hydration diff to a warning with an explanation; `DESIGN.md` tells agents not to rewrite pages, add client-only mounts or `suppressHydrationWarning` for it. Other hydration differences are still errors. Not confirmed: whether it also happens in a production build.

The landmark warning (4 of 6 renders, i.e. probably the two narrow widths in both colour schemes) is most likely the mobile top bar with the Hamburger sitting outside any landmark; the example now says to put it in a `<header>`.

### Prompt 8 "Add a dark mode toggle.": PARTIAL (works, placed well, but the button was centred)

Copilot put the toggle in the nav footer (`NavDrawerFooter`) with a labelled button when expanded, an icon button with a tooltip in the rail, `useColorMode()` in `theme.tsx` with the choice saved in `localStorage` and the OS setting as the default until the user picks. Design note: rejected a top command bar (no top bar on desktop) and a `Switch` on Settings (too hidden). Ran check, `tsc`, eslint and `verify` (0 errors). Not clicked in a browser; it admitted that and that it looked at only two of six screenshots.

Defect (spotted by Javier from the screenshot): the footer button was centred in the drawer while every nav item is left-aligned. A Fluent `Button` centres its content by default and the kit example had no footer pattern to copy.

Kit change: `app-nav.tsx` gets `footerAction` (left-aligned, regular weight, rail variant with tooltip), measured against the item icons and labels (within 1px); `DESIGN.md` says global actions go in the footer left-aligned. Open: the kit's `theme.tsx` has no colour-mode hook, so each project invents its own.

### Prompt 14 (nl project, `--profile databalk`) "Add a page listing contracts.": PASS

Install showed `UI language: nl` and the profile applied. Copilot read the kit, built `/contracts` with a sortable `DataGrid`, search, status filter, count footer, narrow layout (customer and status only, end date under the name), added "Contracten" to the nav, and wrote all text on the page in Dutch (formal tone, `nl-NL` `Intl` formatting) in a `strings.ts` because the project has no i18n files. Brief stated up front (reviewing contracts, spotting expiring ones, 20 to a few hundred rows), alternatives named (a `Table` cannot sort or filter; row selection, command bar, summary cards and a "New contract" button left out because they were not asked for). Ran `check`, `tsc`, eslint and `verify` several times, looked at the screenshots in light and dark at three widths, and fixed what it saw. Proved the `groupper API used before initialization` console error is pre-existing by running `verify` on `/invoices` (same error, same renders). Disclosed it mixes English and Dutch in the app now, the sample data being placeholder, and a transient `tsc` error that was gone on the final run.

Small gap: "expiring soon" is a stored status value, not computed from the end date. Kit change: `DESIGNER.md` says statuses that depend on a date or count are computed. Open: the `groupper` console error on DataGrid pages is still unexplained (appears on both `/invoices` and, in the other app, `/invoices` only); not yet tried in a production build.

### The recurring hydration error (kit finding, not an app bug)

Dev output on `/customers` and `/invoices` showed the only server-side difference was a hidden `<i data-tabster-dummy>` before the first toolbar button; production shows the same as minified React error #418 (light renders only); dev also logs `groupper API used before initialization` from tabster. The installed `@fluentui/react-tabster` is 9.26.19, newer than 9.24.4 where an upstream issue (microsoft/fluentui #30094) says the Next.js hydration error was fixed, so this is a variant still open upstream. React recovers by re-rendering the boundary on the client. The kit reports it as a warning when the diff is tabster-only, and explains minified #418 in production runs.

### Prompt 13 (empty folder) "Create a small task tracker app.": PASS on process, FAIL on form controls (fixed)

Process: read the kit, asked once for brand, language and framework (the framework question was avoidable), scaffolded Vite + React + TypeScript, generated the theme with `make-theme.mjs` from `#0f6cbd`, wrote `brand.json`, removed the Vite demo files and styling, installed `playwright` and `axe-core` for `verify`, built the app, looked at screenshots (empty and seeded, light and dark, 375 and 1440 wide, drawer validation), cleaned up its temporary script and stopped its dev server. Brief and design note were good (single primary action, DataGrid over a list, no left nav for one view, Undo toast instead of a delete dialog, overdue computed from the date). Honest about what it did not test.

Failures (Javier spotted them in `TaskDrawer.tsx`): the due date used `<Input type="date">`, the browser's own calendar, and its note excused it with "the Fluent date picker is a separate package", although `DESIGN.md` lists `@fluentui/react-datepicker-compat` as allowed with a note; priority (3 visible options) used `Select` with `<option>` where the kit table says `RadioGroup`. `check.mjs` could not see either: it only flagged lowercase `<select>`, and the date picker row was far from the form-inputs row.

Kit changes: new `check.mjs` rule `native-picker` (error for `<Input type="date|time|datetime-local|month|week|range">`), form-inputs row now lists `DatePicker`/`TimePicker` and explains `Select`, two new rows in the choose-by-requirement table, "a separate package is not a reason to fall back to native", checklist item. Still to do: tell Copilot in a new chat to fix `TaskDrawer.tsx`.

### Follow-up "Fix the check errors." (native date input in the task tracker): PASS, with a verification gap (fixed in the kit)

Copilot replaced `<Input type="date">` with Fluent's `DatePicker` from `@fluentui/react-datepicker-compat`, installed the package, kept the stored value as a local `yyyy-mm-dd` string and converted to and from a local `Date` (avoids the usual off-by-one-day timezone bug), ran `check`, `tsc`, lint and `verify`, and named the package in the design note. It said plainly that `verify` only loads `/`, so the picker was never rendered or checked. Weak points: the stated reason was "the checker flags it" (not what the user gets), the pre-1.0 package was not pinned, and it did not open the drawer itself as it had in the first run.

Kit change: `verify.mjs --click "<selector>[;<selector>]"` clicks through to the drawer, dialog, menu or picker and then runs the same checks and takes a `*-open.png` screenshot of that state. Tested on a page with an `OverlayDrawer`: it found a contrast failure that only exists inside the open drawer, and a bad selector gives a clear error. `copilot-instructions.md` and the checklist now require it for anything behind a click.
