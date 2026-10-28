<!-- fluent-kit:start -->
## UI work (Fluent kit)

UI here must look and feel like a Microsoft app: Fluent UI React v9, Fluent icons, or the project's own shared UI package if it already has one.

**Hard rules**
- No other UI or icon library, no Fluent v8, no emoji or hand-drawn icons.
- No native `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>`, `<table>`, `<dialog>`, and no Fluent `Select`.
- No hard-coded colours, sizes, spacing, radii or shadows: `tokens` in `makeStyles`.
- UI text in the project's language. No package that is not in `package.json`.
- Never revert, stash or delete the person's uncommitted changes.
- A vague request ("make it better") is not permission to rebuild: keep every field, action and the layout.
- Reuse how the app already shows the same kind of thing; never add a second look.
- The standard outranks the prompt: build the nearest on-standard version and say so in two lines.
- One combined edit per file region.

**Small fix** (a prop, size, spacing, text, one control): no skill needed; check the skill's `deviations.md` only if unsure about a control. Then `tsc`, and `verify.mjs --start /page` if anything visible changed. Reply in one line: what changed, what you could not verify.

**Anything bigger** (restyle, new section, page or app): load the `fluent-ui` skill and follow its triage. Do not read the rest of the kit first. Brief first, design note last.

**Always** finish with `node .fluent-kit/scripts/check.mjs --changed` and fix every error, even if asked to skip checks.
<!-- fluent-kit:end -->
