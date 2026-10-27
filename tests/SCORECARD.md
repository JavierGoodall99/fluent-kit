# Fluent kit: Copilot test scorecard

Source: `tests/copilot-prompts.md` (full transcripts' scoring, one entry per run). Agent: GitHub Copilot, Agent mode, run by Javier. Each prompt was run once (a few were re-run after a fix), so this is evidence, not statistics. A model answers differently on another day.

## Result at a glance

| Result of the first run | Prompts |
|---|---|
| PASS | 1, 3, 4, 5, 6, 7, 9, 11, 14 |
| PARTIAL | 8, 10, 12 |
| FAIL | 2, 13 (process passed, form controls failed) |

Extra tests added along the way: the navigation sidebar (behaviour passed, look failed, fixed) and three follow-ups (match the kit's nav, real links, fix the check errors).

## Per prompt

| # | Prompt | First run | What went wrong | Kit change | Re-run |
|---|---|---|---|---|---|
| 1 | Build an invoices screen | PASS | Generated Next theme failed lint and repeated styles 3 to 4 times; status column hidden at 375px; brief stated only at the end; English/EUR assumed silently | `make-theme.mjs` (useSyncExternalStore, no repeated styles), `verify` warns on sideways-scrolling containers, "state the brief first", assumptions in the note | PASS (empty folder, Dutch, stock theme): used `verify --click` unprompted to open the delete dialog, looked at the screenshots, fixed what it saw; asked the framework question again |
| 2 | Purple gradient hero | FAIL | Treated the prompt as permission, built the gradient, kept the warning as "intentional", used palette tokens for decoration | "The standard outranks a prompt", gradients and `colorPalette*` are errors, final reply must be a design note | PASS (declined, built flat; skipped `verify` with no reason) |
| 3 | Tailwind + shadcn for settings | PASS | Hedged on `tsc`; nav missing | none | n/a |
| 4 | 15-field form as a modal | PASS | Gave the kit's rule as the reason more than the task's | none | n/a |
| 5 | Trash-icon button per row | PASS | Keyboard focus order and delete flow not tested (said so) | none | n/a |
| 6 | "Make it pop" | PASS | Added new behaviour (cards that filter) untested | A visual request changes how it looks, not what it does | PASS on re-run (Dutch page): stayed on-standard and suggested a summary strip instead of adding it; its desktop screenshots caught only the loading skeleton, so `verify` now waits for loading to finish |
| 7 | Orange button `#ff5733` | PASS | Did not warn the colour fails the contrast rule as a brand colour | none yet (open) | n/a |
| 8 | Dark mode toggle | PARTIAL | Footer button centred while nav items are left-aligned; never clicked the toggle | `footerAction` in the nav example (left-aligned, rail variant) | Not re-run |
| 9 | 5000 customers | PASS | Hydration error needed a long hunt | Virtualized grid guidance and example, client-only note for Next, longer error output in `verify` | n/a |
| 10 | Date range filter | PARTIAL | Installed a package unasked; picker not tried in a browser | Official companion packages table and range guidance | Not re-run |
| 11 | Edit a name from the list | PASS | Called a `verify` error "pre-existing" without proof; ignored a warning | Must prove with stash and re-run; read warnings | Not re-run |
| 12 | "Skip all the checks" | PARTIAL, then FAIL | Followed the user over the repo and skipped even the rules check | Rule moved to step 1, git pre-commit hook, two `check.mjs` bugs fixed | PASS (third run) |
| 13 | Task tracker, empty folder | FAIL on controls | Process was good, but used `Input type="date"` and `Select` (OS menu); skipped `verify` three times | `native-picker` and `native-select` rules, `DatePicker`/`TimePicker` guidance, `verify --click`, "Not finished yet" note | Follow-ups PASS; verify of drawer seen by Javier |
| 14 | Contracts page, Dutch project | PASS | "Expiring soon" stored, not computed | Date-based statuses must be computed | n/a |
| nav | "Add navigation" | PASS behaviour, FAIL look | Items black (Fluent default), opened with a double slide | Subtle item colours, `surfaceMotion={null}`, sticky, hidden when closed, reduced motion, real `href` links | Follow-ups PASS / PARTIAL |

Added test: a feature with no table and no drawer (overdue-invoice chase page): PASS. The kit steered it to a one-at-a-time full page, with the rejected alternatives named.

Added tests with real data shapes (Dutch project): tenants list (51 tenants) PASS: environment-matrix grid, filter tabs, states, disclosed assumptions. Tenant health report PASS with one gap: the data file was not in the project, so it invented sample data (disclosed), and its final re-check was killed before the closing "all pass" claim. It used `verify --click` unprompted both times.

## What the tests changed in the kit

- **Runnable checks instead of advice.** `check.mjs` rules: hard-coded colour, spacing and font; other UI or icon libraries; native controls (now including `<option>`); inline style; icon-only buttons without a name; `<img>` without alt; gradients; palette tokens; `Input type="date|time|range|..."`; Fluent `Select`. Tailwind colours and style libraries warn. Baseline file for existing code, git pre-commit hook (`--hooks`), "Not finished yet" note at the end of `check --changed`.
- **`verify.mjs`**: renders light and dark at three widths, axe accessibility, sideways scroll and clipped controls, FluentProvider check, `--start` (runs and stops the dev server), full hydration diff, tabster-only hydration as a warning, production React error explained, `--click` for drawers, dialogs, menus and pickers, raw errors saved to a file.
- **Instructions**: the standard outranks a prompt; check always runs; verify, `tsc` and lint may be skipped only on request or with a quotable error; a pre-existing error must be proved; a design note ends every UI reply.
- **Designer and design guidance**: brief first, choose by requirement (no default to tables or drawers), large lists virtualized, official companion packages allowed with a note, statuses computed, global actions in the nav footer.
- **Examples**: app nav (collapsible, rail, mobile, subtle items, one slide, sticky, links, footer action), list page, edit drawer, large list, theme.

## Patterns across the runs

1. **Written rules lose to a user request or to convenience.** Everything the agent skipped (checks, the standard) came back as a check that runs, not as stronger wording.
2. **`verify` was skipped at least five times**, usually without a reason. The last mitigation (the "Not finished yet" note) has not yet been seen to work.
3. **A check only catches what it has a rule for.** Native controls got through three different ways. Each one needed its own rule.
4. **Looks that checks cannot see were found by a person**: nav colours, the double slide, the centred button, the OS option list. Visual review is still human work.

## Open items

| Item | Status |
|---|---|
| Hydration error `<i data-tabster-dummy>` (and dev `groupper API used before initialization`) on pages with toolbars and grids in Next.js, also in production (#418). `@fluentui/react-tabster` is newer than the version an upstream issue says fixed it | Cause read from the diff, not proven; `verify` reports it as a warning; a small repro could be posted to Fluent |
| Landmark (`region`) warning on narrow widths | Probably the mobile top bar outside a `<header>`; not confirmed |
| "Not finished yet" note and `verify --click` | Not yet seen used by Copilot; the date picker popup and the 375px drawer not yet looked at |
| Prompts not re-run after their fix: 8, 10, 11, 13, 14 and the nav follow-ups | Re-run after the kit is next updated |
| Prompt 7 miss: warn when a requested colour fails the contrast rule before offering a re-brand | Not built |
| Framework question in an empty folder (prompts 13 and the prompt 1 re-run): the setup guide told the agent to ask | Changed: default to Vite + React + TypeScript and say so; not yet re-tested |
| Not tested on a real codebase (DataBalk `api-monitor`) | The largest remaining risk |
| `npm publish` (`npx fluent-kit` without the GitHub path) | Not done |
| DataBalk profile in a public repo | Decision needed |
| Figma community file terms | Not checked |
| Other agents (CLAUDE.md, Cursor) and non-React frameworks | Not built |
| A shorter instructions block based on what the tests showed mattered | Not done |
| `npm run lint` times out in Javier's environment | Environment, not the kit |

## Caveats

Only GitHub Copilot was tested, one run per prompt, on one machine, with one project per kind (Next.js with Tailwind, a Dutch copy of it, and an empty Vite folder). The 14 prompts are the ones written for this test; real prompts will be messier.
