# Kit rules the cards and examples do not show

## Icons
- `@fluentui/react-icons` only, Regular by default. Navigation and toggles use `bundleIcon(XFilled, XRegular)` so the active state is filled.
- Sizes: 16 inline with text, 20 in buttons and toolbars, 24 in navigation. Icon-only buttons have an `aria-label` and a `Tooltip`.

## Styling
- `makeStyles` with `tokens`; combine with `mergeClasses`, never string concatenation. Inline `style` only for values computed at runtime (a bar width).
- Never override `.fui-*` classes or the theme's font, radii, shadows or motion.
- Brand colour only through `tokens.colorBrand*`, status through `tokens.colorStatus*`. `colorPalette*` tokens carry status and data meaning, never decoration.
- `<div>` and `<span>` are fine for layout. Every input sits in a `Field` (`patterns/form.md`).

## Tabs and toolbars
They never clip: wrap them in `Overflow` / `OverflowItem` with a `useOverflowMenu` "..." menu. No sideways scrolling to hide it.

## Companion packages
Install these exact versions (the kit checks against them; no need to look them up) and name them in the note: `@fluentui/react-charts@9.3.29`, `@fluentui/react-datepicker-compat@0.6.40`, `@fluentui/react-timepicker-compat@0.4.42`, `@fluentui-contrib/react-data-grid-react-window@1.4.2` with `react-window@1.8.11`. A separate install is never a reason to use a native control.
