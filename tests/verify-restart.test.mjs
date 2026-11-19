// verify starts a dev server again when it exits after printing its URL (F-100). Two fake servers: one exits before
// anything answers, one dies after its first answer, so the page load is refused. Needs a browser, like render-examples.
// Run: node tests/verify-restart.test.mjs
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, rmdirSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const scripts = resolve(".fluent-kit/scripts");
const FAKE = (port, mode) => `
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
const first = !existsSync("started-once");
if (first) writeFileSync("started-once", "1");
const mode = ${JSON.stringify(mode)};
if (first && mode === "exits-first") { console.log("  Local: http://localhost:${port}/"); setTimeout(() => process.exit(0), 1500); }
else createServer((q, r) => { r.setHeader("content-type", "text/html"); r.end(readFileSync("index.html")); if (first) setTimeout(() => process.exit(0), 50); })
  .listen(${port}, () => console.log("  Local: http://localhost:${port}/"));
`;
const failures = [];
for (const [mode, port] of [["exits-first", 4597], ["dies-after-answer", 4596]]) {
  const dir = mkdtempSync(join(tmpdir(), "fk-restart-"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "fake", scripts: { dev: "node fake.mjs" } }));
  writeFileSync(join(dir, "index.html"), "<!doctype html><title>Fake app</title><main><h1>Hi</h1></main>");
  writeFileSync(join(dir, "fake.mjs"), FAKE(port, mode));
  mkdirSync(join(dir, ".fluent-kit"));
  cpSync(scripts, join(dir, ".fluent-kit", "scripts"), { recursive: true });
  symlinkSync(resolve("node_modules"), join(dir, "node_modules"), "junction"); // verify finds Playwright in the project, as in CI
  const r = spawnSync(process.execPath, [".fluent-kit/scripts/verify.mjs", "--start", "/", "--widths", "375", "--no-login", "--out", "out"], { cwd: dir, encoding: "utf8", timeout: 180000 });
  const out = r.stdout + r.stderr;
  let renders = 0; try { renders = JSON.parse(readFileSync(join(dir, "out", "verify-report.json"), "utf8")).renders; } catch { /* none */ }
  if (!/Starting it again/.test(out)) failures.push(`${mode}: verify did not start the server again`);
  if (/using the one already running/.test(out)) failures.push(`${mode}: verify took a dead server for a running one`);
  if (!renders) failures.push(`${mode}: no page was checked\n${out.slice(-500)}`);
  try { unlinkSync(join(dir, "node_modules")); } catch { try { rmdirSync(join(dir, "node_modules")); } catch { /* gone */ } } // never delete through the link
  rmSync(dir, { recursive: true, force: true });
}
if (failures.length) { console.error("verify-restart: FAILED\n" + failures.join("\n")); process.exit(1); }
console.log("verify-restart: a dev server that exits is started again in both cases.");
