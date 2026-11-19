# Benchmark: cost, quality, speed

The kit is ready for wide use when a fixed set of vague prompts, run by someone who did not write the kit, meets all three targets at once.

## Targets (per run, GitHub Copilot Agent, Claude Sonnet)

| | Target | Why |
|---|---|---|
| Speed | median 4 minutes or less, worst case 8 | test users complained about slow runs |
| Cost | median 45 credits or less, worst case 90 | test users want low AI cost |
| Quality | 0 of the 6 checks below fail | a fast wrong result costs more than a slow right one |

Quality checks (the person looks at the result and answers yes or no):
1. **Scope:** only what was asked changed; nothing deleted or removed that was not mentioned.
2. **First glance:** in five seconds they know what the page is, if something is wrong, what to do next.
3. **Uniform:** looks like the rest of the app (same cards, headers, badges, spacing).
4. **Correct:** every status, count and label is true to the data; text is in the app's language.
5. **Every state:** loading, empty, error, narrow screen (375px), no cut-off, no squashed or ragged layout.
6. **Honest note:** says what was not checked and what it assumed; did not claim what it did not see.

## Prompt set (run each in a fresh chat; same project, kit installed)

Vague, as real users write. Mix of new pages, restyles and small fixes.

| # | Prompt | Kind |
|---|---|---|
| 1 | add a page for our integrations | new page |
| 2 | add a page where people can see and edit their profile | new page (form) |
| 3 | add a page that lists the open tasks | new page (list) |
| 4 | Can you update the UI/UX of the home screen | restyle, whole page |
| 5 | Make the activity log page easier to understand | restyle, whole page |
| 6 | Make the tenant page look better please | restyle, whole page |
| 7 | the tabs and toolbar are cut off on my phone | small fix |
| 8 | Make the activity log KPI cards look like the ones on the home screen | consistency |
| 9 | make a grid of cards, one per team, showing their open tickets | new page (cards with uneven content; customer case) |
| 10 | add a customer dropdown to the invoice form, we have about 300 customers | new page (long dropdown; customer case) |
| 11 | the numbers on the billing page are hard to read, tidy up the spacing and alignment | restyle (customer case) |

## The bench app: run the prompts anywhere

`bench/app/` is a small public app made for these prompts, so a run does not need the private pilot app. It is a Dutch tenant portal on Fluent v9 with five pages, each with the flaws its prompts are about: Dashboard (home, #4), Activiteitenlogboek (activity log, #5 and #8: KPI cards in another style than home), Huurders (tenants, #6 and #7: every tenant shown as "Gekoppeld", a toolbar cut off on a phone), Facturatie (billing, #11) and Nieuwe factuur (invoice form, #10). `src/data.ts` holds the data the new-page prompts (#1, #2, #3, #9) need. The app's source has no comments about its flaws: until 2026-11-18 each page opened with one ("a toolbar that is cut off on a phone (#6, #7)"), and agents read it before they started, so runs before that date had the answer in front of them.

```
node tests/bench-setup.mjs ../fluent-kit-bench     # copy, git, npm install, this kit, baseline of old findings, commit
cd ../fluent-kit-bench && node .fluent-kit/scripts/verify.mjs --setup     # once: the browser check
```

Then each run is the same three steps as below. `record-run.mjs` sees the bench app and scores it by machine first (`tests/score-run.mjs`, rules in `bench/expect.json`, which the agent never sees):

| Check | Machine verdict |
| --- | --- |
| Scope | only the files the prompt is about changed (main.tsx and theme files always may); no file deleted; every feature the page had is still used (search, filter, export, paging, its data) |
| First glance | person only |
| Uniform | no card style the app did not have before; for #8 the activity log's cards share home's style; no "cards not one size" |
| Correct | tsc passes; no new kit rule errors in changed files; no new English UI text; #6 shows each tenant's own status, #10 has a customer list, #11 aligns the figures; a new page uses its data |
| Every state | the scorer runs verify itself at 1440 and 375px on the changed page; problems the page already had before the run do not count |
| Honest note | person only |

The verdict shows as the Auto column, for example `P-PFP-` ("-" for the two checks only a person can judge). The person's six letters stay the result; Auto is the evidence and catches what a person skims past. Each run folder also keeps `score-verify/`, the scorer's own screenshots.

## Old kit results (Javier's runs, 2026-10, kit up to `6fb7ac7`, before the task and pattern split)

One run per row, on pages that earlier runs had already changed, with the kit changing between rows. Reference only; the new kit is not compared against these row by row.

| Run | Time | Credits | Quality |
|---|---|---|---|
| Profile page (new) | 2m 49s | 35.5 | pass |
| Integrations page (new) | 2m 56s | 41.1 | pass, one 375px gap |
| Integrations page, after rules | 4m 07s | 44.7 | pass, wrapped cells at 375px |
| Home screen, whole-page redesign (real app) | 14m 04s | 189.9 | pass with gaps, over budget |
| Home: remove repeated text and dead links | 4m 29s | 44.9 | pass |
| Home: phone width fixes | 3m 59s | 39.4 | pass |
| Integrations page, whole-page "update the UI/UX" | 8m 06s | 75.0 | FAIL: scope (cards no longer uniform) |
| Integrations page: restore equal cards | 1m 56s | 18.4 | pass |
| Integrations page: cut-off bottom | 3m 24s | 16.5 | pass |
| Tenant page restyle | 3m 29s | 39.5 | partial: set-up state unclear |
| Tenant: show set up vs not | 5m 25s | 43.3 | FAIL: wrong status (all "Gekoppeld") |
| Tenant: fix "Empty" | 0m 55s | 17.4 | pass |
| Tenant: badge readability | 1m 29s | 13.8 | pass |
| Activity log, whole-page "easier to understand" | 10m 18s | 87.1 | FAIL: scope (rebuilt, removed features), cards blend, squashed table |
| Activity log KPI cards match home | 2m 12s | 29.3 | pass, labels left in English |
| Group messages page, whole-page "update the ui/ux" (#4 type, untouched page) | 8m 17s | 61.3 | pass with notes: changed a shared component used by two other pages (disclosed), about 6 wasted verify calls |
| Learn page, whole-page "update the ui/ux" (#4 type, untouched page) | 6m 11s | 56.2 | pass with notes: reused shared header, search and panel; lesson counts and percentages disagree (6 of 9 shows 68%); doubled code from batched edits (about 5 steps); no consistency scan; note had no five-second line |

Pattern: targeted prompts are fast, cheap and right. The failures and the cost spikes are all open-ended whole-page requests. Every kit change after those failures targeted that case.

## New kit: restyle validation (prompts 4, 5, 6)

Two stages, new kit only. Stage 2 starts only after Stage 1 passes cleanly.

Prompts 4 to 6 restyle pages that already exist. Prompts 1 to 3 (new page), 7 (small fix) and 8 (consistency) are not part of this validation, and the new-app route has no prompt yet. A restyle pass says nothing about those routes.

| Stage | Runs | Passes when |
|---|---|---|
| 1. Smoke test | one run each of #4, #5, #6 | every run: route followed, ≤45 credits, ≤4 minutes, 6 of 6 quality checks |
| 2. Consistency | two more runs per prompt (runs 2 and 3) | across all 9 runs: median ≤45 credits and ≤4 minutes, worst ≤90 credits and ≤8 minutes, no quality check fails |

### Frozen bar for 1.10 (set 2026-11-19, before stage 2)

Written down first so the results cannot move it. The kit is frozen at the merge of PR #55 (which includes #54). Nothing in the kit changes between stage 2 runs.

**Done** means 9 runs (run 1 of each prompt from batch 1.10h, with #6 repeated, plus runs 2 and 3 of each) with: at least 8 of 9 passing, median 35 credits or less and 4 minutes or less, worst 60 credits or less and 8 minutes or less. Then 1.10.0 is released. (The Targets table above stays the bar for wide use; this one is tighter on cost because the baseline cost 26.5 credits.)

A run **fails** on any one of these:
- **Scope:** a column, field or action removed; a shared file or another page changed; a label shortened to clear a check.
- **Correct:** wrong data, or UI text not in the app's language.
- **Every state:** at 375px the page scrolls sideways, text overlaps or runs over another cell, a word breaks across lines, or a cell is squashed (a two-line badge or button, a column cut with "…" in most rows). Fluent has no responsive table or toolbar, so a phone layout that is plain but breaks none of these passes.
- **Honest note:** the note claims something false, such as a page checked that the check never loaded.
- **5 s and Uniform:** only when the page is hard to read at a glance or looks like it belongs to another app.

**Notes only** (written down, never a fail): raw status codes shown as labels, a badge hard to read in dark mode, an error count not shown in red.

**Repeat, do not count:** a run where the check never loaded the page because the dev server died (F-100, fixed in #55). The repeat replaces it.

**What gets fixed after stage 2:** only a failure that shows in at least 2 of the 3 runs of the same prompt. A failure in one run goes into `docs/AUDIT.md` as a finding and the kit is left alone. Cost and time are judged on the median, not on one slow run.

**Stop rule** (so new findings do not reopen the bar):
1. **At most one fix round** after stage 2, and only for failures that show in 2 of the 3 runs of a prompt. Then re-run just those prompts, 3 runs each, against the same bar.
2. **Anything else is a known issue,** not a blocker: a one-run failure, a notes-only item, or something found by looking at a passing run's screenshots. It goes in `docs/AUDIT.md` as a finding for 1.11. Looking harder at the same runs never changes their score.
3. **After the fix round the result stands.** If the bar is met, release 1.10.0. If it is not, the person decides: release with the gap named in the CHANGELOG, or stop. No second fix round.
4. **Accepted limits** (not failures, not findings): Fluent has no responsive table, toolbar or dropdown, so a phone layout may be plain, hide columns or scroll inside a card. A phone layout that is not the best possible is a note, not a fail.

`tests/record-run.mjs --summary` still prints its verdict against the wide-use targets (45 and 90 credits, no quality check fails). For 1.10 use this section.

Run on a machine with little else open: close MCP servers and other dev servers first, and make sure nothing listens on port 5173 (`bench-setup` warns).

**Route followed** means the agent read only its route before the first edit: the always-on block, `SKILL.md`, `tasks/restyle.md`, at most one `patterns/` card, plus `patterns/alignment.md` (`SKILL.md` sends pages with values there) and `deviations.md` if a control needed it, plus the app's own files. Reading anything in `research/` (or an old kit's `docs/`), another task card, or searching the repo for design guidance is a **N**.

**Files read before edit**: in the Copilot chat, count the "Read" steps (files and searches) above the first edit. Kit files and app files both count.

### Setup (once)

1. In the pilot app, make a branch from one base commit and install the kit at a fixed commit:
   `git switch -c bench/kit-new <base> && npx -y github:JavierGoodall99/fluentui-kit#<kit-commit> . && git add -A && git commit -m "kit <kit-commit>"`
2. Have Playwright and axe-core installed, `.verify-profile/` signed in with a tenant that has real data, and a clone of this kit repo for `tests/record-run.mjs` (below: `~/fluent-kit`).
3. Agent: GitHub Copilot, Agent mode, Claude Sonnet. Same model for every run.

### Each run: three steps

```
# 1. Fresh Copilot chat in the pilot app. Paste the prompt exactly as in the table above. No follow-ups.
#    When it finishes, note credits and wall time from the chat footer; count the files read before the first edit;
#    export the chat (optional, gives a route hint).

# 2. Record it (from the pilot app's root). Copies the diff, verify screenshots and report, empties .fluent-kit/out.
node ~/fluent-kit/tests/record-run.mjs --prompt 4 --run 1 --credits 38.5 --time 3m40s --files-read 3 --route y --transcript chat.json

# 3. Reset the app for the next run.
git reset --hard && git clean -fd
```

The Kit column comes from `.fluent-kit/manifest.json`. An install with `npx` has no git commit, so it shows the version and a fingerprint of the skill files; add `--kit <kit-commit>` to step 2 to record the commit instead. If the fingerprint no longer matches the installed files, the script warns that the run did not use a clean kit.

Run folders go to `../bench-runs/p<prompt>-run<run>/` next to the app (outside it, so step 3 cannot delete them). Each holds `run.json`, `diff.patch`, `verify/` (contact sheet, screenshots, `verify-report.json`, `verify-runs.jsonl`) and the transcript.

Score the six quality checks afterwards from the run folders, ideally without knowing which run is which (rename or shuffle the folders first). Record them, then summarise:

```
node ~/fluent-kit/tests/record-run.mjs --prompt 4 --run 1 --update --quality PPPPPP   # six letters, P/F/?, in the order of the checks above
node ~/fluent-kit/tests/record-run.mjs --summary                                    # medians, worst cases, Stage 1 and 2 verdicts
```

`--update` also takes `--credits`, `--time`, `--files-read`, `--route` and `--note`. `../bench-runs/results.md` is rewritten after every command; copy its rows here when a stage is done.

### First informal runs (2026-10-28, before this protocol was used)

Nine runs of prompts 4 to 6 by Javier, Copilot Agent, Claude Sonnet 5.5, on the pilot app. The kit changed between them (before and after PRs #10, #12 and #13), the app was not always reset to one commit, and the screenshots were not kept, so the quality columns were never scored. Use them for time and credits only; repeat with `record-run.mjs` on one fixed kit commit for the real result.

| Prompt | Credits | Time | Route followed |
|---|---|---|---|
| #4 home screen | 25.2, 28.7, 34.4 | 3m06s, 3m14s, 2m27s | y (first not checked) |
| #5 activity log | 20.1, 21.6, 14.1 | 1m43s, 1m05s, 1m03s | y |
| #6 tenants | 37.3, 34.0, 12.4 | 3m10s, 3m41s, 0m58s | y |

Median 25.2 credits and 2m27s; worst 37.3 credits and 3m41s. The old kit took 14m04s and 189.9 credits on the home screen.

### Bench app baseline (2026-11-18, kit a4a4e72 = 1.9.3)

Stage 1, one run each, Copilot Agent with Claude Sonnet 5.5 on Windows, scored by Javier. Auto is the scorer of that day, which had the bugs in F-75; the person's letters are the result.

| Prompt | Credits | Time | Files read | Route | Verify calls | Diff | Auto | Scope | 5 s | Uniform | Correct | States | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #4 | 26.5 | 1m 43s | 7 | Y | 3 (2 not run) | +49 −33 (1 file) | P-FP?- | P | P | P | P | F | P |
| #5 | 32.8 | 1m 16s | 6 | Y | 1 (1 not run) | +65 −31 (1 file) | P-PFP- | F | P | P | P | F | P |
| #6 | 25.7 | 2m 25s | 6 | Y | 2 | +78 −19 (1 file) | P-FPP- | P | P | P | P | P | P |

Median 26.5 credits and 1m 43s, worst 32.8 credits and 2m 25s: well inside the targets. Stage 1 fails on quality. #4: the recent-activity table at 375px ran its text over the next cell and scrolled sideways, and the agent called the scroll deliberate (F-72). #5: the agent checked `/` instead of `/#activity` (F-71); at 375px the page scrolls 239px sideways and a KPI label is cut off; it dropped the ID column unasked (F-74). #6: it checked `/tenants` three times (Home, in a hash-routed app) before `/#tenants`, with two edit rounds driven by the wrong page. A dev server already on port 5173 broke the check in #4 and probably #5 (F-73). No run opened the contact sheet (F-77).

### Bench app rerun on 1.10 (2026-11-18, kit ffc81b5)

Same protocol, `--out ../bench-runs-1.10`, the dev server warmed once before the first run (F-78).

| Prompt | Credits | Time | Files read | Route | Verify calls | Diff | Auto | Scope | 5 s | Uniform | Correct | States | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #4 | 28.2 | 4m 31s | 8 | Y | 5 (3 not run) | +91 −32 (1 file) | P-PPP- | P | P | P | P | P | P |
| #5 | 32.1 | 2m 28s | 7 | Y | 3 | +120 −33 (1 file) | P-PFP- | P | P | P | P | P | P |
| #6 | 21.7 | 1m 37s | 6 | Y | 2 | +21 −9 (1 file) | P-PPP- | P | P | P | P | F | P |

Median 28.2 credits and 2m 28s, worst 32.1 credits and 4m 31s. Every run checked the right page, and verify's table errors made the agent fix the phone layout in #4 and #5. Stage 1 still fails: #4 took over 4 minutes (three check rounds and a `.new.tsx` copy it deleted, F-80), and #6's toolbar wrapped into four ragged rows on a phone with nothing to flag it (F-81). Auto Correct F on #5 is the scorer reading Dutch "of" as English. Also seen: numbers without a thousands separator (F-79) and a cut-off search hint (F-82).

### Bench app rerun on 1.10, second batch (2026-11-18, kit b4a305f)

After PR #44 (toolbar and placeholder checks, number format in `alignment.md`, "no new copy" in the restyle card). `--out ../bench-runs-1.10b`. The pages still had their hint comments (F-84).

| Prompt | Credits | Time | Files read | Route | Verify calls | Diff | Auto | Scope | 5 s | Uniform | Correct | States | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #4 | 30.8 | 3m 20s | 5 | Y | 8 (1 not run) | +121 −37 (2 files) | F-PPF- | F | P | P | P | F | P |
| #5 | 28.5 | 2m 43s | 5 | Y | 2 | +72 −31 (1 file) | P-PP?- | F | P | P | P | P | P |
| #6 | 22.5 | 1m 59s | 5 | Y | 4 (1 not run) | +33 −21 (1 file) | P-PPP- | P | P | P | P | P | P |

Median 28.5 credits and 2m 43s, worst 30.8 credits and 3m 20s: every run under 4 minutes for the first time. Stage 1 fails on scope. #4: `--finish` kept failing on the planted tab bar, so the agent changed the shared `App.tsx` (F-65). #5: after "no new copy", it deleted the page and recreated it, and dropped the ID column (F-80). #6 (a redo; the first attempt's dev server ran out of memory) is the first clean run: icon toolbar on a phone after the new check, status per tenant, 4.210. Neither #4 nor #6 opened `alignment.md`, so #4 still showed € 57573 (F-85).

### Bench app rerun on 1.10, third batch (2026-11-18, kit a2a5ab5)

After PR #45: problems the page already had are listed apart, small edits only, number format in `SKILL.md`, and the first batch with no hint comments in the app. `--out ../bench-runs-1.10c`.

| Prompt | Credits | Time | Files read | Route | Verify calls | Diff | Auto | Scope | 5 s | Uniform | Correct | States | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #4 | 28.2 | 4m 30s | 5 | Y | 4 | +124 −31 (3 files) | F-PPF- | F | P | P | P | F | P |
| #5 | 30.3 | 2m 58s | 6 | Y | 3 | +152 −33 (1 file) | P-PPP- | P | P | P | P | P | P |
| #6 | 48.3 | 7m 52s | 4 | Y | 8 | +50 −18 (1 file) | P-PPP- | P | P | P | P | P | P |

Median 30.3 credits and 4m 30s, worst 48.3 credits and 7m 52s. Two of three runs pass quality, with no hints in the source. #5 is the first fully clean restyle: 14 small edits, every column kept, and `--finish` passing with the planted tab bar listed as already there. #4 saw that list and still changed `App.tsx`, as the card's "say which pages it affects" allowed (F-87). #6 fixed every status without a hint, but a cut-off message named an icon-only button as `<button>` with nothing after it, and finding it took four extra check rounds (F-86). Stage 1 fails on #4's scope and both runs' time.

### Bench app rerun on 1.10, fourth batch (2026-11-18, kit 74626f0)

After PR #47: a restyle changes only its page, and cut-off messages name icon-only buttons. `--out ../bench-runs-1.10d`.

| Prompt | Credits | Time | Files read | Route | Verify calls | Diff | Auto | Scope | 5 s | Uniform | Correct | States | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #4 | 25 | 2m 05s | 4 | Y | 2 | +97 −27 (1 file) | P-PPP- | P | P | P | P | P | P |
| #5 | 28 | 2m 19s | 5 | Y | 2 | +76 −30 (1 file) | P-PPF- | P | P | P | P | F | F |
| #6 | 21.3 | 2m 19s | 5 | Y | 2 | +54 −18 (1 file) | P-PPP- | P | P | P | P | P | P |

Median 25 credits and 2m 19s, worst 28 credits and 2m 19s: the fastest and cheapest batch since the baseline, with no hints in the source. #4 left `App.tsx` alone and showed € 57.573; #6 put the phone toolbar's actions in a "..." menu, as the list pattern says. Stage 1 fails on #5 alone: a table that scrolls a little sideways at 375px, which verify reported as a warning and the note left out (F-89). #6's columns shift per row at 1440px, a note rather than a fail (F-88).

### Bench app rerun on 1.10, fifth batch (2026-11-18, kit 0ff2d31)

After PR #49: warnings the change caused fail `--finish`, and list rows that do not line up are flagged. `--out ../bench-runs-1.10e`.

| Prompt | Credits | Time | Files read | Route | Verify calls | Diff | Auto | Scope | 5 s | Uniform | Correct | States | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #4 | 29.7 | 3m 30s | 7 | Y | 4 | +68 −35 (2 files) | P-PPP- | P | P | P | P | F | P |
| #5 | 28 | 3m 03s | 6 | Y | 2 | +90 −33 (2 files) | P-PPP- | P | P | P | P | F | F |
| #6 | 21.1 | 2m 10s | 5 | Y | 2 | +47 −18 (1 file) | P-PPP- | P | P | P | P | P | P |

Median 28 credits and 3m 03s, worst 29.7 credits and 3m 30s. The machine passed all three; the person failed two, both on things verify could not see then. #4 cleared warnings by changing text: shortened badge labels and `overflowWrap: "anywhere"`, which broke tenant names inside the word on a phone (F-91, F-92); it also wrote the whole page through a Node script (F-93). #5 removed the toolbar's wrap, so the page scrolled 71px sideways at 375px, and the comparison matched that to the original 239px (F-90). #6 is clean: fixed column widths, the phone actions in a "Meer acties" menu.

### Bench app rerun on 1.10, sixth batch (2026-11-18, kit 60922fc)

After PR #50: a page that scrolls sideways by another amount counts as new, broken words are flagged, and the restyle card says to fix layout with layout. `--out ../bench-runs-1.10f`.

| Prompt | Credits | Time | Files read | Route | Verify calls | Diff | Auto | Scope | 5 s | Uniform | Correct | States | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #4 | 29.7 | 2m 34s | 4 | Y | 2 | +94 −30 (2 files) | P-PPP- | P | P | P | P | P | P |
| #5 | 27.1 | 2m 36s | 5 | Y | 2 | +63 −29 (1 file) | P-PPP- | P | P | P | P | F | P |
| #6 | 31 | 3m 17s | 5 | Y | 4 | +45 −19 (1 file) | P-PPP- | P | P | P | P | P | F |

Median 29.7 credits and 2m 36s, worst 31 credits and 3m 17s. #4 is the cleanest #4 yet: small edits, no text shortened, a phone table of time and type, € 57.573 (its first glance is weaker: the error count is not red, and type codes stay raw). #5's phone table kept three columns, with two-line badges and tenant names cut to "…" (F-94). #6 lined its columns up at 1440px, but its phone toolbar took two lines while the note said one (F-95). The machine passed all three again; both failures are what verify could not see yet.

### Bench app rerun on 1.10, seventh batch (2026-11-19, kit 96dc781)

After PR #52: two-line pills, columns cut with an ellipsis and two-line phone toolbars are flagged. `--out ../bench-runs-1.10g`.

| Prompt | Credits | Time | Files read | Route | Verify calls | Diff | Auto | Scope | 5 s | Uniform | Correct | States | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| #4 | 35.9 | 3m 09s | 5 | Y | 3 | +124 −32 (2 files) | P-PPP- | P | P | P | P | P | P |
| #5 | 34.4 | 3m 40s | 5 | Y | 4 | +80 −32 (2 files) | P-PFP- | F | P | P | F | P | P |
| #6 | 32.6 | 4m 20s | 5 | Y | 7 | +53 −18 (1 file) | P-PPF- | P | P | P | P | F | F |

Median 34.4 credits and 3m 40s, worst 35.9 credits and 4m 20s: the stricter checks cost rounds. #4 is the most complete #4 so far (a red sync-error card, readable type labels, € 57.573, a clean phone table). #5 dropped the ID column a third time (F-97), shortened badges and renamed Huurder to Organisatie, and stopped with the check failing on Fluent's own popup (F-98). #6 reached a one-line phone toolbar by trial in seven rounds, then missed a cut-off search hint printed as `NEW` because it filtered the output for "ERROR" (F-96). For the first time the machine and the person agreed on the failures in #5 and #6.

### Bench app rerun on 1.10, eighth batch (2026-11-19, kit b906351)

Run 1 of each prompt after PR #53, `--out ../bench-runs-1.10h`. Figures from the run notes: files read and verify calls were not kept for all three.

| Prompt | Credits | Time | Quality | What happened |
| --- | --- | --- | --- | --- |
| #4 | 40.6 | 4m 20s | PPPPPP | Six verify calls, four of them on cell overflow. The phone table hid the time column and kept Type and Huurder. |
| #5 | 54 | 4m 33s | PPPPPP | The first draft had 6 phone problems; the end result is clean. |
| #6 | 20.6 | 2m 23s | PPPPFP | The agent's check never loaded the page (the dev server exited after "ready" and verify took it for a running one, F-100). The note said so. The scorer's retry found six toolbar controls on five lines and cut-off city names. |

Median 40.6 credits and 4m 20s, worst 54 credits and 4m 33s. Cost is up from 26.5 at baseline because the checks send agents through more rounds; #54 added the command bar example and #55 the server restart. These runs count toward the frozen bar above, except that #6 run 1 is repeated (check never ran).

### Results

Quality columns, in order: Scope, 5 s (first glance), Uniform, Correct, States (every state), Note (honest note). P = pass, F = fail.

| Kit | Stage | Prompt | Run | Credits | Time | Files read before edit | Route followed | Verify calls | Diff | Auto | Scope | 5 s | Uniform | Correct | States | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | 1 | #4 | 1 | | | | | | | | | | | | | |
| | 1 | #5 | 1 | | | | | | | | | | | | | |
| | 1 | #6 | 1 | | | | | | | | | | | | | |
| | 2 | #4 | 2 | | | | | | | | | | | | | |
| | 2 | #4 | 3 | | | | | | | | | | | | | |
| | 2 | #5 | 2 | | | | | | | | | | | | | |
| | 2 | #5 | 3 | | | | | | | | | | | | | |
| | 2 | #6 | 2 | | | | | | | | | | | | | |
| | 2 | #6 | 3 | | | | | | | | | | | | | |

Summary (paste from `--summary`):

| Prompts | Runs | Median credits | Worst credits | Median time | Worst time | Quality fails | Machine fails |
| --- | --- | --- | --- | --- | --- | --- | --- |
| all | | | | | | | |

## Ready for wide use

The new kit meets the targets above on all eight prompts, across at least two projects and at least three people, none of whom wrote the kit.
