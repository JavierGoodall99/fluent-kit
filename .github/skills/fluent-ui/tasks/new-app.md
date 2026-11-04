# New app, or an app not on Fluent v9 yet

**1. Read the project.** `node .fluent-kit/scripts/context.mjs new-app`; go by its Result line:

| Result | Do |
|---|---|
| no `package.json` | Step 2, then the scaffold command below, then step 5. |
| `new-project` | Steps 2 to 5. |
| `fluent-v8` | Never mix v8 and v9 in new code. Ask whether this is a migration; if so, `tasks/migrate-v8.md`. |
| `other-ui-library` | Ask: migrate to Fluent v9, or keep that library for this task. |
| `fluent-v9-*` | Not a new app: the new-page route. To brand it: steps 2 and 3, keeping any existing ramp. |

**Scaffold** (no `package.json`): `node .fluent-kit/scripts/scaffold.mjs --brand <#hex or stock> --lang <code> --title "<app name>"`, with the person's answers and the product's name; add `--next` only if Next.js was asked for. It creates the app next to the kit's files, installs Fluent, writes the theme and wraps the app. It takes 1 to 3 minutes: if your terminal returns early, keep checking its output until the `Done:` line, and do not end your turn while it runs.

**2. Brand and language, in one message.** Follow its Brand line: it says whether to use a colour it found, ask which of several, or ask for a hex or "stock" (a fresh scaffold's colours are not a brand; never invent one). Save the answer in `.fluent-kit/brand.json` (`{ "mode": "stock" }` or `{ "hex": "#rrggbb" }`); a saved file is a decision. Language: its Language line; no signal, ask once, default English. Set `lang` on `<html>`.

**3. Install and theme.** Run the install command its Setup line gives, then the one command its Brand line names. It stops on a colour that fails contrast: offer the darker shade it prints; never `--force` without the design owner's approval. The theme file is the only place raw hex is allowed.

**4. Wrap the app** in its `AppProvider` (`src/main.tsx`, or `app/layout.tsx`). Remove the starter's styling: Vite's `index.css`, `App.css` and demo markup; Next.js's font imports, `page.module.css` and `globals.css`. Next.js files using `makeStyles` or hooks need `"use client"`.

**5. First screen**: `tasks/new-page.md`, from its step 2. The primary button should show the brand colour.

**Finish**: `node .fluent-kit/scripts/check.mjs --finish --page /`.
