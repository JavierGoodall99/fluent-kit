---
applyTo: "**/*.tsx,**/*.ts,**/*.css"
---

# UI code rules (Fluent UI v9)

## Libraries (hard rule)

- Components come from `@fluentui/react-components`, or from the project's own shared UI package if it already depends on one. No other UI library. No `@fluentui/react` (v8).
- Icons come from `@fluentui/react-icons`. No other icon library, no emoji, no custom SVG icons, no icon fonts.
- Do not write native `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>`, `<table>`, `<dialog>`. Use the Fluent component.
- `<div>` and `<span>` are fine for layout, styled with `makeStyles`.

| Instead of | Use |
|---|---|
| `<button>` | `Button`, `ToolbarButton`, `MenuItem` |
| `<input>` | `Input`, `Checkbox`, `Radio`, `Switch`, `SearchBox` |
| `<select>` | `Select`, `Dropdown`, `Combobox` |
| `<textarea>` | `Textarea` |
| `<a>` | `Link`, `NavItem`, `BreadcrumbItem` |
| `<table>` | `Table`, `DataGrid` |
| `<dialog>` | `Dialog` |
| headings and paragraphs | `Text` (use `as="h1"` etc. for semantic headings), or `Title1`, `Subtitle1`, `Body1`, `Caption1` |

## Icons

```tsx
import { bundleIcon, Home24Filled, Home24Regular, Add20Regular } from "@fluentui/react-icons";
import { Button, NavItem } from "@fluentui/react-components";

const HomeIcon = bundleIcon(Home24Filled, Home24Regular);

<NavItem icon={<HomeIcon />} value="home">Home</NavItem>
<Button appearance="primary" icon={<Add20Regular />}>New</Button>
```

- Use the Regular style by default. Use `bundleIcon(Filled, Regular)` for navigation and toggles so the active state is filled.
- Sizes: 16 inline with text, 20 in buttons and command bars, 24 in navigation.
- Icon-only buttons need `aria-label`.

## Styling

Style with `makeStyles` and `tokens`. Combine classes with `mergeClasses`.

```tsx
import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
});
```

Rules:

- No hex, `rgb()`, `hsl()` or named colors. Tokens only.
- No raw `px` for padding, margin, gap, or radius. Use `tokens.spacing*` and `tokens.borderRadius*`.
- No inline `style={{ }}` for color, spacing, or typography. Inline style is acceptable only for values computed at runtime (for example a chart bar width).
- No global CSS overrides of Fluent class names (`.fui-*`). Use component props and slots.
- Do not override the theme's font, radii, or shadows. Fluent's defaults are what make the app feel like a Microsoft product.
- Use `mergeClasses`, never string concatenation, to combine classes.

## Components and patterns

- Check whether the project already has a component for the job (page header, data table, form layout), in its shared UI package or in the repo. If so, use it.
- Otherwise use the Fluent v9 component directly. Do not rebuild Button, Input, Select, Dialog, Table, TabList/Tab, Toast, or MessageBar.
- Wrap inputs in `Field` for labels, hints, and validation messages.
- Buttons: one `appearance="primary"` per view. Secondary actions use `secondary` or `subtle`.
- Follow the page patterns in `.fluent-kit/DESIGN.md` section 5. In short: app shell with left nav, command bar (`Toolbar`) above lists, `Dialog` only for confirmations, `MessageBar` for inline status. For lists, details and edits, state the requirement in one line and pick from the "Choose by requirement" table (grid, table, list, cards, drawer, detail page, full-page form…). No presentation is the default.

## Theming

- The root of every app is a `FluentProvider` with the product theme. If the project already has a provider or theme wrapper, use it as is; otherwise follow `examples/theme.tsx` in the fluent-ui skill.
- Components never import a theme directly. They read it through tokens.
- Brand color shows up only through `tokens.colorBrand*`. Never reference the product's brand hex.

## Accessibility (required)

- Every interactive element is reachable and operable by keyboard, with a visible focus state. Fluent provides this; do not remove it.
- Do not use color alone to carry meaning. Pair status colors with an icon or text.
- Respect `prefers-reduced-motion`. Use Fluent motion tokens rather than custom durations.
