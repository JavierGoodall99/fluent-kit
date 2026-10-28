# Fluent kit reference (for people)

These files are the long-form reference behind the kit. They are **not installed** into projects and agents never read them.

| File | What it covers |
|---|---|
| `DESIGN.md` | The design system: colour roles, type scale, components, page patterns, elevation, responsive and language rules |
| `DESIGNER.md` | How to think about a screen: brief, hierarchy, content, states, self-critique |
| `measurements.md` | Numbers measured from Microsoft's Figma files (Microsoft 365 UI Kit, Fluent 2 Web) |
| `fluent2-component-guidance.md` | When to use each Fluent component, paraphrased from the Fluent 2 Web Figma kit |

What agents read is in `.github/skills/fluent-ui/`: `SKILL.md` (the router), `tasks/` (one card per kind of task), `patterns/` (one card per page pattern, with its measurements), `deviations.md` and `examples/`. When a rule changes, change the card first; these files may then be brought in line.
