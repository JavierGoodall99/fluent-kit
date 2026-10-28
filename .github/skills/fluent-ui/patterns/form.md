# Pattern: form page

Create or edit something with many fields or sections, on its own page (a few fields of one record: `patterns/drawer.md`). Example: `examples/form-page.tsx`.

**Layout** (1440px)
- One centred column, about 480px wide.
- Blocks 20px apart (`spacingVerticalXL`). Section header 12px semibold (the group label) with a 14px `colorNeutralForeground3` description, 4px apart.
- Fields 12px apart (`spacingVerticalM`); label above the input, 8px between. Two short fields may share a row (12px gap).
- Inputs on the tinted page use `appearance="filled-lighter"`; on a white surface the default outline.
- Footer: thin `colorNeutralStroke2` divider above; Discard (secondary) then Save (primary), right-aligned, 8px apart; sticky at the bottom.

**Controls**
| Need | Use |
|---|---|
| short text | `Input` (`Textarea` for more than one line) |
| 2 to 5 visible choices | `RadioGroup` |
| many choices, or searchable | `Dropdown` with `Option`, or `Combobox` |
| several values, typed | `TagPicker` |
| date, time | `DatePicker`, `TimePicker` (companion packages) |
| applies immediately | `Switch`; a choice saved with the form: `Checkbox` |
| precise number | `SpinButton`; an imprecise range: `Slider` |

Every input sits in a `Field` with a visible label (`required`, `hint`, `validationMessage`). A placeholder is never the label.

**Behaviour**
- Validate when a field is left or on submit, not on every keystroke; the message sits under its field and says what to do.
- A failed save keeps what was typed and shows a `MessageBar` at the top with Retry; success is a quiet `Toast`.
- Multi-stage process: a full page with steps. Never put a long form in a dialog or a drawer.

**Narrow (under 640px)**
- One column, 16px side gutters; paired fields stack.
- Save full width and primary, Discard full width and secondary under it, 12px apart, pinned at the bottom of the screen.
- Groups of choices: a small group label above, rows about 48px high. Errors: a `MessageBar` at the very top.
- Use `size="large"` controls on touch-first layouts.
