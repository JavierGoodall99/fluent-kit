// Tests .fluent-kit/scripts/doctor.mjs: a clean install has nothing to fix, and each way an install goes wrong is named.
// Run: node tests/doctor.test.mjs
import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const install = resolve("install.mjs");
const tmp = mkdtempSync(join(tmpdir(), "fk-doctor-"));
const env = { ...process.env, NODE_PATH: "" };
const run = (args, cwd) => spawnSync(process.execPath, args, { cwd, encoding: "utf8", env });

function project(name, ...flags) {
  const dir = join(tmp, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name, private: true, scripts: { dev: "echo dev" }, dependencies: { "@fluentui/react-components": "^9.0.0" } }));
  const r = run([install, dir, ...flags], dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return dir;
}
const doctor = (dir, ...a) => { const r = run([join(dir, ".fluent-kit/scripts/doctor.mjs"), ...a], dir); return { code: r.status, out: r.stdout + r.stderr }; };

try {
  // A clean install: nothing to fix.
  let d = project("clean");
  let r = doctor(d);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /Nothing to fix/);
  assert.match(r.out, /All \d+ kit files are present/);
  assert.match(r.out, /The skill files are unchanged since install/);
  assert.match(r.out, /One copy of the skill/);
  assert.match(r.out, /carries the kit block/);
  const j = JSON.parse(doctor(d, "--json").out);
  assert.ok(Array.isArray(j.findings) && j.findings.every((f) => ["ok", "warn", "FIX"].includes(f.level)));

  // Not installed at all.
  const bare = join(tmp, "bare"); mkdirSync(bare);
  { const x = run([resolve(".fluent-kit/scripts/doctor.mjs"), bare], bare); r = { code: x.status, out: x.stdout + x.stderr }; }
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /The kit is not installed here/);
  assert.match(r.out, /No instruction file carries the kit block/);

  // A second copy of the skill in another folder.
  d = project("duplicate");
  cpSync(join(d, ".github/skills/fluent-ui"), join(d, ".claude/skills/fluent-ui"), { recursive: true });
  r = doctor(d);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /installed 2 times/);

  // A missing kit file.
  d = project("missing");
  rmSync(join(d, ".fluent-kit/scripts/consistency.mjs"));
  r = doctor(d);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /kit file\(s\) are missing: \.fluent-kit\/scripts\/consistency\.mjs/);

  // The block points at a skill folder that is not the installed one.
  d = project("wrongpath");
  const ci = join(d, ".github/copilot-instructions.md");
  writeFileSync(ci, readFileSync(ci, "utf8").split(".github/skills/fluent-ui/").join(".claude/skills/fluent-ui/"));
  r = doctor(d);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /copilot-instructions\.md points to \.claude\/skills\/fluent-ui/);

  // An edited skill file is a warning, not a failure; CRLF line endings alone are not an edit.
  d = project("edited");
  const card = join(d, ".github/skills/fluent-ui/tasks/small-fix.md");
  writeFileSync(card, readFileSync(card, "utf8").replace(/\n/g, "\r\n"));
  r = doctor(d);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /The skill files are unchanged since install/);
  writeFileSync(card, readFileSync(card, "utf8") + "\nExtra rule.\n");
  r = doctor(d);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /warn\s+The skill files differ from what was installed/);

  // Bad local JSON and an unignored signed-in profile.
  d = project("local");
  writeFileSync(join(d, ".fluent-kit/verify-ignore.json"), '{"not": "an array"}');
  mkdirSync(join(d, ".verify-profile"));
  r = doctor(d);
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /verify-ignore\.json must be an array of strings/);
  assert.match(r.out, /\.verify-profile holds a signed-in browser session and is not in \.gitignore/);
  writeFileSync(join(d, ".fluent-kit/verify-ignore.json"), "[ not json");
  assert.match(doctor(d).out, /verify-ignore\.json is not valid JSON/);
  writeFileSync(join(d, ".fluent-kit/verify-ignore.json"), '["ResizeObserver"]');
  writeFileSync(join(d, ".gitignore"), ".verify-profile/\n");
  r = doctor(d);
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /\.verify-profile .* is ignored by git/);

  // Dependencies: Playwright missing is a warning with the install command.
  r = doctor(project("deps"));
  assert.match(r.out, /warn\s+Playwright is not installed[\s\S]*npm install -D playwright axe-core/);

  console.log("doctor: all tests passed");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
