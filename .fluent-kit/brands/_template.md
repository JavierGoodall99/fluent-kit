# Brand: <product name>

Optional. Copy this file to `.fluent-kit/brands/<product>.md` to save a ramp worth keeping. An existing project's own theme file already is its brand file; the agent detects it (`.fluent-kit/scripts/detect-theme.mjs`).

## Official brand color

- Hex: TODO (take from brand guidelines, not from the current app)
- Source: TODO (guideline link or owner)

## Brand ramp

Generate with `node .fluent-kit/scripts/generate-ramp.mjs <hex>` (an approximation of Microsoft's Theme Designer), or paste an official ramp from the design owner. Paste all 16 steps.

```ts
import type { BrandVariants } from "@fluentui/react-components";

export const brand: BrandVariants = {
  10: "TODO", 20: "TODO", 30: "TODO", 40: "TODO",
  50: "TODO", 60: "TODO", 70: "TODO", 80: "TODO",
  90: "TODO", 100: "TODO", 110: "TODO", 120: "TODO",
  130: "TODO", 140: "TODO", 150: "TODO", 160: "TODO",
};
```

## Contrast check

| Pair | Ratio | Pass (4.5:1 text, 3:1 UI) |
|---|---|---|
| Primary button text on brand background | TODO | TODO |
| Brand link text on page background | TODO | TODO |
| Focus indicator on page background | TODO | TODO |

If a pair fails, record the agreed adjusted step here, not in component code.

## Allowed to vary for this product

- Brand ramp (above)
- Logo and product name

Everything else (fonts, spacing, radii, status colors) is shared and must not change.

## Supports dark mode

TODO yes / no
