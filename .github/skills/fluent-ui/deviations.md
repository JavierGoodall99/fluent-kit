# Where the kit differs from stock Fluent v9

Fluent's own defaults apply everywhere else. Read the section you need.

## Controls

| Instead of | Use |
|---|---|
| `<button>` | `Button`, `ToolbarButton`, `MenuItem` |
| `<input>` | `Input`, `Checkbox`, `Radio`, `Switch`, `SearchBox` |
| `<select>`, Fluent `Select`, `<option>` | `Dropdown` (with `Option`) or `Combobox`; 2 to 5 visible choices: `RadioGroup`. `Select` opens the operating system's list |
| `<Input type="date">`, `time`, `datetime-local`, `month`, `week` | `DatePicker` (`@fluentui/react-datepicker-compat`), `TimePicker` (`@fluentui/react-timepicker-compat`) |
| `<Input type="range">` | `Slider` |
| `<textarea>` | `Textarea` |
| `<a>` | `Link`, `NavItem`, `BreadcrumbItem` |
| `<table>` | `Table`, or `DataGrid` when rows sort or select |
| `<dialog>` | `Dialog`, only for confirmations |
| headings, paragraphs | `Text` (`as="h1"` for semantics) |

`<div>` and `<span>` are fine for layout. Every input sits in a `Field`. Official companion packages (date and time pickers, `@fluentui/react-charts`, `@fluentui-contrib/react-data-grid-react-window` for thousands of rows) may be added: pin the version and name it in the note. A separate install is never a reason to fall back to a native control.

## Icons

- `@fluentui/react-icons` only, Regular by default. Navigation and toggles use `bundleIcon(XFilled, XRegular)` so the active state is filled.
- Sizes: 16 inline with text, 20 in buttons and toolbars, 24 in navigation.
- Icon-only buttons have an `aria-label` and a `Tooltip`.

## Styling

- `makeStyles` with `tokens`; combine with `mergeClasses`, never string concatenation.
- Inline `style` only for values computed at runtime (a bar width).
- Never override `.fui-*` classes or the theme's font, radii, shadows or motion.
- Brand colour only through `tokens.colorBrand*`; status through `tokens.colorStatus*`. `colorPalette*` tokens are for status and data meaning, never decoration.
- No gradients, illustrations, hero banners or heavy shadows.

## Type scale (one size per role, every page)

| Role | Token |
|---|---|
| Page title (`h1`) | `fontSizeBase600` (24px), semibold |
| Section title (`h2`), empty-state title | `fontSizeBase400` (16px), semibold |
| Card title, board column header | `fontSizeBase300` (14px), semibold |
| Group label (form section, choice group) | `fontSizeBase200` (12px), semibold |
| Body | `fontSizeBase300`, regular |
| Caption, description | `fontSizeBase200`, regular, `colorNeutralForeground3` |
| Dialog and drawer titles | Fluent's own (`DialogTitle`, `DrawerHeaderTitle`); never set by hand |

Semibold for every emphasis; never `bold` or `fontWeightMedium`.

## Surfaces

- Controls keep the 4px theme radius. Dashboard, board and gallery cards use `borderRadiusXLarge` (8px) with `shadow4`; other cards keep Fluent `Card`'s defaults.
- Page background `colorNeutralBackground2`, sections and cards `colorNeutralBackground1`.

## Layout pieces

- **Nav:** stock `NavItem` is near-black when selected. Use `colorSubtleBackground` at rest, `colorSubtleBackgroundHover`, `colorSubtleBackgroundSelected` plus the accent bar. Set `surfaceMotion={null}` when the wrapper already animates, or it slides twice. See `examples/app-nav.tsx`.
- **Tabs and toolbars never clip:** wrap in `Overflow` / `OverflowItem` with a `useOverflowMenu` "..." menu. No sideways scrolling to hide it.
- **Buttons:** one `primary` per view. Dialog and drawer footers put the primary first; full-page forms and settings put Discard then Save, right-aligned.

## Next.js

- Files using `makeStyles`, hooks or handlers need `"use client"`. Pass strings, not icon components, from Server to Client Components.
- A hydration diff made only of `<i data-tabster-dummy>` is a known Fluent issue: mention it, do not restructure the page or add `suppressHydrationWarning`.
- Mount the virtualized `DataGrid` on the client only, with a `Spinner` until mounted.
