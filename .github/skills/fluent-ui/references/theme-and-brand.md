# Theme, brand and language (read when `detect-theme` reports v8, another UI library, a new project, or the user asks to brand the app)

## Decide which theme applies

Run `node .fluent-kit/scripts/detect-theme.mjs .` (or `--json`) in the project root. If you cannot run scripts, check by hand: `package.json` for `@fluentui/react-components` / `@fluentui/react` / other UI libraries, and search for `FluentProvider`, `createLightTheme`, `BrandVariants`, `webLightTheme`.

| Result | What to do |
|---|---|
| `fluent-v9-custom-brand` | **Existing project.** Keep its theme and brand ramp. Do not recolor, rename or regenerate it. Build with it. |
| `fluent-v9-stock-theme` | **Existing project on the stock Microsoft theme.** Keep it and build with it. Do not ask for a brand color. Use the brand step below only when the user asks to brand the app. |
| `fluent-v8` | Do not mix v8 and v9 in new code. Ask whether this task is a migration. |
| `other-ui-library` | Ask the user: migrate to Fluent v9, or keep that library for this task? If migrating, reuse steps 3 to 7 of `references/new-project-setup.md` inside the existing app. |
| `new-project` | Nothing to read a brand from (an empty folder, or a fresh scaffold: its default colors are not a brand). Follow `references/new-project-setup.md`: ask once for the brand hex or "stock", install Fluent, run `make-theme.mjs`, wrap the app, build the first screen from `examples/`. Never invent a brand color. |

**Brand step (nobody sets the brand beforehand).** The script also prints a "Brand" line and "Brand advice":

- Existing ramp: keep it as is.
- No ramp but a brand color found: run `node .fluent-kit/scripts/generate-ramp.mjs <hex> --ts`, use the result in the theme, and tell the user in one line which color you used. Do not ask first. If the advice says the color is a guess (medium confidence), say that in the same line.
- Several candidates ("ambiguous"): ask the user to pick one.
- Nothing found: ask for the hex. If the user says the app should stay on the stock Microsoft theme, write `{ "mode": "stock" }` to `.fluent-kit/brand.json` so nobody asks again. If you derive a ramp or the user picks a color, you may also record it as `{ "hex": "#rrggbb" }` there.
- A `.fluent-kit/brand.json` already present is a saved decision: follow it.
- If the contrast checks fail, say so and ask. Do not use that ramp for buttons or text. Never pass `--force` to `make-theme.mjs` to get around a failed contrast check; that flag is only for a design owner who has approved the colour. Offer the nearest passing darker shade (the script prints the contrast numbers) instead.

Rules that always hold, whatever the result: Fluent components, Fluent icons, tokens only, UI text in the project's language. Only the brand ramp is decided in this step. Never change an existing project's theme as a side effect of an unrelated task; if the theme looks wrong, report it instead.

**Language step.** The script also prints a "UI language" line and "Language advice". Write new UI text in that language. If there is no signal, ask once; if the user does not say, use English. A `.fluent-kit/PROFILE.md` overrides this.

When asking the user, ask one short question and wait. Do not guess a brand color.
