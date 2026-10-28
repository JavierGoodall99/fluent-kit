# Measurements (read the table you need)

Numbers read from Microsoft's own Figma files: the Microsoft 365 UI Kit (Web and Mobile templates) and the Fluent 2 Web component pages. The v9 components already implement the component values; use the tables to check a finished screen and to lay out the page around the components. Only deviate on purpose, and say so in the design note.

**Tables:** 1 Page patterns (dashboard, list, form, settings, gallery, feed, board, empty state, sign-in) · 2 Components (sizes, cards, message bar, dialog, drawer, toolbar, tabs, nav, grid, input, and the rest) · 3 Narrow screens (375 to 390px).

## 1 Page patterns (Microsoft 365 UI Kit templates)

Read from the Microsoft 365 UI Kit (Figma community file), "Templates" page, Web Large frames. Use these when you build the matching screen; the examples in `examples/` already follow them.

| What | Value (Fluent token) |
|---|---|
| Page padding | 20px (`spacingHorizontalXL`) |
| Gap between cards, or between a section's blocks | 12px (`spacingHorizontalM`) on dashboards; 20px (`spacingVerticalXL`) on forms and boards |
| Page title | 20px semibold, 28px line (`fontSizeBase500`); subtitle 14px, `colorNeutralForeground3` |
| Form or settings title | 16px bold, 22px line; description 14px `colorNeutralForeground3` |
| Section header in a form | 12px bold; its description 14px `colorNeutralForeground3` |
| Section title above a list | 16px semibold, 22px line, in a 32px-high row with the filter and search at the right |
| Card | radius 8px, padding 16px, gap 16px, `shadow4`; header 12px between title and tabs |
| Card title and description | 14px bold, 20px line; 12px `colorNeutralForeground3`, 16px line |
| Card footer link | 14px, brand link colour, "View details" |
| Task board | 20px between columns (1px divider), 12px between cards, column header 14px bold, full-width add button under it |
| List | header row 48px, rows 44px, 8px horizontal padding, 1px `colorNeutralStroke2` divider between rows, first line 14px and second line 12px `colorNeutralForeground3`, overflow "..." at the right |
| Form column | about 480px wide, centred; fields 12px apart; 8px between a label and its input; labels above inputs |
| Form and settings footer | Discard (secondary) then Save (primary), right-aligned, 8px apart, thin divider above |
| Empty state | centred; image 200px; 20px between image, text and actions; title 16px bold; text 14px, up to 600px wide; actions in a 280px column: primary, secondary, then a link |
| Settings row | label at the left (14px, about 250px wide), control at the right filling the rest, 8px apart, rows 12px apart; switches sit in rows 36px high with the label before the switch; a checkbox group has a 12px `colorNeutralForeground3` group label above it. Section header 12px bold with a 14px grey description, 4px apart. An error goes in a MessageBar at the top of the column |
| Toolbar search | a "Filter" button and a 200px "Find" input at the right edge of the toolbar |
| Section title row (gallery, home, feed) | 32px high: title 16px semibold (22px line) at the left; at the right a "See more" link (14px, brand link colour), or subtle 20px icon buttons (add, share, more), or carousel arrows. 8px between this row and its content; 20px between sections |
| Card row (gallery) | cards side by side, 12px apart, equal width (`flex: 1` or a grid), about 250px high, radius 8px, padding 16px, 16px inside, `shadow4`, on the tinted canvas (`colorNeutralBackground2`) |
| Feed | one centred column (about 800px wide), cards stacked 20px apart, each radius 8px, padding 16px; an optional second column of about 200px, 12px away, for side content |
| Sign-in, welcome, error, success | the empty state layout above. Microsoft uses large outlined buttons in the 280px column; in the kit the first action is `primary`, the others `secondary`, then a link |

## 2 Components (Fluent 2 Web component spec)

Read from the Microsoft Fluent 2 Web Figma community file (component pages: Button, Card, DataGrid, Dialog, Drawer, Input, Message bar, Nav, Tablist, Toolbar). The v9 components already implement these; the numbers tell you what the finished screen should measure, and what to check in a screenshot. Only deviate on purpose.

| Component | Spec |
|---|---|
| Sizes of controls | Button, Input, Dropdown, Toolbar: small 24 (toolbar 32), medium 32 (toolbar 40) default, large 40 (toolbar 48). Use medium unless the screen is dense (small) or touch-first (large). Do not mix sizes in one row. |
| Button appearances | primary, secondary (default), outline, subtle, transparent. Icon-only buttons are square (24, 32, 40) and need an `aria-label`. Toolbars use subtle buttons. |
| Card (core) | 4px radius (`borderRadiusMedium`), 12px padding and 12px gap, `shadow4`, 320px default width. Header: 32px avatar or icon, title 14px semibold, metadata 12px `colorNeutralForeground3`, optional "..." quick action. Body 12px `colorNeutralForeground2`. Footer: primary then secondary button, 12px apart. Dashboard and board cards are the larger 8px / 16px variant in the table above. |
| Message bar | 4px radius, 1px status border and tinted status background, 12px by 6px padding, 20px status icon, 8px gap. Single line is 36px high: bold title and message on one line, actions and dismiss at the right. Multi line puts the actions in a row below, right-aligned. Keep the text column to about 520px or 100 characters. Info is neutral grey, success green, warning orange, error red; the icon changes with the status, never colour alone. |
| Dialog | `DialogSurface`: 600px wide (default) or 320px, 24px padding, 8px gap between title, body and footer, 8px radius, `shadow64`. Title 20px semibold (28px line), close (X) at the top right, body 14px. Footer: primary action first (leftmost), then the different action, 8px apart, each at least 96px wide; a tertiary action goes alone on the left. Stacked on screens under 480px with the primary on top. A checkbox is for explicit consent (the primary stays disabled until it is ticked) or "Don't show this again" (buttons stay enabled); use sparingly. |
| Drawer | Overlay (blocks the page, `shadow64`) or inline (beside the page, optional divider). Widths 320 (default), 592 and 940px. Header: 24px padding, title 20px semibold, close at the right, optional back button. Body: 24px side padding. Footer: 16px above, 24px below and at the sides; primary first, then secondary, then an optional "..." overflow. |
| Toolbar | Height 40 (32 small, 48 large), 4px radius, 8px padding at both ends. Left: subtle icon or icon-and-text buttons in groups separated by dividers. Right: view controls and a small search input (about 280px). Static (inline) or floating (raised, for a selection). For the actions of the current view or task only. |
| Tabs | Horizontal tab 44px high (32 small), 14px text, 10px by 12px padding; the selected tab is semibold with a rounded brand underline, the others regular `colorNeutralForeground2`. Overflow goes into a "..." button at the end. Tabs divide one content-heavy page into related categories, or move between a few closely related pages. For anything else use a link (go somewhere) or a button (do something). Appearances: transparent (default), subtle, subtle circular, filled circular. |
| Nav | 260px wide. Item 40px high (32 small), 4px outer padding, 2px between items, 20px icon, 10px before the icon, 14px text. Selected: a 4px by 20px rounded brand bar at the left edge, a neutral filled background, semibold text. Section headers, dividers and a flexible space before footer items are separate parts. An app item (product switcher) is 48px high. |
| DataGrid / Table | Header row 33px, rows 24 (smaller), 33 (small), 45 (medium, default), 59 (large, two lines of text) including the 1px `colorNeutralStroke2` divider. Header text 14px; primary cell text 14px, secondary text 12px `colorNeutralForeground2`. Cell padding 8px left, 16px right. A 32px avatar or icon fits a medium row. Selection column 40px, with the checkbox 16px. Use `size="small"` for dense admin grids, medium for everything else. |
| Input | Four appearances: outline (default), filled darker, filled lighter, underline. Radius 4px, 10px inner padding (6px small), placeholder in `colorNeutralForeground4`. One line only; use `Textarea` for more. Put it in a `Field` for a label, hint and validation. |

## 3 Narrow screens (Microsoft 365 UI Kit mobile templates)

Read from the Microsoft 365 UI Kit "Mobile" frames (390px wide: dashboard, list, form, settings). Those frames are native iOS (SF Pro type, 17px body, 52px buttons), so copy the structure, not the sizes. On the web keep the Fluent web tokens and sizes.

| Screen | What Microsoft does at 390px |
|---|---|
| All | One column. 16px side gutters. Page title above the content, then sections 20px apart. The toolbar stays at the top with one primary action and icon-only buttons at the end. |
| Dashboard | Cards stack full width, 12px apart, same radius 8px, padding 16px and shadow as on desktop. Each card keeps its title, description, "..." button and "View details" link. No side-by-side cards. |
| List | Rows run edge to edge with no card around them. Selection control or avatar at the start, title and description in one line each (ellipsis), "..." at the end, a hairline divider between rows. A section title row sits above (32px high). |
| Table at 375px | Keep the name and the status. Hide other columns, or move one short secondary value under the name. A cell never wraps to more than two lines, and the row stays close to 48px. A toolbar action (refresh, filter) sits on the same line as the tabs or search, never alone on its own row. |
| Form | Label above the field (12px, brand colour while focused, danger colour on error), error text under the field in the danger colour. Groups of choices have a small group label above and rows about 48px high. Switch rows live in a rounded group (radius 12px) on the tinted canvas. Save is full width and primary, Discard full width and outline under it, 12px apart, pinned at the bottom of the screen. An error message bar goes at the very top. |
| Settings | Sections with a bold header and a short description; each section is a rounded group of rows about 48px high. A row is the label at the left and the current value plus a chevron at the right (opens a detail view), or a switch at the right. |

Rules that follow from this:
- Below 640px: stack cards, drop columns that are not the name, status or main action, turn table rows into two-line list rows, and make dialogs and drawers full width.
- Primary actions of a form go in a full-width bar at the bottom, in the order primary then secondary (stacked), not right-aligned side by side.
- Keep a visible label on every field; never replace labels with placeholders to save space.
- Targets stay at least 24px with spacing; use `size="large"` (40px) on touch layouts.
