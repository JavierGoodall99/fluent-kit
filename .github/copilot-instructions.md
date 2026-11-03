<!-- fluent-kit:start -->
## UI work (Fluent kit)

React UI uses Fluent UI v9 components, Fluent icons and `tokens` in `makeStyles` (or the project's shared UI package). No other UI or icon library, no Fluent v8, no hard-coded colours, sizes or spacing, no new packages except Fluent's own.

- The repo's design rules and `.fluent-kit/PROFILE.md` beat this kit; this kit beats an off-standard request (build the nearest on-standard version and say so).
- Change only what was asked: keep every field, action and layout, and reuse how the app already shows the same thing.
- UI text in the project's language. Never revert, stash or delete uncommitted changes.

Route: a prop, size, text or one control → `.github/skills/fluent-ui/tasks/small-fix.md`. Anything bigger → `.github/skills/fluent-ui/SKILL.md`.

Finish every UI change with `node .fluent-kit/scripts/check.mjs --finish --page /path` and fix its errors. It decides which checks to run; only when the person asks to skip checks, add `--no-verify` (the rules still run).
<!-- fluent-kit:end -->
