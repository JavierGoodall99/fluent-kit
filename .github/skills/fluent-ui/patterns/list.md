# Pattern: list of records

Scan, compare, sort or select same-shaped records.

**Pick by size**
| Records | Use | Example |
|---|---|---|
| up to a few hundred, sort or select | `DataGrid` (the project's shared table first, if any) | `examples/list-page.tsx` |
| thousands, held in the browser | virtualized `DataGrid` from `@fluentui-contrib/react-data-grid-react-window` + `react-window@1` (companion packages) | `examples/large-list.tsx` |
| too many for the browser, or on a server | server-side search, sort and paging; total count; search and sort in the URL | |
| a few, no sorting or selecting | `Table` | |
| one column of information | `List` | |

**Layout** (1440px)
- 12px (`spacingVerticalM`) between blocks.
- Command bar: one full-width `Toolbar` on its own `colorNeutralBackground1` surface. Order: New (the one primary), Delete, then view actions (Refresh); filter and a ~200px `SearchBox` at the right. Actions that need a selection stay visible but disabled.
- Grid on a `colorNeutralBackground1` surface, `borderRadiusMedium`, `colorNeutralStroke2` border. Footer: row count, a caption in `colorNeutralForeground2`.

**Measurements**
- Row and header heights are Fluent's own: the default `size`, or `size="small"` for dense admin grids; a two-line cell grows its row. Never set row heights by hand.
- Cells: 8px left, 16px right padding; body text, secondary text a caption in `colorNeutralForeground2`.
- Centred column (check marks, status icons): a class with `justifyContent: "center"` on the `DataGridCell`, and on the header through its slot: `<DataGridHeaderCell button={{ className: s.centred }}>`. A class on the header cell itself does nothing (the text stays left).
- `List` (it has no heights of its own): set the header to 48px and rows to 44px, with 1px `colorNeutralStroke2` dividers.
- Virtualized: fixed row height (44px), one-line cells (`TableCellLayout truncate`), memoized row renderer; Next.js mounts it on the client only.

**States**: `Skeleton` rows while loading; empty list ("No invoices yet" + the action that adds one) differs from no results ("No matches" + clear filters); load error in a `MessageBar` above the grid with Retry.

**Narrow (under 640px)**
- Keep the name and the status on screen; hide other columns or move one short value under the name. Never scroll sideways to reach the key column.
- Rows keep Fluent's height; a cell wraps to two lines at most.
- Toolbar: icon-only buttons (named, with a `Tooltip`), extras in an `Overflow` "..." menu, on the same line as search.
