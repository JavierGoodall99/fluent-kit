# Small fix

A prop, a size, spacing, text or one control: about 20 lines.

- Change only what was asked, in the file that has it.
- Unsure about a control, icon or style: read its row in `deviations.md`. Nothing else.
- New text in the project's language, worded like the strings around it.
- A problem you notice elsewhere: mention it, do not fix it.

**Finish**: `node .fluent-kit/scripts/check.mjs --finish --page /page`. It runs the rules, `tsc`, and `verify` only if something visible changed; fix what it reports and look at the contact sheet it names.

**Reply** in one line: what changed, and what you could not verify.
