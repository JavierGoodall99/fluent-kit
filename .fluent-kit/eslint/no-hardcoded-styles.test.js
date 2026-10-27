"use strict";

const { RuleTester } = require("eslint");
const plugin = require("./no-hardcoded-styles");

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

tester.run("no-hardcoded-styles", plugin.rules["no-hardcoded-styles"], {
  valid: [
    // Tokens are the right way
    `const s = makeStyles({ card: { padding: tokens.spacingVerticalL, borderRadius: tokens.borderRadiusMedium, backgroundColor: tokens.colorNeutralBackground1 } });`,
    // Zero and keywords are fine
    `const s = { margin: 0, padding: "0", width: "100%", gap: "auto" };`,
    // Template with tokens only
    "const s = { border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}` };",
    // Anchors and ids that look like hex
    `const a = <a href="#add">Add</a>;`,
    `const b = <div id="#fee" />;`,
    // Non-style strings
    `const msg = "Order #123 shipped";`,
    // Import source
    `import x from "#abc";`,
    // Width in px is not in the checked property list
    `const s = { width: "320px", maxWidth: "1200px" };`,
  ],

  invalid: [
    { code: `const s = { color: "#fff" };`, errors: [{ messageId: "hardcodedColor" }] },
    { code: `const s = { color: "#1A2B3C" };`, errors: [{ messageId: "hardcodedColor" }] },
    { code: `const s = { background: "rgb(0, 120, 212)" };`, errors: [{ messageId: "hardcodedColor" }] },
    { code: `const s = { background: "hsla(210, 100%, 40%, 0.5)" };`, errors: [{ messageId: "hardcodedColor" }] },
    { code: `const s = { border: "1px solid #ccc" };`, errors: [{ messageId: "hardcodedColor" }] },
    { code: `const s = { background: "linear-gradient(#fff, #000)" };`, errors: [{ messageId: "hardcodedColor" }] },
    { code: "const s = { color: `rgb(${r}, 0, 0)` };", errors: [{ messageId: "hardcodedColor" }] },
    { code: `const s = { padding: 8 };`, errors: [{ messageId: "hardcodedSpacing" }] },
    { code: `const s = { padding: "8px 16px" };`, errors: [{ messageId: "hardcodedSpacing" }] },
    { code: `const s = { marginTop: "1rem" };`, errors: [{ messageId: "hardcodedSpacing" }] },
    { code: `const s = { gap: "12px" };`, errors: [{ messageId: "hardcodedSpacing" }] },
    { code: `const s = { borderRadius: "6px" };`, errors: [{ messageId: "hardcodedSpacing" }] },
    { code: `const s = { "paddingLeft": 4 };`, errors: [{ messageId: "hardcodedSpacing" }] },
    { code: "const s = { padding: `${tokens.spacingVerticalS} 16px` };", errors: [{ messageId: "hardcodedSpacing" }] },
    // Inline JSX style
    { code: `const a = <div style={{ color: "#333", padding: 12 }} />;`, errors: [{ messageId: "hardcodedColor" }, { messageId: "hardcodedSpacing" }] },
    // Color attribute that is not href/id/to
    { code: `const a = <Icon color="#ff0000" />;`, errors: [{ messageId: "hardcodedColor" }] },
  ],
});

console.log("no-hardcoded-styles: all tests passed");
