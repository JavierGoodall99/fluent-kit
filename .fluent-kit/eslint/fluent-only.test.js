"use strict";

const assert = require("node:assert");
const { ESLint } = require("eslint");
const fluentOnly = require("./fluent-only.cjs");

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    {
      languageOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
    },
    ...fluentOnly,
  ],
});

async function lint(code) {
  const [result] = await eslint.lintText(code, { filePath: "src/sample.jsx" });
  return result.messages;
}

const valid = [
  `import { Button, makeStyles, tokens } from "@fluentui/react-components";`,
  `import { Add20Regular, bundleIcon } from "@fluentui/react-icons";`,
  `import { PageHeader } from "@acme/ui";`,
  `import React from "react";`,
  `const a = <div><span>ok</span><Button>Save</Button></div>;`,
  `const a = <Link href="/x">Go</Link>;`,
  `const a = <Table><TableBody /></Table>;`,
];

const invalid = [
  [`import { Button } from "@mui/material";`, "no-restricted-imports"],
  [`import { Button } from "antd";`, "no-restricted-imports"],
  [`import { Button } from "@chakra-ui/react";`, "no-restricted-imports"],
  [`import { Dialog } from "@radix-ui/react-dialog";`, "no-restricted-imports"],
  [`import { FaBeer } from "react-icons/fa";`, "no-restricted-imports"],
  [`import { Home } from "lucide-react";`, "no-restricted-imports"],
  [`import { DefaultButton } from "@fluentui/react";`, "no-restricted-imports"],
  [`import { Stack } from "@fluentui/react/lib/Stack";`, "no-restricted-imports"],
  [`import { Button } from "@fluentui/react-northstar";`, "no-restricted-imports"],
  [`const a = <button>Save</button>;`, "no-restricted-syntax"],
  [`const a = <input type="text" />;`, "no-restricted-syntax"],
  [`const a = <select><option>1</option></select>;`, "no-restricted-syntax"],
  [`const a = <textarea />;`, "no-restricted-syntax"],
  [`const a = <a href="/x">Go</a>;`, "no-restricted-syntax"],
  [`const a = <dialog open />;`, "no-restricted-syntax"],
  [`const a = <table><tbody><tr><td>1</td></tr></tbody></table>;`, "no-restricted-syntax"],
];

(async () => {
  for (const code of valid) {
    const msgs = await lint(code);
    assert.strictEqual(msgs.length, 0, `Expected no errors for: ${code}\nGot: ${JSON.stringify(msgs.map((m) => m.message))}`);
  }
  for (const [code, ruleId] of invalid) {
    const msgs = await lint(code);
    assert.ok(msgs.length >= 1, `Expected an error for: ${code}`);
    assert.ok(msgs.every((m) => m.ruleId === ruleId || m.fatal === false), `Unexpected rule for: ${code}`);
    assert.ok(msgs.some((m) => m.ruleId === ruleId), `Expected ${ruleId} for: ${code}\nGot: ${JSON.stringify(msgs.map((m) => m.ruleId))}`);
  }
  // Table elements should each be reported (table, tbody, tr, td).
  const tableMsgs = await lint(`const a = <table><tbody><tr><td>1</td></tr></tbody></table>;`);
  assert.strictEqual(tableMsgs.length, 4, "Each native table element should be reported");

  console.log(`fluent-only: all ${valid.length + invalid.length + 1} checks passed`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
