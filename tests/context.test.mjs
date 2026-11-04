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
  assert.match(r.out, /Cards: +standard style radius=borderRadiusXLarge.*\(2x\)[\s\S]*also radius=borderRadiusMedium.*Log\.tsx[\s\S]*Leave other pages as they are(?![\s\S]*shared component)/);
  assert.doesNotMatch(r.out, /^Next:/m, "the card that ran this is what the agent reads next: no second routing");
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
  assert.doesNotMatch(r.out, /start at step 2/);

  // The migrate route on a v9 app says there is nothing to migrate.
  assert.match(ctx("migrate").out, /Note: +this project is fluent-v9-stock-theme, not Fluent v8: there is nothing to migrate/);

  // No route: says which routes exist (a small fix has none).
  assert.match(ctx().out, /Route: +run with the task's route: restyle \| new-page \| new-app \| migrate/);

  // On a Fluent v8 app the migrate route does not ask whether this is a migration, and themePrimary is the brand.
  const v8 = mkdtempSync(join(tmpdir(), "fk-context-v8-"));
  try {
    mkdirSync(join(v8, "src"));
    writeFileSync(join(v8, "package.json"), JSON.stringify({ dependencies: { "@fluentui/react": "^8" } }));
    writeFileSync(join(v8, "src/theme.ts"), 'import { createTheme } from "@fluentui/react";\nexport const t = createTheme({ palette: { themePrimary: "#0f6cbd" } });\n');
    const m = spawnSync(process.execPath, [join(kit, "context.mjs"), "migrate"], { cwd: v8, encoding: "utf8" }).stdout;
    assert.match(m, /Theme: +Fluent v8, migrating to v9 screen by screen/);
    assert.doesNotMatch(m, /Ask the user whether this task is a migration/);
    assert.match(m, /Brand: +Brand color #0f6cbd found \(Fluent v8 themePrimary/);
    assert.match(m, /make-theme\.mjs #0f6cbd --out src\/theme\.tsx/);
  } finally { rmSync(v8, { recursive: true, force: true }); }

  // An empty folder (only the kit): no package.json, and the one command that creates the app; never "install Fluent" into nothing.
  const empty = mkdtempSync(join(tmpdir(), "fk-context-empty-"));
  try {
    const e = spawnSync(process.execPath, [join(kit, "context.mjs"), "new-app"], { cwd: empty, encoding: "utf8" }).stdout;
    assert.match(e, /Result: +no package\.json/);
    assert.match(e, /Setup: +no app yet\. Create it in this folder with: node \.fluent-kit\/scripts\/scaffold\.mjs --brand <#hex\|stock> --lang <code>/);
    assert.doesNotMatch(e, /npm install @fluentui/);
    assert.match(e, /Brand: +none yet: ask for the brand hex or "stock"/);
  } finally { rmSync(empty, { recursive: true, force: true }); }

  // --no-cache reads but never writes (the installer's dry run).
  rmSync(join(dir, ".fluent-kit/context.json"));
  ctx("restyle", "--no-cache");
  assert.ok(!existsSync(join(dir, ".fluent-kit/context.json")));

  console.log("context: all tests passed");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
