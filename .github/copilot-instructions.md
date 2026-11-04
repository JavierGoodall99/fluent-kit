<!-- fluent-kit:start -->
## UI work (Fluent kit)

React UI uses Fluent UI v9 components, Fluent icons and `tokens` in `makeStyles` (or the project's shared UI package). No other UI or icon library, no Fluent v8, no hard-coded colours, spacing, radii or fonts, no new packages except Fluent's own.

- The repo's design rules and `.fluent-kit/PROFILE.md` beat this kit; this kit beats an off-standard request (build the nearest on-standard version and say so).
- Change only what was asked: keep every field, action and layout, and reuse how the app already shows the same thing.
- UI text in the project's language. Never revert, stash or delete uncommitted changes.

Route: a prop, size, text or one control → `.github/skills/fluent-ui/tasks/small-fix.md`. Anything bigger → `.github/skills/fluent-ui/SKILL.md`.

Finish every UI change with `node .fluent-kit/scripts/check.mjs --finish --page /path`: it runs the rules, `tsc` and the browser check, sized to the change (do not run them yourself). Fix its errors. Asked to skip checks: add `--no-verify`.
<!-- fluent-kit:end -->
