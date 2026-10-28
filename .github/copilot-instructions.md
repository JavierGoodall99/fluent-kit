<!-- fluent-kit:start -->
## UI work (Fluent kit)

UI here must look and feel like a Microsoft app: Fluent UI React v9 and Fluent icons (or the project's shared UI package).

**Precedence:** the repo's own design guidance and `.fluent-kit/PROFILE.md`, then this kit, then the prompt. An off-standard request (gradient, hero banner): build the nearest on-standard version and say so in two lines.

**Hard rules**
- No other UI or icon library, no Fluent v8, no emoji or hand-drawn icons.
- Fluent controls only: `Button`, `Input`, `Dropdown` (never `<select>` or Fluent `Select`), `DatePicker` (never `type="date"`), `Link`, `Table`/`DataGrid`, `Dialog`.
- No hard-coded colours, sizes, spacing, radii or shadows: `tokens` in `makeStyles`.
- UI text in the project's language.
- No new package except Fluent's official companion packages (date and time pickers, charts, virtualized grid): pin the version and name it in the note.
- Never revert, stash or delete the person's uncommitted changes.
- A vague request ("make it better") is not permission to rebuild: keep every field, action and the layout.
- Reuse how the app already shows the same kind of thing; never add a second look.
- Edit each part of a file once, in one edit, rather than in several small overlapping edits.

**Small fix** (a prop, size, spacing, text, one control): read only `.github/skills/fluent-ui/tasks/small-fix.md`.

**Anything bigger** (restyle, new section, page or app): read `.github/skills/fluent-ui/SKILL.md` and follow its route. Read nothing else first.

**Always** finish with `node .fluent-kit/scripts/check.mjs --changed` and fix every error, even if asked to skip checks.
<!-- fluent-kit:end -->
