# Restyle an existing page

"Make it better", "easier to understand", "update the UI/UX", "make it pop".

**Before you change anything**
1. `node .fluent-kit/scripts/context.mjs restyle`: one call that prints the theme, the language, the repo's own guidance and `PROFILE.md` (both win over the kit), and the app's standard card style. Keep the theme and language; match the standard card.
2. Brief, three lines: who uses the page, the job, what they must see in five seconds.

**Rules**
- Improve, do not rebuild: keep the grouping and the order too, edit the file (never delete and recreate it), and say in the note what should go.
- A visual request changes how it looks, not what it does: no new filters, cards that act, or new data. Suggest those in the note.
- Fix what is visibly wrong first: language, colours, cut-off text, contrast, missing states, text lines over about 80 characters.
- First glance: in five seconds a person sees what the page is, whether anything is wrong, and what to do next. Verdict and key numbers on the first screen; detail behind a click; about 150 words on the first screen at most.
- One visual rank: one thing is biggest. Hierarchy from type size, weight and space before borders, boxes and colour.
- A uniform card grid with scrolling cards stays uniform: fix problems inside it, not its size.
- Muted is not invisible: "off" or "not set up" items use `colorNeutralForeground3` with the state in words, never `opacity`.
- No dead ends: no greyed link to a page that does not exist.
- Changing a shared component other pages use: say which pages it affects.

**Finish**: `node .fluent-kit/scripts/check.mjs --finish --page /page` (never `--no-verify`: a restyle is judged by looking at it). Answer the five-second questions `verify` prints from the contact sheet; if you cannot, change the page.

**Reply**: the brief first, then a short design note: what you changed and why, what you kept on purpose, what you suggest but did not build, what you could not verify.
