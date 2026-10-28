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
| 5 | Make the log monitor page easier to understand | restyle, whole page |
| 6 | Make the tenant page look better please | restyle, whole page |
| 7 | the tabs and toolbar are cut off on my phone | small fix |
| 8 | Make the log monitor KPI cards look like the ones on the home screen | consistency |

## Results so far (Javier's runs, 2026-10)

| Run | Time | Credits | Quality |
|---|---|---|---|
| Profile page (new) | 2m 49s | 35.5 | pass |
| Integrations page (new) | 2m 56s | 41.1 | pass, one 375px gap |
| Integrations page, after rules | 4m 07s | 44.7 | pass, wrapped cells at 375px |
| Home screen, whole-page redesign (real app) | 14m 04s | 189.9 | pass with gaps, over budget |
| Home: remove repeated text and dead links | 4m 29s | 44.9 | pass |
| Home: phone width fixes | 3m 59s | 39.4 | pass |
| Koppelingen, whole-page "update the UI/UX" | 8m 06s | 75.0 | FAIL: scope (cards no longer uniform) |
| Koppelingen: restore equal cards | 1m 56s | 18.4 | pass |
| Koppelingen: cut-off bottom | 3m 24s | 16.5 | pass |
| Tenant page restyle | 3m 29s | 39.5 | partial: set-up state unclear |
| Tenant: show set up vs not | 5m 25s | 43.3 | FAIL: wrong status (all "Gekoppeld") |
| Tenant: fix "Empty" | 0m 55s | 17.4 | pass |
| Tenant: badge readability | 1m 29s | 13.8 | pass |
| Log monitor, whole-page "easier to understand" | 10m 18s | 87.1 | FAIL: scope (rebuilt, removed features), cards blend, squashed table |
| Log monitor KPI cards match home | 2m 12s | 29.3 | pass, labels left in English |
| Groepsberichten, whole-page "update the ui/ux" (#4 type, untouched page) | 8m 17s | 61.3 | pass with notes: changed a shared component used by two other pages (disclosed), about 6 wasted verify calls |

Pattern: targeted prompts are fast, cheap and right. The failures and the cost spikes are all open-ended whole-page requests. Every kit change after those failures targeted that case.

## How to run it

1. Install the kit in a project, update it, note the commit (`npx -y github:JavierGoodall99/fluent-kit`).
2. For each prompt: fresh chat, one run, no follow-ups. Note time and credits from the chat footer.
3. Answer the six quality checks from the screenshots (first screen, 375px, one state).
4. Add a row above. Ready when the medians and worst cases meet the targets and no row fails a quality check, across at least two projects and at least three people.
