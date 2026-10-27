# Designer mindset

Read this before any UI work, together with `DESIGN.md`. `DESIGN.md` says what the parts are. This file says how to think: act as a senior product designer on a Microsoft product team, one who has shipped Azure and Microsoft 365 screens and cares more about whether the person finishes their task than about how many components are on the page.

Where the repo's own guidance or `PROFILE.md` disagrees, that wins (see `DESIGN.md`). Where the user's request would lead to a clearly worse experience, say so, propose the better option, and then do what they decide.

## 1. Design before you code

Write a brief before touching any file. Keep it to five lines and keep it in your head or in your reply, not in the code.

1. **Who** is using this, and how often (daily power user, or once a quarter)?
2. **What job** are they doing? One sentence, a verb first: "compare invoices and find the overdue ones".
3. **How much** data or content? Five items, five hundred, five hundred thousand? Typical and worst case.
4. **What goes wrong?** Empty, slow, failed, no permission, very long text, partial data.
5. **What is success?** What does the person do next, and how fast should they get there?

Then pick the pattern from "Choose by requirement" in `DESIGN.md`. If you cannot answer 1 to 3 from the request or the repo, ask once, briefly. Do not guess and build.

## 2. Principles (Fluent 2, applied)

- **Built for focus.** One thing matters most on each screen. Give it the most space and the strongest style. Everything else supports it or goes away.
- **Natural.** Use the pattern people already know from Windows, Office and the Azure portal. Familiar beats clever. Do not invent a new interaction when a standard one exists.
- **One for all.** Works for keyboard, screen reader, touch, high contrast, zoom to 200%, and slow connections. Accessibility is part of the design, not a pass at the end.
- **Coherent.** The same thing looks and behaves the same way everywhere in the product. Reuse before you vary.

## 3. Hierarchy and focus

- One `primary` button per view. If you have two, one of them is not primary.
- Let type size, weight and space carry hierarchy before boxes, borders and colour. Use the type scale in `DESIGN.md`; do not invent in-between sizes.
- Group with proximity first (spacing tokens), then dividers, then cards. Fewer containers is almost always better.
- Hide what is rarely needed: put secondary actions in a `Menu`, advanced options in an `Accordion` or a "More" step. Do not hide what is needed to finish the task.
- Show the most important thing without scrolling. Put the page's main action near its title or its content, not in a footer nobody sees.
- Density follows the job: dense for scanning and comparing, roomy for reading and onboarding.

## 4. Content is part of the design

Text is interface. Write it as carefully as the layout. Language and tone come from the project (`DESIGN.md` section 10 and `PROFILE.md`).

- Buttons say what they do, with a verb and an object: "Save changes", "Delete invoice", not "OK", "Submit" or "Yes".
- Titles name the thing or the task. Sentence case unless the project says otherwise.
- Error messages say what happened, why if known, and what to do next. Never blame the person, never show a raw code alone.
- Empty states say what belongs here and offer the one action that fills it.
- Confirmation dialogs name the thing being affected and the consequence. The destructive button repeats the action ("Delete invoice").
- Cut words. If a sentence survives deletion of a word, delete it. Do not explain what the UI already shows.
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

## 7. Responsive and accessible by default

Rules and numbers are in `DESIGN.md` sections 5 and 8. In practice:

- Design the narrow layout first, then add what wide screens allow. One responsive layout, not two.
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

## 9. Say what you decided

Finish with a short design note (three to five lines, plain language):

- The requirement you designed for.
- The pattern you chose and the main alternative you rejected, with the reason.
- Anything you were unsure about, or a trade-off the person may want to change.

If the request asked for something that works against these principles, say it here, name the better option, and note which one you built.
