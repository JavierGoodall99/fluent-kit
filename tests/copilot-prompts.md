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
| 6 | Make the items page look nicer, more modern, make it pop. | Does not add gradients, heavy or custom shadows, or custom fonts (`tokens.shadow2`/`shadow4` on a card is allowed). Improves hierarchy, spacing, states using tokens. Says what it changed. |
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

### Priority field in the task tracker: `Select` with `<option>` (kit fix)

Javier showed the open list from the task drawer: the operating system's native menu, not a Fluent one. Fluent's `Select` is a wrapper around the browser's `<select>`, so the popup is native by design. The kit's own text still allowed `Select` for plain lists, which was wrong for a kit whose job is the Fluent look; the first fix (a rule for `type="date"`) did not cover it.

Kit changes: `check.mjs` now fails on `<Select>` (rule `native-select`) and on native `<option>` / `<optgroup>`, and points to `Dropdown` (with `Option`), `Combobox`, or `RadioGroup` for 2 to 5 visible choices. `DESIGN.md`, the component guidance, the instructions and the checklist no longer allow `Select`. Tested on a copy of the drawer pattern: `Select` and `option` flagged, `Dropdown`/`Option`/`RadioGroup` clean.

### Follow-up "Fix the check errors." (Select and option in the task drawer): PASS on the choice, MISS on finishing

Copilot replaced `Select` with a horizontal `RadioGroup` without being told which control to use, with a sound reason in the design note (three visible choices, a `Dropdown` adds a click for nothing), kept the field's values, and re-ran `check` and `tsc`. It skipped `verify` with no reason ("I didn't run verify") for the third time in this test series, although the instructions say that is not acceptable; its last command also ended in `exit 0`, which hides the exit code.

Kit change: instructions alone did not stop this, so `check.mjs --changed` now ends with a "Not finished yet" note that lists `tsc` and `verify` and says what the only valid reasons to skip are, and names changed files that contain something opened by a click (drawer, dialog, popover, picker, dropdown, toast, tooltip) with the exact `verify --click` command. `--no-next` silences it (the pre-commit hook uses it). Tested: shown for a changed `OverlayDrawer` file, silent with `--no-next`.

### Prompt 1 re-run (empty folder, answers: stock theme, Vite + React + TypeScript, Dutch): PASS

Asked brand, framework and language in one batch, scaffolded Vite + React + TypeScript, added Fluent v9 with the stock theme and set the UI to Dutch with `nl-NL` formatting. Built an invoices page with a command bar (primary "Markeer als betaald", "Verwijderen", "Vernieuwen"), status tabs with counts, search, a sortable multi-select `DataGrid`, a footer with the count and open amount, loading, error and empty states, toasts, and a narrow layout (under 900px: customer over invoice number, amount over status). Status is computed from the dates (the new rule). Ran `tsc`, `oxlint`, `check` and `verify` many times and looked at the screenshots; used `verify --click` on its own (select a row, then open the delete dialog) to check the dialog state, and fixed several things it saw. Design note had requirement, pattern, rejected alternatives (status cards, a details drawer), assumptions and what was not verified (simulated load delay, error state never triggered).

Notes: the framework question was asked again (the kit's own setup guide said to ask when there is no `package.json`; changed to a default); `check.mjs` output was piped through `Select-Object -First 3`, which would hide the "Not finished yet" note; the final summary was posted twice in the transcript (probably a display artefact); it ran `oxlint` through `npx` although the project's own linter is ESLint.

### Speed: why the prompt 1 re-run felt slow

About eight rounds of edit, `tsc`, lint, `check`, `verify --start` (new dev server, six renders, plus `--click`) and screenshots, on top of scaffold, install and browser download. No timings were measured. Kit change: iterate with one render (`--widths 1440 --schemes light`), run the full set once at the end. Effect not yet measured.

### Prompt 6 re-run (Dutch invoices page, "Make the invoices page look nicer, more modern, make it pop."): PASS, with two kit fixes

Copilot kept the page on-standard and said so: no gradient, banner or decorative colour. It got the "pop" from hierarchy: a header with a brand-tinted icon tile, title and one-line description; a single card holding toolbar, tabs, search, table and footer; semibold invoice numbers and amounts; overdue due dates in red and bold; a solid overdue badge; larger tabs. It did not add new content: it suggested a summary strip of outstanding and overdue amounts in the design note and asked. `check` and `tsc` passed, `verify` ran with `--click`, and it stated honestly that it had only seen the loaded table at 375px, because the desktop screenshots caught the loading skeleton.

Judgement points: the icon tile is a small decoration the kit does not forbid; the card has a token shadow where the guide says to prefer borders in dense data layouts; the "Open" badge is still a near-black pill on a dark background; its `--click` target was a disabled button ("Markeer als betaald" needs a selected row), so that step probably failed without it noticing.

Kit changes: `verify.mjs` now waits up to 8 seconds for skeletons, spinners and `aria-busy` regions to disappear before the screenshot, and warns if the page is still loading (tested on a page that loads after 1.5 seconds); the `--click` error now says a disabled button needs the earlier click first. Test-list wording changed: token shadows on a card are allowed, heavy or custom ones are not.

### Feature without a table or a drawer: "Help me chase overdue invoices..." (Dutch invoices app): PASS

Prompt: "Help me chase overdue invoices. I want to work through them one at a time: the oldest first, with who the customer is, how many days late it is and how much is owed. I need to send a reminder or skip to the next one, and see how many are left."

Copilot stated the requirement (one collector working a short queue, deciding on each one) and built a full page with a breadcrumb back to the list, opened from a new command-bar button: one invoice at a time, oldest first, the customer, days late in red, the amount owed, the due date, "Herinnering versturen" as the primary action and "Overslaan" for the next one, a progress line and bar ("Nog 4 van 4 te behandelen"), a finished summary, and loading, error and empty states. Dutch UI and euros, a live region so screen readers hear each new invoice. Rejected reusing the `DataGrid` with a filter (no one-at-a-time focus, no clear remaining count) and a dialog (meant for confirmations). Ran `check`, `tsc` and `verify` (including `--click` on the entry button), looked at the 1440 light and 375 dark screenshots, and said what it had not done: send and skip were not clicked through, so the finished and empty states are untested. Assumptions disclosed: sending is simulated (toast only), data is sample data reloaded on each open, skipped invoices cannot be revisited.

Points: the send happens at once with a toast and no undo or confirmation (an action that reaches a customer); the new page has no URL (the app switches views in state, there is no router), so the browser Back button leaves the app; at 1440px the card sits left with a lot of empty space. Kit change: `DESIGNER.md` section 6 now says actions that reach someone else need an undo window or a confirmation and the note says which.

### Feature from real data: tenants view (51 tenants with environments, Dutch app): PASS

Prompt: a list of tenants from an API (`id`, `name`, `isInternal`, `environments`), "find a tenant quickly, see in which environments it is live, spot the tenants that are not live anywhere yet, tell internal tenants from customers. Choose the presentation that fits this job."

Copilot chose a sortable `DataGrid` with one column per environment in deployment order (Ontwikkel, Test, Acceptatie, Productie) so a column can be read downwards: green check for live and a dash for not, each with a text label for screen readers; a "Geen omgeving" warning badge and a filter tab with the count (8); an "Intern" badge and an "Intern (1)" tab; search by name; sort on every column; on narrow screens the four columns collapse into one text column listing the live environments; loading, error with retry, empty and no-result states. Rejected cards or a plain list (cannot be scanned across environments) and a detail drawer (no extra fields). It noticed the sample has 51 tenants, not "about 50"; wrote `fetchTenants()` as a fake API call (500 ms, checks `success`) with a note on swapping in `fetch()`; added a `/#tenants` hash route because the app has no navigation; ran `check`, `tsc`, lint and `verify --click` on the "Geen omgeving" tab, fixed a count mismatch (9 vs 8) it found; looked at screenshots. Not verified, and said so: the error state, the sticky header (screenshots do not scroll), and any tab other than "Geen omgeving".

Judgement: DataBalk (internal, no environment) counts under "Geen omgeving"; disclosed as an assumption. Process was messy: stale dev-server processes, a killed terminal, several retries, and it could not find its own screenshots because `.fluent-kit/out` is git-ignored and editor search skips it.

Kit change: `verify.mjs` now prints the full path of every screenshot it saved (and says why searching the folder fails).

### Feature from real data: tenant health report (Dutch app): PASS, with a gap

Prompt: triage view for one tenant's health report (integrations, each with checks; find what fails, why, and which failures repeat). The attached JSON did not reach the project.

Copilot searched for `tenant-health*`, found nothing, and wrote its own sample data (6 integrations, 29 checks, 9 failing) and said so at the top of the reply. Design: a verdict line ("Tenant is niet gezond: 3 van 6 integraties hebben een probleem, 9 van 29 checks mislukt"), a section for the same failure across integrations, failing integrations always open with failing checks first and the full message plus a copy button, healthy integrations collapsed in an accordion. Rejected a table of all checks (long Dutch messages truncate) and hiding failing integrations in an accordion (task-critical content). Handled an unknown status (shown raw, never counted as a failure), a failing check inside a "Healthy" integration, and messages cut off by a trailing ellipsis. Ran `check`, `tsc`, lint, `verify --click` on the copy button unprompted, looked at the screenshots, and raised badge text from 10px after seeing it. Said it did not test an unknown status and that clipboard copy was denied in headless Chromium.

Gaps: the final re-run of check, tsc and verify after the last edits was killed, yet the reply says all pass (that holds for the run before the badge-size edits); it built against invented data instead of asking for the file; "same failure" treats a cut-off message as equal to the full one, which can group unrelated errors; a third page behind a hash route. No kit change.

Correction after the screenshot: scored PARTIAL, not PASS. Error text ran about 150 characters across at 1440px in a near-black block, and the repeat cards, failing rows and healthy rows used different layouts instead of one row with a status. Invented sample data had no Degraded status. Kit change: `verify` warns on text lines over about 100 characters at 768px and wider; DESIGNER.md gains a width cap, one row design for all statuses, design every status the data has, ask if the sample is missing, and a row test in the self-critique.
