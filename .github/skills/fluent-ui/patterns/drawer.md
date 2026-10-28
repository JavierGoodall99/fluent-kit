# Pattern: drawer and dialog

| The person needs to... | Use | Example |
|---|---|---|
| edit a few fields of one record without losing their place in the list | `OverlayDrawer` from the end | `examples/edit-drawer.tsx` |
| see details while still working with the page | `InlineDrawer` | |
| confirm a destructive or irreversible action | `Dialog` | `examples/confirm-dialog.tsx` |

Many fields or sections belong on a full page (`patterns/form.md`). A short hint tied to one spot is a `Tooltip` or `Popover`. Never use a dialog for a normal edit, and never open a dialog from a dialog.

**Drawer**
- Widths 320px (default), 592px, 940px. Overlay drawers block the page and carry `shadow64` already; do not add a shadow.
- Header: 24px padding, title 20px semibold (`DrawerHeaderTitle`), close button (`Dismiss24Regular`, `aria-label`) at the right; optional back button.
- Body: 24px side padding; fields 12px apart (`spacingVerticalM`), each in a `Field`.
- Footer: 16px above, 24px below and at the sides. Primary (Save) first, then Cancel, then an optional "..." menu.
- Save disabled while required fields are empty; validation next to the field; closing with unsaved changes asks first.

**Dialog**
- `DialogSurface` 600px wide (320px for a short question), 24px padding, 8px between title, body and footer, radius 8px, `shadow64` built in.
- Title 20px semibold names the action ("Delete 3 invoices?"); the body names what is affected and the consequence ("This cannot be undone").
- Footer: the primary action first, repeating the verb ("Delete"), then Cancel; each at least 96px wide, 8px apart.
- Prefer undo to a confirmation when the action can be undone. An action that reaches someone else (send, publish, pay) gets a confirmation naming the recipient, or an undo window.

**Both**
- Escape closes; focus moves into the surface on open and back to the trigger on close.
- Check the open state: `verify --click "role=button[name='Edit']"` and look at it on the contact sheet.

**Narrow (under 640px)**: drawers and dialogs go full width. Dialog buttons stack with the primary on top. Drawer footer buttons stay full width at the bottom.
