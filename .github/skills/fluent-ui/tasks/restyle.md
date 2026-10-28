# Restyle an existing page

"Make it better", "easier to understand", "update the UI/UX", "make it pop".

**Before you change anything**
1. `node .fluent-kit/scripts/detect-theme.mjs .`: keep the theme and the language it reports. Read `.fluent-kit/PROFILE.md` if it exists; the repo's own design guidance, if listed, wins.
2. Anything card-like on the page: `node .fluent-kit/scripts/consistency.mjs`. It names the app's standard card style and the pages that differ.
3. Brief, three lines: who uses the page, the job, what they must see in five seconds.

**Rules**
- Improve, do not rebuild. Keep every field, column, filter, action, the grouping, the order and the layout. Edit the file; never delete and recreate it. If something should go, say so in the note.
- A visual request changes how it looks, not what it does: no new filters, cards that act, or new data. Suggest those in the note.
- Fix what is visibly wrong first: language, colours, cut-off text, contrast, missing states, text lines over about 80 characters.
- First glance: in five seconds a person sees what the page is, whether anything is wrong, and what to do next. Verdict and key numbers on the first screen; detail behind a click; about 150 words on the first screen at most.
- One visual rank: one thing is biggest. Hierarchy from type size, weight and space before borders, boxes and colour.
- Same kind of thing, same look across the app: reuse the card, header, badge and spacing the rest of the app uses. A uniform card grid with scrolling cards stays uniform; fix problems inside it, not its size.
- Muted is not invisible: "off" or "not set up" items use `colorNeutralForeground3` with the state in words, never `opacity`.
- No dead ends: no greyed link to a page that does not exist.
- Changing a shared component other pages use: say which pages it affects.

**Finish**: `node .fluent-kit/scripts/check.mjs --finish --page /page`. Answer the five-second questions `verify` prints from the contact sheet; if you cannot, change the page.

**Reply**: the brief first, then a short design note: what you changed and why, what you kept on purpose, what you suggest but did not build, what you could not verify.
