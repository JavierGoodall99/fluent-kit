"use strict";

/**
 * Fluent-only lint config (ESLint flat config array).
 *
 * Enforces:
 *  - no UI library other than Fluent UI v9 (a project's own shared UI package is not banned)
 *  - no icon library other than @fluentui/react-icons
 *  - no Fluent v8 (@fluentui/react) or Northstar
 *  - no native form controls, links, tables or dialogs in JSX
 *
 * Use alongside your existing parser config (for example typescript-eslint):
 *   import fluentOnly from "./.fluent-kit/eslint/fluent-only.cjs";
 *   export default [...yourConfig, ...fluentOnly];
 *
 * A real exception (for example <input type="file" hidden>) needs an inline
 * `// eslint-disable-next-line no-restricted-syntax -- reason` comment.
 */

// Banned packages and native elements come from .fluent-kit/rules.json, the list check.mjs and detect-theme use too.
const RULES = require("../rules.json");
// ESLint import patterns are gitignore-style: an unscoped name is anchored with "/" so "antd" does not match "x/antd".
const toPattern = (p) => (p.startsWith("@") ? p : "/" + p);

const NATIVE = Object.entries(RULES.native).map(([name, use]) => ({
  selector: `JSXOpeningElement[name.name=/^(${name})$/]`,
  message: `Use Fluent ${use} instead of a native <${name}>.`,
}));

module.exports = [
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: RULES.uiLibraries.map(toPattern),
              message: "Use Fluent UI v9 (@fluentui/react-components). No other UI library.",
            },
            {
              group: RULES.iconLibraries.map(toPattern),
              message: "Icons come from @fluentui/react-icons only.",
            },
            {
              group: RULES.fluentV8.map(toPattern),
              message: "Fluent v8 / Northstar are not allowed. Use @fluentui/react-components (v9).",
            },
          ],
        },
      ],
      "no-restricted-syntax": ["error", ...NATIVE],
    },
  },
];
