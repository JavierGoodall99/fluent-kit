# Organisation profile: DataBalk

Copy this file to `.fluent-kit/PROFILE.md` (the installer does this with `--profile databalk`). It overrides the defaults in `DESIGN.md`.

## Language and tone

- **All user-facing text is Dutch (nl-NL).** Labels, buttons, placeholders, validation messages, empty states, toasts, dialogs, `aria-label`s and tooltips. Code, identifiers, comments and commit messages stay in English.
- Address the user formally: "u" and "uw", never "je", "jij" or "jouw". Example: "Weet u zeker dat u dit document wilt verwijderen?". Applies to every product.
- Sentence case: "Filters wissen", "Kolommen bewerken", "Nieuw document".
- Set `lang="nl"` on the document.
- Dates, numbers and currency go through `Intl` with `nl-NL` (for example `1.234,56` and `27-10-2026`), never hand-formatted.
- Put strings in the project's i18n/resource files, not inline in JSX, so English can be added later.
- Environment badges (TEST, ACCEPTATIE) are uppercase.

## Shared packages

- None confirmed. Use a shared UI or theme package only if the project already depends on one.

## Brand

- Each product keeps its own brand ramp. Existing products keep the ramp they have. Do not set brand colors by hand: the agent detects them (`.fluent-kit/scripts/detect-theme.mjs`).
