# Pattern: feedback and empty states

Something happened, or there is nothing yet. Examples: `examples/notifications.tsx`, `examples/empty-state.tsx`.

**Which one**
| Situation | Use |
|---|---|
| short confirmation of something that just happened | `Toast` (success intent), no blocking |
| persistent message about the page or a section | `MessageBar` at the top of the content |
| a decision that blocks work | `Dialog` (`patterns/drawer.md`) |
| plain-text hint, icon-button name | `Tooltip` |
| extra info with structure, links or actions | `Popover` |

**MessageBar**
- Bold title, a full stop, then the detail: "Saving failed. Check your connection and try again."
- Info is neutral, success green, warning orange, error red, each with its own icon; never colour alone.
- Single line is 36px: 12px by 6px padding, 20px status icon. Text column about 520px or 100 characters; multiline puts actions in a row below, right-aligned.
- Actions (Retry, Fix) sit in the bar; link only to a page that really shows that thing.

**Toast**: one `Toaster` near the app root; dispatch with an intent. Not for errors someone must act on.

**Empty state**
- Centred in the available space; 20px between icon, text and actions.
- A 48px Fluent icon in `colorBrandForeground1`, not an illustration.
- Title 16px bold; text 14px, at most 600px wide; actions in a column about 280px wide: primary, then secondary, then a link; 8px apart.
- First use (what this is for and the one action that starts it), no results (clear the filter) and no permission (who to ask) are three different states with different text.
- Never a blank page.

**Errors and loading**
- An error says what happened, why if known, and what to do next: never a raw code alone, never lose what they typed.
- `Skeleton` when the layout is known, `Spinner` or `ProgressBar` when it is not. Give feedback within 100ms of an action.
- A disabled action says why when it is not obvious.

**Narrow (under 640px)**: message bars span the content width with actions below the text; empty-state actions go full width.
