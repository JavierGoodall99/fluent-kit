// Lints the scripts the installer ships with ESLint's recommended rules, so a project whose own ESLint
// config covers .fluent-kit/ does not fail on kit files. Run: npx eslint -c tests/eslint.shipped.config.mjs .fluent-kit
import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { ecmaVersion: "latest", globals: { ...globals.node, ...globals.browser } } },
  { files: ["**/*.cjs", ".fluent-kit/eslint/*.js"], languageOptions: { sourceType: "commonjs" } },
];
