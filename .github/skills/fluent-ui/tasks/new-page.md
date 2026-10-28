# New page, section, shell or overlay

**Before you build**
1. `node .fluent-kit/scripts/context.mjs new-page` (skip it if you came from `tasks/new-app.md`): one call for the theme, language, the repo's own guidance and `PROFILE.md` (both win), and the standard card style.
2. Reuse the project's existing component or page for the job, and the standard card style.
3. Brief, three lines, first: who uses it, the job, how much data, what can go wrong, what they see in five seconds. Cannot answer who, job or how much: ask once.
4. Open the pattern card and its example. Copy the structure, not the placeholder data.

**No card fits**: a `Card` grid to browse; `Tree` for a hierarchy; a detail page for a large record; a stepped full page for a multi-stage process; an `InlineDrawer` for filters. Two fit: what the repo already does, then the simpler. Never invent one.

**Build**
- Every state: loading (`Skeleton` for a known layout), empty, error with retry, partial, long text, 0 / 1 / 1000 items.
- Status comes from real data: look at one real record of each kind (API sample, fixture, type, or ask) and name your basis. Placeholders (`null`, `""`, "Empty") mean "not set up". The same badge on every item: show it once. Numbers shown together agree.
- Buttons say what they do ("Delete invoice"); errors say what happened and what to do. Strings go in the project's i18n files, if any.

**Finish**: `node .fluent-kit/scripts/check.mjs --finish --page /page --full`, plus `--click "role=button[name='...']"` for anything behind a click. Answer the critique `verify` prints.

**Reply**: the brief first; last, a design note of at most four bullets: the requirement and the pattern (and the one you rejected), anything built differently from what was asked, assumptions (language, currency, sample data), what you could not verify.
