// Tests .fluent-kit/scripts/context.mjs in a throwaway project: one call reports theme, language, PROFILE.md and the
// standard card; the scan is cached and redone when an input changes. Run: node tests/context.test.mjs
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const kit = resolve(".fluent-kit/scripts");
const dir = mkdtempSync(join(tmpdir(), "fk-context-"));
const ctx = (...a) => { const r = spawnSync(process.execPath, [join(kit, "context.mjs"), ...a], { cwd: dir, encoding: "utf8" }); return { code: r.status, out: r.stdout + r.stderr }; };
const card = (name, radius) => `import { makeStyles, tokens } from "@fluentui/react-components";\nexport const useS = makeStyles({ ${name}: { borderRadius: tokens.${radius}, boxShadow: tokens.shadow4, padding: tokens.spacingHorizontalL } });\n`;

try {
  mkdirSync(join(dir, "src"), { recursive: true });
  mkdirSync(join(dir, ".fluent-kit"), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { "@fluentui/react-components": "^9.75.0", "@fluentui/react-icons": "^2.0.0" } }));
  writeFileSync(join(dir, "index.html"), '<!doctype html><html lang="nl"><body></body></html>');
  writeFileSync(join(dir, "src/main.tsx"), 'import { FluentProvider, webLightTheme } from "@fluentui/react-components";\nexport const A = () => <FluentProvider theme={webLightTheme}><div /></FluentProvider>;\n');
  writeFileSync(join(dir, "src/Home.tsx"), card("kpiCard", "borderRadiusXLarge"));
  writeFileSync(join(dir, "src/Stats.tsx"), card("statCard", "borderRadiusXLarge"));
  writeFileSync(join(dir, "src/Log.tsx"), card("logCard", "borderRadiusMedium"));
  writeFileSync(join(dir, ".fluent-kit/PROFILE.md"), "# Organisation profile\n\nCopy this file to PROFILE.md.\n\n- Address the user formally.\n");

  let r = ctx("restyle");
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /^Fluent kit context for restyle\n/);
  assert.match(r.out, /Theme: +Fluent v9 on the stock Microsoft theme: keep it/);
  assert.doesNotMatch(r.out, /^Result:/m, "no detection detail for an app already on Fluent v9");
  assert.match(r.out, /Language: +nl: write UI text in it/);
  assert.match(r.out, /Profile: +\.fluent-kit\/PROFILE\.md[\s\S]*Address the user formally/);
  assert.doesNotMatch(r.out, /Copy this file/, "template boilerplate is left out");
  assert.match(r.out, /Cards: +standard style radius=borderRadiusXLarge.*\(2x\)[\s\S]*also radius=borderRadiusMedium.*Log\.tsx/);
  assert.match(r.out, /Next: +read \.github\/skills\/fluent-ui\/tasks\/restyle\.md/);
  assert.ok(existsSync(join(dir, ".fluent-kit/context.json")));
  assert.match(readFileSync(join(dir, ".fluent-kit/.gitignore"), "utf8"), /context\.json/);

  // Cached on the next call; a changed input means a fresh scan.
  assert.match(ctx("new-page").out, /\(cached; --refresh to rescan\)/);
  writeFileSync(join(dir, ".fluent-kit/PROFILE.md"), "# Organisation profile\n\n- Address the user informally.\n");
  r = ctx("new-page");
  assert.doesNotMatch(r.out, /cached/);
  assert.match(r.out, /informally/);
  assert.match(ctx("new-page", "--refresh").out, /^Fluent kit context for new-page\n/);

  // The new-app route shows the detection detail the card's table needs; the card scan is skipped.
  r = ctx("new-app");
  assert.match(r.out, /Result: +fluent-v9-stock-theme/);
  assert.doesNotMatch(r.out, /^Cards:/m);
  assert.match(r.out, /tasks\/new-app\.md \(start at step 2/);

  // The skill path follows the install.
  writeFileSync(join(dir, ".fluent-kit/manifest.json"), JSON.stringify({ skill: ".claude/skills/fluent-ui", files: [] }));
  assert.match(ctx("small-fix").out, /Next: +read \.claude\/skills\/fluent-ui\/tasks\/small-fix\.md/);

  console.log("context: all tests passed");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
