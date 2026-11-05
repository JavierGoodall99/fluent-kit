// Renders every example in the skill in a real browser and checks it with the kit's own verify, at 1440 and 375px.
// The examples are what agents copy, so a layout bug here ends up in every app built from them (the backtest copied a
// phone overlap from status-grid.tsx). Fails on any verify error and on any control drawn over text.
// Run: node tests/render-examples.mjs   (needs Edge, Chrome or Playwright's Chromium on the machine)
import { build } from "esbuild";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const tmp = mkdtempSync(join(tmpdir(), "fk-examples-"));
const demo = readFileSync("tests/examples/demo.tsx", "utf8");
const all = [...demo.matchAll(/^\s*"([\w-]+)": \(\) =>/gm)].map((m) => m[1]);
const names = all.filter((n) => !n.startsWith("bad-"));
// Examples whose content sits behind a click: open it, so its layout is checked too.
const PAGE_LEVEL = /\[(landmark-one-main|page-has-heading-one|region)\]/;
const CLICK = { "status-grid": "role=button[name='Expand Payments']", "form-page": "role=combobox[name='Team']" };
// Fixtures that break a rule on purpose: verify must report each one, or its probe has stopped working.
const BAD = { "bad-grid": { expect: /^Cards in a grid are not one size/ }, "bad-dropdown": { click: "role=combobox", expect: /^An open list is too tall/ }, "bad-scrollbar": { expect: /^Scrolling areas use the browser's default scrollbar/ } };
const FAIL = /^(A control covers text|Cards in a grid are not one size|An open list is too tall|Scrolling areas use the browser)/;

let server;
const run = (cmd, a, o) => new Promise((done) => {
  const c = spawn(cmd, a, o); let stdout = "", stderr = "";
  c.stdout.on("data", (d) => (stdout += d)); c.stderr.on("data", (d) => (stderr += d));
  c.on("close", (status) => done({ status, stdout, stderr }));
});
try {
  await build({ entryPoints: ["tests/examples/demo.tsx"], bundle: true, outfile: join(tmp, "demo.js"), format: "esm", jsx: "automatic", logLevel: "error", define: { "process.env.NODE_ENV": '"development"' } });
  writeFileSync(join(tmp, "index.html"), '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Fluent kit examples</title><link rel="icon" href="data:,"></head><body><div id="root"></div><script type="module" src="demo.js"></script></body></html>');
  server = createServer((req, res) => {
    const file = req.url.split(/[?#]/)[0] === "/demo.js" ? "demo.js" : "index.html";
    res.writeHead(200, { "content-type": file.endsWith(".js") ? "text/javascript" : "text/html" });
    res.end(readFileSync(join(tmp, file)));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/`;

  const out = join(tmp, "out");
  const runs = [names.filter((n) => !CLICK[n]), ...Object.keys(CLICK).map((n) => [n])];
  const failures = [], notes = [];
  for (const group of runs) {
    const click = group.length === 1 && CLICK[group[0]];
    // Async: this process also serves the pages, so it must not block while verify loads them.
    const r = await run(process.execPath, [resolve(".fluent-kit/scripts/verify.mjs"), ...group.map((n) => `${base}#${n}`), "--widths", "1440,375", "--out", out, "--no-login", ...(click ? ["--click", click] : [])], { env: { ...process.env, CI: "1" } });
    let report;
    try { report = JSON.parse(readFileSync(join(out, "verify-report.json"), "utf8")); } catch { failures.push(`verify did not run for ${group.join(", ")}:\n${(r.stdout + r.stderr).trim().split("\n").slice(-8).join("\n")}`); continue; }
    if (!report.renders) { failures.push(`nothing rendered for ${group.join(", ")}:\n${(r.stdout + r.stderr).trim().split("\n").slice(-8).join("\n")}`); continue; }
    for (const p of report.problems) {
      const where = p.where.map((w) => w.replace(base, "")).join(", ");
      if (PAGE_LEVEL.test(p.msg)) continue; // an example is a fragment of a page: its main and h1 are the app's
      if (p.level === "error" || FAIL.test(p.msg)) failures.push(`${where}: ${p.msg}`);
      else notes.push(`${p.level}  ${where}: ${p.msg.slice(0, 160)}`);
    }
  }
  for (const [name, bad] of Object.entries(BAD)) {
    const r = await run(process.execPath, [resolve(".fluent-kit/scripts/verify.mjs"), `${base}#${name}`, "--widths", "1440", "--out", out, "--no-login", ...(bad.click ? ["--click", bad.click] : [])], { env: { ...process.env, CI: "1" } });
    let report; try { report = JSON.parse(readFileSync(join(out, "verify-report.json"), "utf8")); } catch { report = { problems: [] }; }
    if (!report.problems.some((p) => bad.expect.test(p.msg))) failures.push(`${name}: verify did not report what this fixture breaks (${bad.expect}); its probe no longer works.\n${(r.stdout + r.stderr).trim().split("\n").slice(-6).join("\n")}`);
  }
  for (const n of notes) console.log(n);
  for (const f of failures) console.log(`FAIL  ${f}`);
  console.log(failures.length ? `\nrender-examples: ${failures.length} problem(s) in ${names.length} examples.` : `render-examples: all ${names.length} examples render clean at 1440 and 375px; ${Object.keys(BAD).length} bad fixtures are caught.`);
  process.exitCode = failures.length ? 1 : 0;
} finally {
  server?.close();
  if (process.env.KEEP_OUT) console.log(`screenshots kept in ${tmp}/out`); else rmSync(tmp, { recursive: true, force: true });
}
