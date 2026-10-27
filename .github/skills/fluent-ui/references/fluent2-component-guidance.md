# Fluent 2 component guidance

Source: Microsoft's [Fluent 2 Web UI kit (Figma, community file)](https://www.figma.com/design/BUqKY7PSo3NwriK96ywdLG/Microsoft-Fluent-2-Web--Community-), one page per component. Each entry paraphrases the kit's own "when to use" text and lists its variants and states. Code names are Fluent UI React v9. Read the entry for a component before using it in a way you have not used it before.

States the kit shows for interactive components: rest, hover, pressed, selected, focus, disabled. Do not restyle them; Fluent v9 implements them.

## Button, ToggleButton, MenuButton, SplitButton, CompoundButton

- **Button:** triggers an action or event. Use it for important actions such as submitting, committing a change or moving to the next step. To navigate somewhere else, use a `Link`, not a button.
- **ToggleButton:** a two-state button that stays on or off; the selected state shows "on".
- **MenuButton:** toggles a menu of options. Unlike a split button, the menu button itself does not perform a primary action.
- **SplitButton:** a primary action plus a menu of related alternatives. The default action runs from the main part; extra actions sit in the menu.
- **CompoundButton:** a button with a main title and a secondary description line (and optional icon). Use when the extra line helps the decision.
- **Appearances:** primary, secondary (default), outline, subtle, transparent. One primary per view.
- **Sizes:** small, medium (default), large. **Shapes:** rounded (default), circular, square.
- **Content:** text only, text with icon, icon only (icon-only needs `aria-label` and a `Tooltip`).

## Nav (NavDrawer, NavItem, NavCategory, NavSubItem)

- Provides a list of links that lets people move through the main sections of an app. It is a high-level wayfinding component that is always present but can be minimized to free up space.
- **One level of nesting only.** It may not show all items. For a deeper, more complex hierarchy use `Tree`.
- **Parts:** app item, `NavItem`, `NavCategory` item (expands, chevron), `NavSubItem`, section header, divider, flex space (pushes later items to the bottom).
- **Selected item:** accent bar on the left and a filled icon (use `bundleIcon` Filled/Regular).
- **Sizes:** medium and small nodes. A hamburger collapses the nav.

## Drawer (OverlayDrawer, InlineDrawer)

- A secondary content surface that slides in from one edge. Use for supplemental information and simple actions related to the main content.
- **Overlay drawer:** intrusive; covers all or part of the page. Use when the drawer content should get more attention.
- **Inline drawer:** passive; sits side by side with the page. Use when people need to see and interact with the page and the drawer at the same time.
- **Too heavy for it:** for short information tied to one spot, use a `Tooltip` or `Popover`. To confirm an action, use a `Dialog`, not a drawer.
- **Structure:** title with close button; optional navigation row (back, up/down, refresh); body; footer with primary, secondary and an overflow `...` button.
- **Sizes:** small, medium, large.

## DataGrid

- Organizes information in columns and rows that relate to each other. For complex information that must be well organized for selecting and comparing. Gives accessibility structure so users can navigate cells with the arrow keys.
- **One column of information:** use `List`. **Columns and rows purely visual and not selectable:** use `Table`.
- **Sizes:** medium (default), small, extra-small ("smaller"), large.
- **Header cells:** regular, semibold, sorted (arrow shows direction); selection and cell-action headers.
- **Row states:** rest, hover, selected, selected hover, brand selected, brand selected hover. Row states come from the component; do not recolor rows.
- **Selection:** multi-select (checkbox) or single-select (radio).
- **Cell types:** primary text, secondary text, link, cell actions, avatar/persona, swappable custom cell.

## Dialog

- A supplemental surface that gives helpful information or requires someone to take an action before they can continue their task, such as confirming a deletion.
- **Dialogs are interruptions, so use them only for important actions.** To update someone on an action they just took that needs no response, use a `Toast`. To give extra context that does not affect their workflow, use a `Popover`.
- **Blocking dialogs** put a 40% overlay behind them. If the rest of the UI must be blocked, use the overlay token `colorNeutralBackgroundOverlay`.
- **Shape:** title as the main question or action, optional body explaining the consequences, close (X), a primary action and one different action. A "do not show again" checkbox can sit above the actions ("dialog with additional confirmation").
- **Widths:** 600px wide, and a narrow variant that stacks full-width buttons (small screens).

## Field

- A label combined with any form component: `Input`, `Textarea`, `Dropdown` and so on. Optionally adds an info button, helper text and validation states, giving clues about what to enter.
- **Parts:** label, required marker (red asterisk), optional info button, the control, validation message (error text with an icon).
- **Sizes:** small, medium (default), large. The label size follows the field size.
- Every input is wrapped in a `Field`. Placeholder text is a hint, never the label.

## MessageBar

- Communicates important information about the state of the whole product or of the surface where it appears (a page, drawer, dialog or card).
- **Not for these:** to prevent a destructive action, use a `Dialog`. For something time-sensitive that relates to an activity or status elsewhere, use a `Toast`.
- **Intents:** info, success, warning, error. Each has its own icon and tint.
- **Layouts:** single line (title, message, link, up to two actions, dismiss) and multi line (actions drop below the message). Placement: in page, or full width.
- **Keep the message short:** under about 100 characters or roughly 520px wide so it stays accessible.

## Toast (Toaster)

- Communicates the status of an action someone is trying to take, or that something happened elsewhere in the app. Toasts are temporary surfaces. Use them for information that is useful and relevant, but not critical.
- **For critical messages use:** a modal `Dialog`, a `Field` error, or a `MessageBar`.
- **Types:** dismiss (X), timestamp, action link. **Status:** informational, success, warning, error, plus icon, upload, download, spinner and avatar variants.
- **Content:** a title, then optional secondary and tertiary lines, a progress bar, or quick action links.

## Toolbar

- Gives access to frequently used actions related to someone's current view or task, like text formatting in an editor.
- **Sizes:** small, medium (default), large. **Types:** static (inline in the page) and floating (raised, with shadow).
- **Contents:** buttons, toggle buttons, dividers between groups, dropdowns, and an optional search input at the end. Group related actions between `ToolbarDivider`s.

## Input

- Lets people enter short, free-form text. For more than one line, use `Textarea`. Put the input in a `Field` when you need info buttons, helper text and validation states.
- **Styles:** outline (default), filled darker, filled lighter, underline.
- **States:** rest, hover, pressed, focus, error, disabled, read only.
- **Sizes:** small, medium (default), large. Can hold a leading icon (for example search).

## Card

- A container that holds information and actions related to a single concept or object, like a document or a contact. Cards give information prominence and create predictable patterns. They are flexible, so use them consistently for particular use cases across the product.
- **Styles:** filled, filled alternative, outline, subtle. **Sizes:** small, medium, large.
- **States:** rest, hover, pressed, selected, draggable, disabled.
- **Content:** header (icon or avatar, title, metadata, overflow menu), body text, optional media preview, footer actions (one primary, one secondary).

## TabList (Tab)

- Lets people switch between categories of related information without going to different pages. Ideal for dividing content-heavy pages into distinct but related categories that need less scrolling. Also fine for navigation between a small set of closely related, frequently accessed pages.
- **Not for:** navigation beyond closely related categories (use a `Link`); initiating an action (use a `Button`).
- **Layout:** horizontal or vertical. **Appearance:** transparent (default), subtle, subtle circular, filled circular. **Sizes:** small, medium (default).
- **Content:** text only, icon before text, icon only. Overflow goes into a `...` menu.

## Breadcrumb

- Helps people quickly understand where they are within the hierarchy of a large, complex site or app. Also works as compact secondary navigation: one-click access to higher levels and back to the home page.
- **Items:** text with icon, text only, overflow (`...` menu for collapsed levels). The current (last) item is bold and not a link.
- **Sizes:** small, medium (default), large.

## Badge (and PresenceBadge, CounterBadge)

- A visual indicator that communicates a status or description of an associated component. Uses short text, color and icons for quick recognition and sits near the relevant content.
- **Appearance:** filled, tint, outline, ghost. **Colors:** brand, danger, warning, success, important, informative, subtle.
- **Sizes:** tiny, extra-small, small, medium, large, extra-large. **Shapes:** circular, rounded, square.
- **Presence** (`PresenceBadge`): available, away, blocked, busy, do not disturb, offline, unknown, out of office. **Counts:** `CounterBadge`.
- Color never carries meaning alone; always include text or an icon.

## Menu

- A hidden list of options shown when someone interacts with a trigger such as a button, an avatar or an icon. Usually options start an immediate action or navigate somewhere new.
- **Not for collecting information:** use a `Select`, `Dropdown` or `Combobox`.
- **Parts:** menu item (optional icon, shortcut text, submenu chevron, check mark for selection), split item, section header, divider.
- **States:** rest, hover, pressed, selected, focus, disabled.

## Popover

- A small surface that appears when someone interacts with a component, giving nonessential, contextual information without blocking them. It can hold structured content and interactive components.
- **For more complex layouts or blocking the page:** use a `Dialog`. **For unstructured plain text:** use a `Tooltip`.
- **Appearances:** default, inverted, brand. **Arrow:** on any edge (top, bottom, left, right, each at start/middle/end) or none.

## List

- A collection of like items repeated in a vertical stack. Use lists to make information easy to scan and access. Items are independent of one another.
- **Columns that relate to each other:** `DataGrid` or `Table`. **Nested hierarchy:** `Tree`.
- **Sizes:** small, medium (default). **Items:** single line or two line (primary and secondary text), optional icon or avatar, trailing time, action icons.
- **Selection:** none, check mark, checkbox, radio.

## Avatar and AvatarGroup

- **Avatar:** shows an image or text to represent a person or group, and can show extra information such as status and activity. For many avatars, use an avatar group. The kit notes Avatar has no square shape.
- **Types:** image, icon, initials. **Colors:** neutral, brand, or a named shared color (the same person always gets the same color). **Presence and activity ring** are optional.
- **Sizes:** 16 to 120px.
- **AvatarGroup:** shows multiple avatars as spread, stack or pie, with a `+N` overflow.

## Dropdown (and Select, Combobox)

- Lets people choose one or more options from a list. Use it in forms where options need custom styling, or as a component to filter or sort information. Put it in a `Field` when you need a label, info button and validation.
- **Appearance:** outline, transparent, fill lighter, fill darker. **Sizes:** small, medium (default), large.
- Options can carry icons and check marks (multi-select) and be grouped under a section header.

## Persona

- A representation of a person with additional contextual information. Usually an avatar, a presence badge, and up to four lines of text.
- **Sizes:** small (badge only), medium (default), large.
- **Text position:** after the avatar (default), before, or below. Can show presence without an avatar.

## SearchBox

- Lets people access information with ease, with the ability to clear and filter the search. Can show a suggestions list under the box (for example people, with a "show more results" link).
- **Appearance:** outline (default), filled darker, filled lighter, transparent. **Sizes:** small, medium (default), large.
- **Parts:** search icon, placeholder, optional filter button, clear (X) button.

## Tree

- Displays a hierarchical view of nested data such as a menu structure, folder hierarchy or nested categories. A parent node with one or more levels of child nodes that expand and collapse.
- **To show or hide information regardless of hierarchy:** use `Accordion`. **Simpler structure:** `List` or `Table`.
- **Appearance:** subtle (default), subtle alpha, transparent. **Sizes:** small, medium (default).

## Checkbox

- Lets people select multiple options from a group, or switch a single option on or off.
- **Only one option allowed:** use a `RadioGroup` or `Dropdown`. Checkboxes do not trigger an immediate change and need a submission step, such as a button. **For an immediate effect:** use a `Switch`.
- **Styles:** standard (square) and circular. **States:** unchecked, checked, indeterminate (each with rest, hover, pressed, focus, disabled).

## RadioGroup

- Lets people select a single item from a short list. Use it when the layout has room for up to five options, or when it matters that all options are visible at once.
- **Not enough space:** use a `Dropdown`. **Several options:** `Checkbox`. **Immediate on/off:** `Switch`.
- **Layouts:** vertical (default), horizontal, horizontal stacked (label below). Optional subtext under a label.

## Switch

- Lets someone choose between two mutually exclusive options, like on or off. **Activating a switch triggers an immediate change.**
- **Needs a submission step before the change applies, or an indeterminate state:** use a `Checkbox`.
- **Label position:** before, after, above, or no label (switch only).

## Link

- Styled text that leads somewhere else, within the experience or to another app or site.
- **Do not use links to trigger actions;** use a transparent (or subtle) `Button`.
- **Appearance:** default, subtle, over brand (on a brand-colored surface). Optional external-link icon. Inline (inside text, underlined) or standalone.

## ProgressBar

- Communicates system information, such as how much cloud storage is used, or task information such as how long until a download completes. Use only for tasks that take longer than a second.
- **Loading new content with a known structure that does not block the UI:** use a `Skeleton`.
- **Types:** static (determinate) and indeterminate. **Status:** default, success, warning, error. **Sizes:** medium (default), large.

## Spinner

- Visually communicates that something is processing. For loading states that take more than a second. It does not show how much time is left.
- **For a more specific status:** use a determinate `ProgressBar`.
- **Sizes:** extra tiny, tiny, extra small, small, medium (default), large, extra large, huge. **Appearance:** primary (default), subtle (on brand or dark surfaces). Add a short label such as "Saving...".

## Tag and InteractionTag

- A representation of a value someone has picked, like recipients of an email or categories on a task. Tags give a visual pattern that tells people they can change or remove the selection.
- **System-generated data people cannot change:** use a `Badge`, not a tag.
- **InteractionTag:** adds a second action on the tag itself, for example opening a `Popover` with a contact card.
- **Appearance:** filled (default), outline, brand. **Sizes:** extra small, small, medium (default). Can be dismissible and can include an avatar or icon and secondary text.

## Textarea

- Lets people enter long, free-form text, like a comment. For one line, use an `Input`. Put it in a `Field` for a label and validation.
- **Styles:** outline, filled darker, filled lighter. **Sizes:** small, medium (default), large. **States:** rest, hover, pressed, focus, error, read only, disabled.

## Tooltip

- Supplemental, contextual information shown near its target. Use for helpful but **non-essential, plain-text** information. Do not use it to communicate system feedback.
- **Robust, formatted information:** use a `Popover`.
- **Max width 240px** (text wraps). **Appearance:** default, inverted, brand. Arrow on any edge.
- Icon-only buttons get a tooltip with their name.

## Skeleton

- Tells people a section of content is loading without blocking other parts of the page. Good for hinting at the structure of information in a layout. Use to load content gradually when it takes longer than a second.
- **Unknown structure:** use a `ProgressBar` or `Spinner`. Skeletons do not say how long it will take, so avoid them for long processes.
- **Shapes:** square (default), circle. **Animated or static.**

## Accordion

- Groups sections of related content that can be opened and closed. Reduces cognitive load by letting people choose which sections they see, like questions in an FAQ.
- **Never put information that is required for the current task inside an accordion.** Use a treatment with more prominence for that.
- **Chevron:** before (default) or after the header. **Sizes:** small, medium, large, extra large.

## Divider

- Groups sections of content to create visual rhythm and hierarchy. Use together with spacing and text hierarchy to organize a layout; do not use dividers instead of spacing.
- **Orientation:** horizontal or vertical, full width or inset. Optional text or icon at the start, center or end.
- **Appearance:** default, subtle, strong, brand.

## Label and InfoLabel

- **Label:** gives a name to a component or group of components. Pair with checkboxes and inputs to prompt for information, or with plain text to categorize information.
- **Label with an info button:** use `InfoLabel`. **Label plus any form component plus helper text and validation:** use `Field`.
- **Sizes:** small, medium (default), large. **Types:** regular, semibold, required (red asterisk), disabled.
- **InfoLabel:** the info button opens a `Popover`. The popover is not always visible, so **never put information people must know to fill in the field in it.** Use placeholder or helper text for hints about how to fill in a field or which values are allowed.
- InfoLabel works inside `Field` with checkboxes, inputs, textareas and dropdowns.

## Slider

- Lets someone set a value from a given range. It can take effect immediately (volume) or need a submit (in a form). Use for **imprecise** values.
- **Do not use** for very small or very large ranges. For precise numbers, like a money amount, use an `Input`. For precise steps in a small range, use `SpinButton`.
- **Sizes:** small, medium (default). **States:** rest, hover, pressed, focus, disabled. **Stepped** variant shows tick marks.

## SpinButton

- A specialized input to increase or decrease a value within a set range, like the day in a month. Good for precise increments in small ranges.
- **Very large range or fewer than three values:** use an `Input`. **Imprecise range where a visual helps:** use a `Slider`.
- **Appearance:** outline (default), filled darker, filled lighter, underline. **Sizes:** small, medium (default). **States:** rest, hover, pressed, focus, error, read only, disabled.

## TagPicker

- Combines a text field and a dropdown so people can pick options from a list or type their own, shown as tags. Use for people pickers (email recipients) and multi-value fields.
- **Appearance:** outline (default), transparent, filled darker, filled lighter. **Sizes:** medium (default), large, extra large. **States:** rest, hover, pressed, focus, error, disabled.
- Options in the list can use `Persona`-style rows with avatar, primary and secondary text.
- Exported from `@fluentui/react-components` in 9.74 as `TagPicker` with its parts. Check the installed version.

## Status indicator

- Shows the status of an object, action or process (success, failure, error or other informational status). **Icon and text together** reinforce each other, so color is never the only signal.
- **Sizes:** large, medium (default), small.
- **Categories:**
  - Active: New, In progress, Syncing
  - Error: Failed, Cancelled
  - Informational: Archived, Draft, Generic information, Not started, Pause, Pending, Scheduled, Unknown
  - Success: Success, Synced
  - Warning: Warning
- **v9 mapping:** the Figma kit ships this as a design component (`.StatusIndicator`, a subcomponent), but `@fluentui/react-components` 9.74.11 has no `StatusIndicator` export. Build it from a Fluent icon plus `Text`, or from `Badge` with an icon and text, and keep one shared component in the project so all screens use the same icon and color per status. Verify against the installed version before assuming this changed.
- Labels are UI text, so they follow the project's language (see `.fluent-kit/DESIGN.md` section 10).

## TeachingPopover

- A small surface that appears when someone interacts with a component to give **non-essential, contextual** information without blocking them. Can hold structured content and interactive components, such as an image, title, description and primary and secondary buttons.
- **Complex layout or need to block the page:** use a `Dialog`. **Unstructured plain text:** use a `Tooltip`.
- **Appearance:** default, brand. **Multi-step:** Back and Next buttons with a step counter, for example "1 of 4" in the project's language.
- Exported from `@fluentui/react-components` in 9.74 (it lives in `@fluentui/react-teaching-popover`). Check the exports of the installed version before using it.

## Carousel

- Lets people cycle through content linearly and cyclically, for example featured articles, products or services, without leaving the page.
- **Navigation type:** dots, or an image picker (thumbnails). **Pause button:** in the navigation or on content click. **Layouts:** keep content in place or scroll. **Chevron placement:** outside the edges, on the edges, or near the navigation.
- Always provide a way to pause automatic movement and keyboard access to the arrows.
- Exported from `@fluentui/react-components` in 9.74 (it lives in `@fluentui/react-carousel`). Check the exports of the installed version before using it.

## Rating and RatingDisplay

- `Rating` communicates and collects user sentiment. `RatingDisplay` is the non-interactive version (average plus count, for example "4,5 · 1.160").
- **Sizes:** small, medium (default), large, extra large. **Color:** neutral (default), brand, marigold. **Shape:** star, circle, square. Filled or no fill.
- Display has a default and a compact form.

## SwatchPicker

- Used in graphic and text editors to choose a color, image or pattern. Can sit in a `Popover` or stand alone.
- **Sizes:** extra small, small, medium, large. **Layouts:** a row or a grid. **Swatch types:** color, icon, image. **States:** rest, hover, pressed, focus, disabled, selected, plus empty and transparent swatches.
- Not for choosing the product brand colour. That comes from the BrandVariants ramp (.fluent-kit/DESIGN.md section 2).

## Material acrylic

- A semi-transparent material that replicates frosted glass. Use it for **transient, light-dismiss** surfaces such as `Popover` and `Menu`.
- Do not hand-build blur or transparency. Use the v9 components, which apply the right surface and shadow tokens.
