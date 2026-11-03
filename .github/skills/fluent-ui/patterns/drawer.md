# Pattern: drawer and dialog

| The person needs to... | Use | Example |
|---|---|---|
| edit a few fields of one record without losing their place in the list | `OverlayDrawer` from the end | `examples/edit-drawer.tsx` |
| see details while still working with the page | `InlineDrawer` | |
| confirm a destructive or irreversible action | `Dialog` | `examples/confirm-dialog.tsx` |

Many fields or sections belong on a full page (`patterns/form.md`). A short hint tied to one spot is a `Tooltip` or `Popover`. Never use a dialog for a normal edit, and never open a dialog from a dialog.

**Drawer**
- Width through `size`: `small` (default), `medium` or `large`; never a width by hand. Its padding, title and shadow are Fluent's own.
- `DrawerHeader` with `DrawerHeaderTitle` and a close button (`Dismiss24Regular`, `aria-label`) in its `action` slot; optional back button.
- `DrawerBody`: fields 12px apart (`spacingVerticalM`).
- `DrawerFooter`: primary (Save) first, then Cancel, then an optional "..." menu.
- Save disabled while required fields are empty; validation next to the field; closing with unsaved changes asks first.

**Dialog**
- `Dialog` > `DialogSurface` > `DialogBody` with `DialogTitle`, `DialogContent`, `DialogActions`. Width, padding, radius, shadow and title are Fluent's own (a short question may cap the surface at 320px).
- The title names the action ("Delete 3 invoices?"); the body names what is affected and the consequence ("This cannot be undone").
- `DialogActions`: the primary action first, repeating the verb ("Delete"), then Cancel.
- Prefer undo to a confirmation when the action can be undone. An action that reaches someone else (send, publish, pay) gets a confirmation naming the recipient, or an undo window.

**Both**
- Escape closes; focus moves into the surface on open and back to the trigger on close.
- Check the open state: `verify --click "role=button[name='Edit']"` and look at it on the contact sheet.

**Narrow (under 640px)**: drawers and dialogs go full width. Dialog buttons stack with the primary on top. Drawer footer buttons stay full width at the bottom.
