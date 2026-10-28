# Pattern: settings page

A few preferences, changed now and then, saved once for the whole page. Not for a record someone edits (`patterns/drawer.md`). Example: `examples/settings-page.tsx`.

**Layout** (1440px)
- One centred column, max 480px; blocks 20px apart.
- Section: `h2` title (16px semibold) with a 14px `colorNeutralForeground3` description, 4px apart, 12px above its group.
- Group: one surface, `colorNeutralBackground1`, `borderRadiusXLarge`, `shadow4`, thin `colorNeutralStroke2` border; rows separated by a `colorNeutralStroke2` divider, no shadow per row.

**Rows** (48px minimum, 12px side padding)
| Setting | Row |
|---|---|
| on or off | label at the start, `Switch` at the end (`labelPosition="before"`) |
| a few independent options | `Checkbox` rows |
| one value from a list | label, current value in `colorNeutralForeground3`, chevron; opens a detail view with a `RadioGroup`. The detail view is a real route, so Back works |

- The label says what the setting does ("Send email notifications"), never "On/Off".
- Changes are a draft until Save. One Save for the page, not one per row.

**Footer**: sticky, a divider above; Discard changes (secondary) then Save changes (primary), right-aligned, 8px apart. Both disabled until something changed; Save shows a `Spinner` while saving.

**States**
- Save failed: a `MessageBar` (`intent="error"`, multiline) at the top of the column, edits kept, Retry and dismiss. Focus moves to it.
- Saved: a success `Toast`. Leaving with unsaved changes: say so.
- Coming back from a detail view: focus returns to the row that opened it.

**Narrow (under 640px)**
- The same groups of 48px rows.
- Footer buttons full width, stacked with Save on top, 12px apart.
- A detail view keeps a breadcrumb back to Settings.
