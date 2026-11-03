# Small fix

A prop, a size, spacing, text or one control: about 20 lines.

- Change only what was asked, in the file that has it.
- Unsure about a control, icon or style: read its section in `deviations.md`. Nothing else.
- New text in the project's language, worded like the strings around it.
- Removing something: also delete the import it leaves behind.
- A problem you notice elsewhere: mention it, do not fix it.

**Finish**: `node .fluent-kit/scripts/check.mjs --finish --page /page`. It skips the browser for a text or icon edit and runs it for anything that can move or recolour the page; then look at the contact sheet it names.

**Reply** in one line: what changed, and what you could not verify.
