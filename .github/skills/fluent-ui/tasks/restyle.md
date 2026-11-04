# Restyle an existing page

**Before you change anything**
1. `node .fluent-kit/scripts/context.mjs restyle`. Keep its theme and language; match its standard card.
2. Brief, three lines: who uses the page, the job, what they must see in five seconds.

**Rules**
- Improve, do not rebuild: keep the grouping and the order too, edit the file (never delete and recreate it), and say in the note what should go. Edit each part of a file once.
- A visual request changes how it looks, not what it does: no new filters, cards that act, or new data. Suggest those in the note.
- Fix what is visibly wrong first: language, colours, cut-off text, contrast, missing states, text lines over about 80 characters.
- First glance: verdict and key numbers on the first screen; detail behind a click; about 150 words on the first screen at most.
- One visual rank: one thing is biggest. Hierarchy from type size, weight and space before borders, boxes and colour.
- A uniform card grid with scrolling cards stays uniform: fix problems inside it, not its size.
- Muted is not invisible: "off" or "not set up" items use `colorNeutralForeground3` with the state in words, never `opacity`.
- Changing a shared component other pages use: say which pages it affects.

**Finish**: `node .fluent-kit/scripts/check.mjs --finish --page /page`. Answer the critique `verify` prints from the contact sheet once; change the page only where an answer is no.

**Reply**: the brief first, then a short design note: what you changed and why, what you kept on purpose, what you suggest but did not build, what you could not verify.
