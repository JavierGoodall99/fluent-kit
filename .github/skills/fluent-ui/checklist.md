# Pre-delivery checklist

Go through every item before presenting UI work. Report any item you could not verify.

## System compliance

- [ ] No hex, `rgb()`, `hsl()` or named colors anywhere in changed files
- [ ] No raw `px` for padding, margin, gap, or radius; tokens only
- [ ] No inline `style` for color, spacing, or typography
- [ ] No imports from `@fluentui/react` (v8) or another UI library
- [ ] Icons come only from `@fluentui/react-icons` (no emoji, no custom SVG icons)
- [ ] No native `<button>`, `<input>`, `<select>`, `<textarea>`, `<a>`, `<table>` or `<dialog>`
- [ ] Page follows `.fluent-kit/DESIGN.md` section 5: shell, command bar, dialog for confirmations only; and the way records, details and edits are presented was chosen from the requirement ("Choose by requirement"), not copied from an example
- [ ] Fonts, radii, shadows and motion are Fluent's defaults, with no gradients or illustrations
- [ ] Would look at home next to the Azure portal or Microsoft 365
- [ ] Existing project components (shared UI package or repo) reused wherever one exists
- [ ] No new component created when an existing one fits
- [ ] Brand color appears only via `tokens.colorBrand*`
- [ ] Status colors use `tokens.colorStatus*`
- [ ] `node .fluent-kit/scripts/check.mjs --changed` reports 0 errors
- [ ] `node .fluent-kit/scripts/verify.mjs --start /path` reports 0 errors, and the screenshots (light, dark, narrow) were opened and looked at; or the reply says verification could not be run
- [ ] `fluent-kit/no-hardcoded-styles` and the Fluent-only lint config pass with zero warnings (if the project has them set up)
- [ ] `tsc` passes (catches wrong prop names and nonexistent tokens)

## Design judgement

- [ ] A design brief was written (who, job, how much data, what can go wrong) before building
- [ ] One clear primary action; the main thing on the screen is obvious at a glance
- [ ] Empty, loading, error and extreme-content states are designed, not only the happy path
- [ ] Button labels are verbs with objects; errors say what happened and what to do next
- [ ] The critique pass in `.fluent-kit/DESIGNER.md` section 8 was done
- [ ] The final reply includes a short design note (requirement, choice, rejected alternative)

## Behavior and accessibility

- [ ] Fully usable by keyboard; focus order is logical; focus is visible
- [ ] Icon-only buttons have `aria-label`
- [ ] Inputs are wrapped in `Field` with a label
- [ ] Meaning is not carried by color alone
- [ ] Empty, loading, and error states exist for anything that loads data
- [ ] Layout holds at narrow widths (about 375px) and wide (1440px) without clipping or horizontal scroll
- [ ] Long text wraps or truncates with an accessible full value

## Product theming

- [ ] Verified in the project's own theme, not only the default
- [ ] Verified in dark mode if the product supports it
- [ ] Primary buttons and links meet contrast against their background in that theme
- [ ] Navigation: items are transparent at rest, subtle hover, subtle selected colour (not black or brand-filled); opening or collapsing animates once, not twice.
- [ ] Dates and times use `DatePicker` / `TimePicker` (not `Input type="date"`); 2 to 5 visible choices are a `RadioGroup`, not a `Select`.
