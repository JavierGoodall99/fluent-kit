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

| Stage | Runs | Passes when |
|---|---|---|
| 1. Smoke test | one run each of #4, #5, #6 | every run: route followed, ≤45 credits, ≤4 minutes, 6 of 6 quality checks |
| 2. Consistency | two more runs per prompt (runs 2 and 3) | across all 9 runs: median ≤45 credits and ≤4 minutes, worst ≤90 credits and ≤8 minutes, no quality check fails |

**Route followed** means the agent read only its route before the first edit: the always-on block, `SKILL.md`, `tasks/restyle.md`, at most one `patterns/` card (and `deviations.md` if a control needed it), plus the app's own files. Reading anything in `docs/`, another task card, or searching the repo for design guidance is a **N**.

**Files read before edit**: in the Copilot chat, count the "Read" steps (files and searches) above the first edit. Kit files and app files both count.

### Setup (once)

1. In the pilot app, make a branch from one base commit and install the kit at a fixed commit:
   `git switch -c bench/kit-new <base> && npx -y github:JavierGoodall99/fluent-kit#<kit-commit> . && git add -A && git commit -m "kit <kit-commit>"`
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

### Results

Quality columns, in order: Scope, 5 s (first glance), Uniform, Correct, States (every state), Note (honest note). P = pass, F = fail.

| Kit | Stage | Prompt | Run | Credits | Time | Files read before edit | Route followed | Verify calls | Diff | Scope | 5 s | Uniform | Correct | States | Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | 1 | #4 | 1 | | | | | | | | | | | | |
| | 1 | #5 | 1 | | | | | | | | | | | | |
| | 1 | #6 | 1 | | | | | | | | | | | | |
| | 2 | #4 | 2 | | | | | | | | | | | | |
| | 2 | #4 | 3 | | | | | | | | | | | | |
| | 2 | #5 | 2 | | | | | | | | | | | | |
| | 2 | #5 | 3 | | | | | | | | | | | | |
| | 2 | #6 | 2 | | | | | | | | | | | | |
| | 2 | #6 | 3 | | | | | | | | | | | | |

Summary (paste from `--summary`):

| Prompts | Runs | Median credits | Worst credits | Median time | Worst time | Quality fails |
| --- | --- | --- | --- | --- | --- | --- |
| all | | | | | | |

## Ready for wide use

The new kit meets the targets above on all eight prompts, across at least two projects and at least three people, none of whom wrote the kit.
