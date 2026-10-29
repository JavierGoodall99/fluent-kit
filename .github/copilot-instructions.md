<!-- fluent-kit:start -->
## UI work (Fluent kit)

Use Fluent UI React v9 and Fluent icons (or the project's shared UI package).

**Precedence:** the repo's own design guidance and `.fluent-kit/PROFILE.md`, then this kit, then the prompt. An off-standard request (gradient, hero banner): build the nearest on-standard version, say so.

**Hard rules**
- No other UI or icon library, no Fluent v8, no emoji or hand-drawn icons.
- Fluent controls only: `Button`, `Input`, `Dropdown` (never `<select>` or Fluent `Select`), `DatePicker` (never `type="date"`), `Link`, `Table`/`DataGrid`, `Dialog`.
- No hard-coded colours, sizes, spacing, radii or shadows: `tokens` in `makeStyles`.
- UI text in the project's language.
- No new package except Fluent's companion packages (`deviations.md`): pin the version, name it in the note.
- Never revert, stash or delete uncommitted changes.
- A vague request ("make it better") is not permission to rebuild: keep every field, action and layout.
- Reuse how the app already shows the same thing; no second look.
- Edit each part of a file once.

**Small fix** (a prop, size, spacing, text, one control): read only `.github/skills/fluent-ui/tasks/small-fix.md`.

**Anything bigger** (restyle, new section, page or app): read `.github/skills/fluent-ui/SKILL.md` and follow its route.

**Always** finish, even a one-line change or a removal, with `node .fluent-kit/scripts/check.mjs --finish --page /path` and fix what it reports. Asked to skip, or a small fix to only an icon, text or colour: add `--no-verify`. Any size, spacing, width or layout change, a restyle, page or app: the browser check always runs. If you could not, say so.
<!-- fluent-kit:end -->
