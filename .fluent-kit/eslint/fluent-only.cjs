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

const NATIVE = [
  ["button", "Use Fluent Button, ToolbarButton or MenuItem instead of a native <button>."],
  ["input", "Use Fluent Input, Checkbox, Radio, Switch or SearchBox instead of a native <input>."],
  ["select", "Use Fluent Select, Dropdown or Combobox instead of a native <select>."],
  ["textarea", "Use Fluent Textarea instead of a native <textarea>."],
  ["a", "Use Fluent Link, NavItem or BreadcrumbItem instead of a native <a>."],
  ["dialog", "Use Fluent Dialog instead of a native <dialog>."],
  ["progress", "Use Fluent ProgressBar or Spinner instead of a native <progress>."],
  ["table|thead|tbody|tfoot|tr|td|th", "Use Fluent Table or DataGrid instead of native table elements."],
].map(([names, message]) => ({
  selector: `JSXOpeningElement[name.name=/^(${names})$/]`,
  message,
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
              group: [
                "@mui/*", "@emotion/styled",
                "/antd", "/antd/*", "@ant-design/*",
                "@chakra-ui/*",
                "/react-bootstrap", "/react-bootstrap/*", "/bootstrap",
                "@radix-ui/*", "@headlessui/*",
                "@mantine/*", "/semantic-ui-react", "/primereact", "/primereact/*",
                "@blueprintjs/*", "@nextui-org/*", "@heroui/*",
              ],
              message: "Use Fluent UI v9 (@fluentui/react-components). No other UI library.",
            },
            {
              group: [
                "/react-icons", "/react-icons/*",
                "/lucide-react", "/lucide-react/*",
                "@heroicons/*", "@fortawesome/*",
                "@tabler/icons-react", "@phosphor-icons/*",
                "@mui/icons-material", "@mui/icons-material/*",
                "@ant-design/icons",
              ],
              message: "Icons come from @fluentui/react-icons only.",
            },
            {
              group: [
                "@fluentui/react", "@fluentui/react/*",
                "@fluentui/react-northstar", "@fluentui/react-northstar/*",
                "/office-ui-fabric-react", "/office-ui-fabric-react/*",
              ],
              message: "Fluent v8 / Northstar are not allowed. Use @fluentui/react-components (v9).",
            },
          ],
        },
      ],
      "no-restricted-syntax": ["error", ...NATIVE],
    },
  },
];
