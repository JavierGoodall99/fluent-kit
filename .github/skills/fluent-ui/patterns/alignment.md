# Pattern: spacing and alignment of data

Any page that shows values, rows or several blocks. A grid of cards holding rows of values: `examples/data-card.tsx`.

**Spacing**: these steps only, always as tokens (`spacingVertical*`, `spacingHorizontal*`).

| Step | Token | Between |
|---|---|---|
| 4px | `XS` | a title and its description; a label and its value |
| 8px | `S` | a label and its input; items in one group |
| 12px | `M` | fields; cards in a grid; list items |
| 16px | `L` | a card's padding and the parts inside it |
| 20px | `XL` | blocks and sections; page padding |

- Things that belong together sit closer than things that do not: the gap inside a group is smaller than the gap between groups.
- Space with `gap` on the parent, never `margin` on the children.

**Alignment**
- One left edge: page title, section titles and cards start at the same x, with no extra indent.
- Numbers (counts, money, durations, percentages): right-aligned, header too, with `fontVariantNumeric: "tabular-nums"` and the same decimals in a column. The unit goes in the header or label, not in every cell.
- Label and value pairs: one grid for all rows, so the values line up. `gridTemplateColumns: "1fr auto"` puts numbers at the right edge; `"max-content 1fr"` lines text values up on one left edge. The label is a caption in `colorNeutralForeground3`. Never one flex row per pair.
- Icon and text: `alignItems: "center"`; text in two sizes on one line: `"baseline"`. Icons in a column of rows share one size.
- Repeated rows and cards show the same parts in the same places. An empty value shows "-"; the row never collapses.
- Long text: one line with `textOverflow: "ellipsis"` and `minWidth: 0`, or 2 to 3 lines with a line clamp; the full text in a `Tooltip` or the detail.
