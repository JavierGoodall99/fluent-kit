# Kit rules the cards and examples do not show

## Icons
- `@fluentui/react-icons` only, Regular by default. Navigation and toggles use `bundleIcon(XFilled, XRegular)` so the active state is filled.
- Sizes: 16 inline with text, 20 in buttons and toolbars, 24 in navigation. Icon-only buttons have an `aria-label` and a `Tooltip`.

## Styling
- `makeStyles` with `tokens`; combine with `mergeClasses`, never string concatenation. Inline `style` only for values computed at runtime (a bar width).
- Never override `.fui-*` classes or the theme's font, radii, shadows or motion.
- Brand colour only through `tokens.colorBrand*`, status through `tokens.colorStatus*`. `colorPalette*` tokens carry status and data meaning, never decoration.
- `<div>` and `<span>` are fine for layout. Every input sits in a `Field`.

## Tabs and toolbars
They never clip: wrap them in `Overflow` / `OverflowItem` with a `useOverflowMenu` "..." menu. No sideways scrolling to hide it.

## Companion packages
`@fluentui/react-datepicker-compat`, `@fluentui/react-timepicker-compat`, `@fluentui/react-charts`, and `@fluentui-contrib/react-data-grid-react-window` with `react-window@1`. Pin the version and name it in the note. A separate install is never a reason to use a native control.
