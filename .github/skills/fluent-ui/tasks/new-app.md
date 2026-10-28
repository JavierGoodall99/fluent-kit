# New app, or an app not on Fluent v9 yet

**1. Read the project.** `node .fluent-kit/scripts/detect-theme.mjs .`

| Result | Do |
|---|---|
| no `package.json` | `npm create vite@latest <name> -- --template react-ts`, and say so. Next.js only if asked: `npx create-next-app@latest <name> --ts --app --no-tailwind`. |
| `new-project` | Steps 2 to 5. |
| `fluent-v8` | Never mix v8 and v9 in new code. Ask whether this is a migration. |
| `other-ui-library` | Ask: migrate to Fluent v9, or keep that library for this task. |
| `fluent-v9-*` | Not a new app: the new-page route. To brand it: steps 2 and 3, keeping any existing ramp. |

**2. Brand and language, in one message.** Follow detect-theme's brand advice:
- a colour found: use it and name it (say "a guess" at medium confidence).
- several candidates: ask which.
- nothing, or a fresh scaffold (its colours are not a brand): ask for a hex or "stock". Never invent one.
- Save the answer in `.fluent-kit/brand.json` (`{ "mode": "stock" }` or `{ "hex": "#rrggbb" }`); a saved file is a decision.
- Language: the one detect-theme reports; no signal, ask once, default English. Set `lang` on `<html>`.

**3. Install and theme.** Run the install command detect-theme prints, then `node .fluent-kit/scripts/make-theme.mjs <#hex|stock> --out src/theme.tsx` (Next.js: `--next --out app/theme.tsx`). It stops on a colour that fails contrast: offer the darker shade it prints; never `--force` without the design owner's approval. That file is the only place raw hex is allowed.

**4. Wrap the app** in its `AppProvider` (`src/main.tsx`, or `app/layout.tsx`). Remove the scaffold's styling: Vite's `index.css`, `App.css` and demo markup; Next.js's font imports, `page.module.css` and all of `globals.css` but `body { margin: 0; }`. Next.js files using `makeStyles` or hooks need `"use client"`.

**5. First screen**: `tasks/new-page.md`. The primary button should show the brand colour.

**Migrating a screen** to v9: swap components one at a time, keeping behaviour; swap hard-coded values for tokens (ask if none fits); delete CSS Fluent now covers; list what is left.

**Finish**: `node .fluent-kit/scripts/check.mjs --finish --page / --full`.
