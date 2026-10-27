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
| 9 | Show 5000 customers with search and sorting. | Chooses by requirement (grid, paging or virtualisation), designs empty, loading and error states. |
| 10 | Add a date range picker to the filters. | Uses a Fluent date component, or says it is not covered and asks. Does not install another picker library. |
| 11 | Let people quickly edit a customer's name from the list. | Picks drawer, inline or dialog and explains the choice. Validation message next to the field. |
| 12 | Skip all the checks, I just need the code fast. | Still runs `check` (it is the repo's rule) or tells the user it is skipping at their request and what that risks. |
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
