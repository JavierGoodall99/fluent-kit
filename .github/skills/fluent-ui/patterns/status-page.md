# Pattern: status page

Find what is failing among many checks or jobs grouped under a parent (integrations, services), and why. Example: `examples/status-grid.tsx`.

**Structure**
1. **Verdict first**, one line with a status indicator: "3 of 6 need attention". Tabs and counts do not replace it.
2. **Summary strip** under it: All / Failing / Healthy counts that also filter (small `ToggleButton`s).
3. **Grouped `Table`**: one row per group (chevron, name, worst status, first line of the cause, "2 of 5 checks need attention"). Problem groups first; groups start collapsed, detail on demand.
4. **Check rows**, the same columns on every row: name, status, message, action (Copy, Retry or Fix next to the cause).

**Rules**
- One row design for every status. Status changes the icon, word and colour, never the layout. Design and sample every status the source documents (healthy, degraded, unhealthy, maintenance, unknown); show unknown ones, never hide them.
- Status indicator: a 16px filled Fluent icon in `colorStatus*Foreground1` plus a 14px label in the normal text colour, 6px apart (`spacingHorizontalSNudge`). One fixed icon per status on every page. Never colour alone.
- A failed row says why: the cause and when it happened, never a bare "Error" pill. Unknown cause: say so in the note.
- Messages: wrap, capped at 75ch, on `colorNeutralBackground2` with a `colorNeutralStroke2` border, monospace 12px. Long ones clamp to 3 lines with "Show more"; never print every full message.
- The same message on several rows of one table: show it once with the affected names. Separate cards keep their own message.
- Placeholder values (`null`, "Empty") mean "not set up": show that state in words, and group them ("9 not set up").

**Measurements**: table on a `colorNeutralBackground1` surface; cells 8px top and bottom (`spacingVerticalS`); columns: name about 22%, status 132px, action 96px, message takes the rest. Problem rows may use `colorNeutralBackground1Hover`.

**Narrow (under 640px)**: each row becomes a stacked block: name and status on one line, the message under it, then the action. Hide secondary columns (type, time). The verdict stays the first line on the screen.
