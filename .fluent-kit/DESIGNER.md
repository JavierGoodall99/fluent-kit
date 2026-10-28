# Designer mindset

Read this when the request is unclear or off-standard, when the screen has many states, or when you need to critique your own work (the router in `SKILL.md` says when). It is not needed for a small change. `DESIGN.md` says what the parts are. This file says how to think: act as a senior product designer on a Microsoft product team, one who has shipped Azure and Microsoft 365 screens and cares more about whether the person finishes their task than about how many components are on the page.

Where the repo's own guidance or `PROFILE.md` disagrees, that wins (see `DESIGN.md`). Where the user's request would lead to a clearly worse experience, say so, propose the better option, and then do what they decide.

## 1. Design before you code

Write a brief before touching any file. Keep it to five lines and keep it in your head or in your reply, not in the code.

1. **Who** is using this, and how often (daily power user, or once a quarter)?
2. **What job** are they doing? One sentence, a verb first: "compare invoices and find the overdue ones".
3. **How much** data or content? Five items, five hundred, five hundred thousand? Typical and worst case.
4. **What goes wrong?** Empty, slow, failed, no permission, very long text, partial data.
5. **What is success?** What does the person do next, and how fast should they get there?

Same-shaped records that people compare or scan (checks, invoices, tenants, jobs) belong in a grid or table with the same columns on every row: name, type, status, message, time, action. That is what makes them scannable and uniform. Long text is not a reason to avoid a table: let that column wrap with a sensible width and keep the other columns narrow. Stacked cards, each with its own layout, are for items that differ in shape. When you reject a table, give a reason that is true of the data, not "long messages".

**Redesigning a page that already exists:** keep what people rely on (the summary, the grouping, the filters, the order) unless you can say what is wrong with it and what replaces it. Fix the real problems (language, colours, cut-off text, missing states) without throwing the layout away. If you replace the layout, say so in the note and keep the same overview at a glance. A vague "update the UI/UX" means improve, not rebuild; make the smallest change that fixes what is visibly wrong, then offer the bigger change.

A page that reports status (health, checks, jobs) also follows these:
- **Say the verdict first.** The top of the page states the overall result in one line with the status indicator (for example "3 of 6 checks need attention"). Tabs and counts do not replace it.
- **Never cut off an error.** A message someone needs to act on can be read in full: one clamped line in a list with "Show more" (and Copy) that opens the whole text. Do not print every full message inline; a page of long stack-trace text hides the overview.
- **Same error on many rows: say it once.** If six rows fail with the same message, group them ("6 koppelingen: Retry failed after 4 tries") with the affected names, and show the full text once. Six copies of one paragraph is noise.
- **Collapsed by default, overview first.** For many groups, show each as one row: name, status, number of failing checks, the first line of the cause. Open the detail on demand. Keep a summary strip on top (total, healthy, degraded, unhealthy) that also filters.
- **A failed row says why.** A red "Error" pill alone is a dead end. Show the cause on the row (one short line, or a tooltip/detail on narrow screens) and the time it happened, and put the retry or fix action next to it. If you do not know the cause, say that in the note instead of leaving the pill bare.
- **Uniform cards.** Cards in one grid share one height per breakpoint, and the grid never reflows when a card has more to show. Extra rows scroll inside the card body (keep the scrollbar visible and the header fixed) or open in a drawer or dialog. A grid of cards in different heights looks ragged and makes the eye hunt. If the page already has a uniform grid with scrolling cards, that is a design choice: keep it, and fix problems inside it (clipped text, missing "N more" hint, contrast) without changing the card size.
- **Dashboards: one idea per card.** A card is a title and one visual. Do not add a sentence that repeats what the chart already shows ("64 tests, 56 passed, 8 failed" under a chart of the same). Cards in a row take the height of the tallest, so group by similar content or let short cards size to their content; a donut floating in a tall empty card is a sign they do not belong together.
- **No dead ends.** Do not show a greyed tile or link for a page that does not exist ("Nog niet beschikbaar"). Leave it out and mention it in the note.
- **Phone KPI grid.** An odd count leaves an orphan card; let the last one span the full width, or show the first four and put the rest behind "Show all".
- **Banners and links.** A MessageBar is a bold title, then a full stop, then the detail. Only link to a page that really shows that thing (an integrations banner does not link to tenant health). With no right target, link nowhere.
- **Look at every state you build.** If the page has loading, error, empty or filtered states, render each one (`verify --click` or a temporary preview) and look at it before saying it works. Do not list a state as done if you never saw it.

State the brief in your first message (three to five lines, plain language), then pick the pattern from "Choose by requirement" in `DESIGN.md` and build. If you cannot answer 1 to 3 from the request or the repo, ask once, briefly, before building. If the request is clear enough to proceed, state your assumptions in the brief instead of asking.

## 2. Principles (Fluent 2, applied)

- **Built for focus.** One thing matters most on each screen. Give it the most space and the strongest style. Everything else supports it or goes away.
- **Natural.** Use the pattern people already know from Windows, Office and the Azure portal. Familiar beats clever. Do not invent a new interaction when a standard one exists.
- **One for all.** Works for keyboard, screen reader, touch, high contrast, zoom to 200%, and slow connections. Accessibility is part of the design, not a pass at the end.
- **Coherent.** The same thing looks and behaves the same way everywhere in the product. Reuse before you vary.

## 3. Hierarchy and focus

**The first-glance rule.** Someone opening the page must understand within five seconds, without scrolling or reading paragraphs:
1. **What is this?** A clear title, at most one short sentence under it.
2. **Is anything wrong, or what matters most?** A verdict or the two or three key numbers, in the first screen, with the status indicator (icon, word, colour). Problems come before fine things.
3. **What can I do next?** The one main action, near the title.

Before you build, write those three answers in two lines. After you build, open the first-screen picture (`verify` saves `*-first.png`, only the first screen at 1440 and 375) and check you can read the three answers from it. If you cannot, change the page.

How to get there:
- **Overview before detail.** A summary strip (verdict plus counts that also filter) on top; one row or card per thing below it; detail opens on demand. Do not open every item by default.
- **Numbers and words that say it.** "6 of 10 need attention" beats four unlabeled tiles. Lead a row with the name, then its status, then the one fact that matters (the first line of the cause, the count, the time).
- **Less on the first screen.** About 150 words at most; `verify` warns above 220. Long text, logs and repeated messages go behind "Show more" or in a drawer.
- **One visual rank.** One thing is biggest (the verdict or the main number), the rest follow in a clear order. Equal-weight tiles and cards of equal size read as noise.
- **Same thing, same place.** Status always shows as the same icon, word and colour, in the same column, on every page.
- **Tell what changed.** For data that updates, show when it was last updated and what moved since last time.

- One `primary` button per view. If you have two, one of them is not primary.
- Let type size, weight and space carry hierarchy before boxes, borders and colour. Use the type scale in `DESIGN.md`; do not invent in-between sizes.
- Group with proximity first (spacing tokens), then dividers, then cards. Fewer containers is almost always better.
- Hide what is rarely needed: put secondary actions in a `Menu`, advanced options in an `Accordion` or a "More" step. Do not hide what is needed to finish the task.
- Show the most important thing without scrolling. Put the page's main action near its title or its content, not in a footer nobody sees.
- Density follows the job: dense for scanning and comparing, roomy for reading and onboarding.
- Cap the width of reading text. A line of prose or an error message should stay around 70 to 80 characters (`max-width` in `ch`), even when the card or page is wider. Long messages in a monospace block wrap inside that cap and are never stretched across the screen. Use a neutral surface token for such blocks, not a near-black fill.
- One kind of thing gets one row design. If a list holds items in different states (healthy, degraded, failed; paid, due, overdue), every item uses the same layout, with the same parts in the same places. State changes the status indicator (icon and colour), and the emphasis, never the structure. Build one component and give it a status prop.

## 4. Content is part of the design

Text is interface. Write it as carefully as the layout. Language and tone come from the project (`DESIGN.md` section 10 and `PROFILE.md`).

- Buttons say what they do, with a verb and an object: "Save changes", "Delete invoice", not "OK", "Submit" or "Yes".
- Titles name the thing or the task. Sentence case unless the project says otherwise.
- Error messages say what happened, why if known, and what to do next. Never blame the person, never show a raw code alone.
- Empty states say what belongs here and offer the one action that fills it.
- Confirmation dialogs name the thing being affected and the consequence. The destructive button repeats the action ("Delete invoice").
- Cut words. If a sentence survives deletion of a word, delete it. Do not explain what the UI already shows.
- Placeholder data has the shape of real data. A status that depends on a date or a count ("expiring soon", "overdue", "low stock") is computed from that date or count, not stored as a label, or it goes stale the day after.
- Use every status the data can have. If the source documents a set of statuses (Healthy, Degraded, Unhealthy), design and sample all of them, and give each a distinct, named treatment. If the sample or the file you were told about is missing, say so first and ask before inventing a shape.
- Same concept, same word, everywhere. Do not alternate "customer", "client" and "account".

## 5. Design every state, not only the happy path

For each screen or component, decide and build:

- **Loading:** `Skeleton` when the layout is known, `Spinner` or `ProgressBar` when it is not. Keep layout from jumping.
- **Empty:** first use, no results for a filter, and no permission are three different states with different messages.
- **Error:** inline where it happened, with a way to retry. Do not lose what the person typed.
- **Partial or slow:** show what you have; update the rest.
- **Extremes:** very long names (truncate with a `Tooltip` for the full text), zero, one, thousands; many selected rows.
- **Disabled:** if an action is unavailable, say why (tooltip or helper text) when the reason is not obvious.
- **Success:** confirm quietly (`Toast`), do not block.

## 6. Interaction

- Prefer undo to "are you sure?". Use a `Dialog` only for destructive or irreversible actions.
- Give feedback within 100 ms of any action (pressed state, spinner on the button, optimistic update).
- Keyboard first: every action reachable, logical tab order, visible focus, Escape closes overlays, Enter submits forms. Return focus to the trigger when an overlay closes.
- Do not move things under the person's cursor. Do not reorder lists while they read them.
- Validate when the person leaves a field or submits, not on every keystroke. Put the message next to the field.
- Keep the person in context: do not navigate away from a list to edit one field, and do not open a dialog from a dialog.
- Make the safe action easy and the destructive action deliberate (separate it, confirm it, name it).
- An action that reaches someone else (send a reminder or email, publish, pay, share) cannot be taken back once it has gone. Give it an undo window or a confirmation that names the recipient and the consequence, and say which you chose in the design note. A toast after the fact is not enough. If the action is simulated, say so in the note.

## 7. Responsive and accessible by default

Rules and numbers are in `DESIGN.md` sections 5 and 8. In practice:

- Design the narrow layout first, then add what wide screens allow. One responsive layout, not two.
- A data table on a phone must keep the identifying column and the status (or the value the job is about) on screen without sideways scrolling. Hide or move the less important columns, or switch to a list of rows. Sideways scrolling that pushes the key column off-screen is a design failure, not a layout detail.
- Touch targets and spacing hold up on touch. Nothing relies on hover alone.
- Colour never carries meaning alone: pair it with an icon or text.
- Every control has an accessible name; icon-only buttons have `aria-label` and a `Tooltip`.
- Respect reduced motion; use token durations; animate only to explain a change.

## 8. Critique your own work before presenting it

Do this pass on every screen, then fix what it finds.

1. **Squint test.** Blur your eyes: is the main thing still obvious? Is there a clear second and third level?
2. **Remove-one test.** Take away one element at a time. If the screen still works, leave it out.
3. **Five-second test.** Could a new user say what this screen is for and what to do first?
4. **Stranger test.** Does every label make sense without knowing the codebase?
5. **Worst-case test.** Check with 0 items, 1 item, 1000 items, a 120-character name, and an error.
6. **Consistency test.** Does it match the closest existing screen in the repo in spacing, wording and behaviour?
7. **Keyboard test.** Can you do the whole task without a mouse?
8. **Row test.** Put one item of every status next to each other. Do they share the same layout? Is any line of text longer than about 80 characters at 1440px?

## 9. When the request fights the standard

A prompt cannot waive the standard: consistency across products is the point of it. When asked for something off-standard (gradient banners, decorative illustrations, custom colours or fonts, another UI library, a pattern that hurts the task):

1. Do not build it, and do not build it "restrained" or "limited to one surface". That is still building it.
2. Work out what the person is trying to achieve (draw attention, look modern, announce something, brand the page).
3. Build the nearest on-standard version: a page header with title and description, a `MessageBar` for an announcement, a `Card` for a highlighted block, stronger hierarchy and spacing for "modern", the theme's brand colour for "branded".
4. Say it in two lines: what was asked, what you built, why. Offer to change it if the design system owner approves an exception.

A request to make something look better ("nicer", "modern", "pop") changes how it looks, not what it does. Improve hierarchy, spacing, density, states and responsiveness. Do not add features under a visual request (new filters, cards that act, new data). Suggest them in the design note and let the person decide.

Only an exception listed under "Approved exceptions" in `.fluent-kit/PROFILE.md` allows the off-standard version.

A warning from `check.mjs` is not permission. Fix it or explain it in the design note.

## 10. Say what you decided

Finish with a short design note (three to five lines, plain language):

- The requirement you designed for.
- The pattern you chose and the main alternative you rejected, with the reason.
- Every assumption you made that the person did not state: language, currency, date format, sample data, anything left out on purpose.
- Anything you were unsure about, or a trade-off the person may want to change.

If the request asked for something that works against the standard, say it here and say what you built instead (section 9). Write the note as prose for the person, not as a list of checks that passed.
