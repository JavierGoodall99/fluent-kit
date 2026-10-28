# Small fix

A prop, a size, spacing, text or one control: about 20 lines.

- Change only what was asked, in the file that has it. Keep the layout, sizes, card style and every field and action.
- Unsure about a control, icon or style: read its row in `deviations.md`. Nothing else.
- New text in the project's language, worded like the strings around it.
- A problem you notice elsewhere: mention it, do not fix it.

**Check**
1. `node .fluent-kit/scripts/check.mjs --changed`: fix every error.
2. `tsc`.
3. Anything visible changed (layout, spacing, cut-off text): `node .fluent-kit/scripts/verify.mjs --start /page` (the default quick pass) and look at the contact sheet it names. Nothing visible changed: skip it.

**Reply** in one line: what changed, and what you could not verify.
