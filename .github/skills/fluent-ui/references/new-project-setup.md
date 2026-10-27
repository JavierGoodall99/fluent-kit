# New project setup

Use this when `detect-theme.mjs` reports `new-project`, a fresh scaffold, or "Fluent packages missing". Both recipes below were built and run from a clean scaffold (Vite + React + TypeScript, and Next.js App Router): they type-check, build, and render with the right brand color.

## 1. Decide, in one message

Ask the user only what the script could not find:

- **Brand:** a brand hex, or "stock" for the plain Microsoft blue. (A fresh scaffold's default colors are not a brand; ignore them.)
- **UI language:** only if the script found no signal. Default English.
- **Framework:** only if there is no `package.json` yet. Default: Vite + React + TypeScript.

Record the brand decision so nobody asks again: `.fluent-kit/brand.json` with `{ "mode": "stock" }` or `{ "hex": "#rrggbb" }`.

## 2. Create the app (only if there is none)

- Vite: `npm create vite@latest <name> -- --template react-ts`
- Next.js: `npx create-next-app@latest <name> --ts --app --no-tailwind --no-src-dir`

Then install the kit (`node <kit>/install.mjs <name>`; add `--brand <stock|#hex>`).

## 3. Install Fluent

Run the command `detect-theme.mjs` prints under "Setup" (it picks the package manager from the lockfile). It installs `@fluentui/react-components` and `@fluentui/react-icons`. Nothing else is needed.

## 4. Write the theme and provider

```
node .fluent-kit/scripts/make-theme.mjs <#hex|stock> --out src/theme.tsx        # Vite and other client apps
node .fluent-kit/scripts/make-theme.mjs <#hex|stock> --next --out app/theme.tsx # Next.js App Router
```

For a hex it builds a 16-step ramp and checks contrast. If the contrast checks fail it stops and says why: ask the user for another color or an official ramp. This generated file is the one place raw hex is allowed. It exports `AppProvider`, which follows the OS light/dark setting without a hydration mismatch (and, with `--next`, registers Fluent's styles for server rendering).

## 5. Wrap the app

**Vite** (`src/main.tsx`):

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./theme";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
```

**Next.js** (`app/layout.tsx`):

```tsx
import "./globals.css";
import { AppProvider } from "./theme";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
```

Set `lang` to the UI language.

## 6. Remove the scaffold's styling

Fluent supplies the font, colors and spacing. Delete or empty what the scaffold added:

- Vite: `src/index.css`, `src/App.css` and the demo markup in `App.tsx`.
- Next.js: the Geist font imports in `layout.tsx`, `page.module.css`, and everything in `globals.css` except a `body { margin: 0; }` reset.

## 7. Build the first screen from an example

Copy the closest file from `.github/skills/fluent-ui/examples/` and adapt it.

- Next.js: any file that uses `makeStyles`, hooks or event handlers needs `"use client"` as its first line. A page that only renders a client component can stay a Server Component.
- Scaffolds enable `verbatimModuleSyntax`: type-only imports need the `type` modifier (`import { type Theme } from ...`).
- Do not pass icon components from a Server Component to a Client Component.

## 8. Verify

`tsc` (or `npm run build`, which type-checks in Next.js), then the checklist. Run the app once and look at it: the primary button should be the brand color.
