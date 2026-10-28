# New page, section, shell or overlay

**Before you build**
1. `node .fluent-kit/scripts/detect-theme.mjs .`: keep the theme; text in the language it reports. Read `.fluent-kit/PROFILE.md` if it exists; the repo's own design guidance wins.
2. Reuse the project's existing component or page for the job. Card-like pieces: `node .fluent-kit/scripts/consistency.mjs`, then match the standard style.
3. Brief, three to five lines, first: who uses it, the job, how much data, what can go wrong, what they see in five seconds. Cannot answer who, job or how much: ask once.
4. Open the pattern card and its example. Copy the structure, not the placeholder data.

**No card fits**: a `Card` grid to browse; `Tree` for a hierarchy; a detail page for a large record; a stepped full page for a multi-stage process; an `InlineDrawer` for filters. Two fit: what the repo already does, then the simpler. Never invent one.

**Build**
- Every state: loading (`Skeleton` for a known layout), empty, error with retry, partial, long text, 0 / 1 / 1000 items.
- Status comes from real data: look at one real record of each kind (API sample, fixture, type, or ask) and name your basis. Placeholders (`null`, `""`, "Empty") mean "not set up". The same badge on every item: show it once. Numbers shown together agree.
- Buttons say what they do ("Delete invoice"); errors say what happened and what to do. Strings go in the project's i18n files, if any.

**Check**: `check --changed`, `tsc`, `node .fluent-kit/scripts/verify.mjs --start /page --full`, with `--click "role=button[name='...']"` for anything behind a click. On the contact sheet: is the main thing obvious, can anything go, would a stranger understand every label, does it match the nearest page?

**Reply**: the brief first; last, a design note: the requirement, the pattern and the rejected alternative, anything built differently from what was asked, assumptions (language, currency, sample data), what you could not verify.
