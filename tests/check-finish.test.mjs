// Tests `check.mjs --finish` in throwaway git repos: each step stops the run when it fails, verify only runs when
// something visible changed and Playwright is there, and the page is required (or read from a Next.js route).
// Run: node tests/check-finish.test.mjs
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const check = resolve(".fluent-kit/scripts/check.mjs");
const repoModules = resolve("node_modules");
const tmp = mkdtempSync(join(tmpdir(), "fk-finish-"));
const env = { ...process.env, NODE_PATH: "" }; // only the test project's own packages count

function project(name, { ts = false, playwright = false } = {}) {
  const dir = join(tmp, name);
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name, private: true, type: "module" }));
  writeFileSync(join(dir, ".gitignore"), "node_modules\n");
  writeFileSync(join(dir, "src/Page.tsx"), 'import { Button } from "@fluentui/react-components";\nexport const Page = () => <Button>Save</Button>;\n');
  if (ts) {
    mkdirSync(join(dir, "node_modules"), { recursive: true });
    symlinkSync(join(repoModules, "typescript"), join(dir, "node_modules/typescript"), "junction");
    writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true, noEmit: true, jsx: "preserve", skipLibCheck: true, noResolve: true, types: [] }, include: ["src/plain.ts"] }));
    writeFileSync(join(dir, "src/plain.ts"), "export const n: number = 1;\n");
  }
  if (playwright) {
    mkdirSync(join(dir, "node_modules/playwright"), { recursive: true });
    writeFileSync(join(dir, "node_modules/playwright/package.json"), JSON.stringify({ name: "playwright", main: "index.js" }));
    writeFileSync(join(dir, "node_modules/playwright/index.js"), "module.exports = {};\n");
  }
  const git = (...a) => spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...a], { cwd: dir });
  git("init", "-q"); git("add", "."); git("commit", "-qm", "base");
  return dir;
}
const finish = (dir, ...a) => { const r = spawnSync(process.execPath, [check, "--finish", ...a], { cwd: dir, encoding: "utf8", env }); return { code: r.status, out: r.stdout + r.stderr }; };

try {
  // Nothing visible changed: no verify, exit 0.
  let d = project("comment");
  writeFileSync(join(d, "src/Page.tsx"), '// a note\nimport { Button } from "@fluentui/react-components";\nexport const Page = () => <Button>Save</Button>;\n');
  let r = finish(d);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /rules ok, tsc skipped \(no tsconfig\.json\), verify not needed \(nothing visible changed\)/);

  // A rules error stops everything.
  d = project("rules");
  writeFileSync(join(d, "src/Page.tsx"), 'export const Page = () => <button style={{ color: "#ff0000" }}>Save</button>;\n');
  r = finish(d, "--page", "/");
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /stopped at the rules/);
  assert.doesNotMatch(r.out, /verify\.mjs/);

  // A type error stops before verify, and shows the tsc output.
  d = project("tsc", { ts: true, playwright: true });
  writeFileSync(join(d, "src/plain.ts"), 'export const n: number = "one";\n');
  writeFileSync(join(d, "src/Page.tsx"), 'import { Button } from "@fluentui/react-components";\nexport const Page = () => <Button>Opslaan</Button>;\n');
  r = finish(d, "--page", "/");
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /\$ tsc --noEmit[\s\S]*TS2322[\s\S]*stopped at tsc/);

  // Visible change, no Playwright: not available, says so, exit 0 (no loop).
  d = project("noplaywright");
  writeFileSync(join(d, "src/Page.tsx"), 'import { Button } from "@fluentui/react-components";\nexport const Page = () => <Button>Opslaan</Button>;\n');
  r = finish(d, "--page", "/");
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /verify not available \(Playwright is not installed\): say in your reply that the UI was not verified/);

  // Visible change, Playwright present, no page and no route to read it from: asks for --page.
  d = project("nopage", { ts: true, playwright: true });
  writeFileSync(join(d, "src/Page.tsx"), 'import { Button } from "@fluentui/react-components";\nexport const Page = () => <Button>Opslaan</Button>;\n');
  r = finish(d);
  assert.equal(r.code, 2, r.out);
  assert.match(r.out, /rules ok, tsc ok, verify needed \(src\/Page\.tsx changed visibly\): run again with --page/);

  // The person asked to skip checks: rules and tsc still run, verify is skipped and flagged.
  r = finish(d, "--no-verify");
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /rules ok, tsc ok, verify skipped at the person's request/);

  // --no-verify is honoured for an icon, text or colour edit, and ignored when size, spacing, width or layout change.
  const page = (body) => `import { Button, Text, makeStyles, tokens } from "@fluentui/react-components";\nimport { Add20Regular } from "@fluentui/react-icons";\nconst useStyles = makeStyles({ box: { ${body.style} } });\nexport const Page = () => { const s = useStyles(); return <div className={s.box}>${body.jsx}</div>; };\n`;
  const base = { style: "color: tokens.colorNeutralForeground1, paddingTop: tokens.spacingVerticalM", jsx: '<Button icon={<Add20Regular />} size="medium">Save</Button><Text>Hello</Text>' };
  const edit = (name, body) => {
    const dir = project(name, { ts: true, playwright: true });
    writeFileSync(join(dir, "src/Page.tsx"), page(base));
    spawnSync("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qam", "page"], { cwd: dir });
    writeFileSync(join(dir, "src/Page.tsx"), page({ ...base, ...body }));
    return dir;
  };
  for (const [name, body] of [
    ["text", { jsx: base.jsx.replace("Hello", "Hallo") }],
    ["colour", { style: base.style.replace("colorNeutralForeground1", "colorBrandForeground1") }],
    ["icon", { jsx: base.jsx.replace("icon={<Add20Regular />} ", "") }],
  ]) {
    r = finish(edit(`skip-${name}`, body), "--no-verify");
    assert.equal(r.code, 0, `${name}: ${r.out}`);
    assert.match(r.out, /verify skipped at the person's request/, name);
  }
  for (const [name, body] of [
    ["size", { jsx: base.jsx.replace('size="medium"', 'size="large"') }],
    ["padding", { style: base.style.replace("spacingVerticalM", "spacingVerticalXXL") }],
    ["width", { style: `${base.style}, maxWidth: "40rem"` }],
    ["layout", { style: `${base.style}, display: "flex"` }],
    ["element", { jsx: `${base.jsx}<Text>More</Text>` }],
  ]) {
    r = finish(edit(`ignore-${name}`, body), "--no-verify");
    assert.equal(r.code, 2, `${name}: ${r.out}`); // verify is needed and there is no --page here
    assert.match(r.out, /--no-verify ignored \(size, spacing, width or layout changed in src\/Page\.tsx\)/, name);
    assert.match(r.out, /verify needed/, name);
  }
  // A new UI file counts as layout too.
  d = edit("ignore-newfile", {});
  writeFileSync(join(d, "src/Page.tsx"), page(base));
  writeFileSync(join(d, "src/Extra.tsx"), page(base));
  r = finish(d, "--no-verify");
  assert.match(r.out, /--no-verify ignored/);

  // A Next.js route is read from the file path (verify then fails to start here, which is reported, not hidden).
  d = project("next", { playwright: true });
  mkdirSync(join(d, "app/(shop)/invoices"), { recursive: true });
  writeFileSync(join(d, "app/(shop)/invoices/page.tsx"), 'import { Button } from "@fluentui/react-components";\nexport default function P() { return <Button>New</Button>; }\n');
  r = finish(d);
  assert.match(r.out, /\$ node \.fluent-kit\/scripts\/verify\.mjs --start \/invoices/);
  assert.match(r.out, /verify could not run \(see above\)/);
  assert.equal(r.code, 2);

  console.log("check --finish: all tests passed");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
