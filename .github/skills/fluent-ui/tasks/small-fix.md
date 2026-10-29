# Small fix

A prop, a size, spacing, text or one control: about 20 lines.

- Change only what was asked, in the file that has it.
- Unsure about a control, icon or style: read its row in `deviations.md`. Nothing else.
- New text in the project's language, worded like the strings around it.
- Removing something: also delete the import it leaves behind.
- A problem you notice elsewhere: mention it, do not fix it.

**Finish**: `node .fluent-kit/scripts/check.mjs --finish --page /page --no-verify`: rules and `tsc`, a few seconds, enough for an icon, text or colour. Changed size, spacing or layout, or added something that could wrap or overflow: leave out `--no-verify` so the browser check runs (the command ignores it for those changes anyway), and look at the contact sheet it names.

**Reply** in one line: what changed, and what you could not verify.
