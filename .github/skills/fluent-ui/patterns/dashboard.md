# Pattern: card canvas (dashboard, gallery, board)

| The person needs to... | Layout | Example |
|---|---|---|
| see an overview of several measures | dashboard: a grid of cards, one message each | `examples/dashboard.tsx` |
| browse groups of things (recent files, projects) | gallery: sections, each a title row and a row of cards | `examples/gallery-page.tsx` |
| move items through stages | board: a column per stage, a card per item | `examples/task-board.tsx` |

**Shared measurements**
- Card: the standard card (`SKILL.md`), padding 16px (`spacingHorizontalL`), 16px gap inside.
- Card title, a caption description, an optional "..." `Menu`.
- Cards in one row share one height; extra content scrolls inside the card or opens a drawer.

**Dashboard**
- 12px (`spacingHorizontalM`) between cards; `repeat(auto-fit, minmax(min(100%, 340px), 1fr))`; about 6 cards at most.
- One idea per card: a title, one chart or number, a one-sentence summary (the chart's text alternative), a "View details" link. Never a sentence repeating the chart.
- A time-range switch (7, 30, 60 days, small `TabList`) sits inside the card it changes.
- Charts: `@fluentui/react-charts` (a companion package), theme colours, `LineChart` not `AreaChart`.

**Gallery**
- Page title, then sections 20px apart. Section title row 32px high: a section title, "See more" link at the right, 8px above its cards.
- Cards 12px apart, equal width (`minmax(min(100%, 220px), 1fr)`), about 250px high. The card title is the link; no nested buttons on a clickable card.

**Board**
- Columns 20px apart; column header (card title style) with the count; a full-width outline "Add" button under it; cards 12px apart.
- A card shows a title, one owner, one status line; details open in a drawer or page. A "Move to" menu on every card replaces drag and drop.

**Narrow (under 640px)**: one column, cards full width, 12px apart, same card style. An odd number of KPI cards: the last one spans the row, or show four and "Show all". Board columns stack.
