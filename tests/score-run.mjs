#!/usr/bin/env node
// Scores one benchmark run on the bench app (bench/app, set up by tests/bench-setup.mjs) against bench/expect.json.
// Run it from the bench app's root right after the agent finishes, before the reset. tests/record-run.mjs calls it by itself
// when the app is the bench app.
//   node <kit>/tests/score-run.mjs --prompt 4 [--app <dir>] [--no-browser] [--json]
// Four of the six quality checks get a machine verdict, P (pass), F (fail) or ? (could not tell), with the reasons:
//   Scope    only the files the prompt is about changed (main.tsx and theme files always may); no file deleted; every
//            feature the page had is still used (its search, filter, export, paging, data).
//   Uniform  no new card style in the app (consistency.mjs before and after); for #8 the activity log's cards share one style
//            with home's; no "cards not one size" from verify.
//   Correct  tsc passes; no new kit rule errors in the changed files; no new English UI text in this Dutch app; the
//            prompt's own checks (#6 every status from the data, #10 a customer list, #11 aligned figures); a new page uses its data.
//   States   verify, run here by the scorer at 1440 and 375px on the changed page: no new errors, and nothing newly cut off,
//            scrolling sideways, covering text or too small. Problems the page already had before the run do not count.
// First glance and honest note stay with the person: those two letters are always "-".
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmdirSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { problemKinds } from "../.fluent-kit/scripts/lib.mjs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const kit = resolve(here, "..");
export const EXPECT = JSON.parse(readFileSync(join(kit, "bench", "expect.json"), "utf8"));
const ALWAYS = /^(src\/main\.tsx|src\/theme\.tsx|src\/.*theme.*\.tsx?|src\/index\.css|package\.json|package-lock\.json)$/;
const IGNORE = /^(\.fluent-kit\/|\.github\/|\.vscode\/|\.verify-profile\/|node_modules\/|dist\/)/;
// Hash of each page in the bench app, for the browser check.
const PAGE_OF = { "src/pages/Home.tsx": "home", "src/pages/ActivityLog.tsx": "activity", "src/pages/Tenants.tsx": "tenants", "src/pages/Billing.tsx": "billing", "src/pages/InvoiceForm.tsx": "invoice", "src/App.tsx": "tenants" };
// English words that do not occur in Dutch UI text. One of them in new UI text means a label was left in English.
const DUTCH = /\b(de|het|een|van|en|niet|geen|voor|met|naar|nog|zijn|wordt|alle|pas|bij|uit|op|zoek|om|te)\b/i; // "of" is Dutch for "or": it is on neither list
const ENGLISH = /\b(the|and|your|view|details|loading|error|errors|search|save|cancel|activity|settings|page|next|previous|tenants?|billing|invoices?|customers?|connected|failed|show|more|add|edit|delete|close|back|select|empty|retry|try again|last updated|no results|total|amount|paid|unpaid|overview|recent)\b/i;

const git = (cwd, a) => spawnSync("git", a, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).stdout || "";
const read = (p) => { try { return readFileSync(p, "utf8"); } catch { return null; } };
const verdict = (fails, unknown) => ({ v: fails.length ? "F" : unknown.length ? "?" : "P", why: [...fails, ...unknown.map((u) => `? ${u}`)] });

export function changes(app) {
  const out = [];
  for (const l of git(app, ["diff", "--name-status", "HEAD"]).split("\n").filter(Boolean)) {
    const [s, ...f] = l.split("\t"); const file = f.at(-1);
    if (!IGNORE.test(file)) out.push({ status: s[0], file });
  }
  for (const f of git(app, ["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean)) if (!IGNORE.test(f)) out.push({ status: "A", file: f });
  return out;
}

// UI text a diff adds: JSX text and the string props people read.
export function addedText(app) {
  const diff = git(app, ["diff", "HEAD", "--", "src"]) + changes(app).filter((c) => c.status === "A" && /\.tsx$/.test(c.file)).map((c) => (read(join(app, c.file)) || "").replace(/^/gm, "+")).join("\n");
  const texts = [];
  for (const line of diff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"))) {
    if (/^\+\s*(\/\/|\*|import\b)/.test(line)) continue;
    for (const m of line.matchAll(/>([^<>{}]*[A-Za-z][^<>{}]*)</g)) texts.push(m[1].trim());
    // Only string literals are text: title={e.tenant} is code, not an English label.
    for (const m of line.matchAll(/\b(?:label|placeholder|aria-label|title|content|description|header)=(?:"([^"]+)"|\{["`]([^"`}]+)["`]\})/g)) texts.push((m[1] || m[2]).trim());
  }
  return texts.filter(Boolean);
}

function consistency(dir) {
  const r = spawnSync(process.execPath, [join(kit, ".fluent-kit", "scripts", "consistency.mjs"), "src", "--json"], { cwd: dir, encoding: "utf8" });
  try { return JSON.parse(r.stdout).styles.map((s) => ({ ...s, where: s.where.map((w) => w.replace(/\\/g, "/")) })); } catch { return null; } // Windows paths
}
function before(app, fn) {
  const tmp = mkdtempSync(join(tmpdir(), "fk-score-"));
  try { spawnSync("git", ["worktree", "add", "--detach", tmp, "HEAD"], { cwd: app, stdio: "ignore" }); return fn(tmp); }
  finally {
    // Remove the links to the app's node_modules and .fluent-kit/deps first. On Windows, deleting the worktree with the
    // junctions still in it deletes what they point to: the app's own folders.
    for (const d of LINKED) { const p = join(tmp, d); try { if (lstatSync(p).isSymbolicLink()) { try { unlinkSync(p); } catch { rmdirSync(p); } } } catch { /* not linked */ } }
    spawnSync("git", ["worktree", "remove", "--force", tmp], { cwd: app, stdio: "ignore" }); rmSync(tmp, { recursive: true, force: true });
  }
}
const LINKED = ["node_modules", join(".fluent-kit", "deps")];

export function scoreRun({ app, prompt, browser = true, out }) {
  const exp = EXPECT[String(prompt)];
  if (!exp) throw new Error(`bench/expect.json has no prompt ${prompt}`);
  const ch = changes(app), edit = new Set(exp.edit || []);
  const info = { changed: ch.map((c) => `${c.status} ${c.file}`) };

  // Scope
  const sf = [], su = [];
  if (!ch.length) sf.push("nothing changed");
  for (const c of ch) {
    if (c.status === "D") sf.push(`deleted ${c.file}`);
    else if (c.status !== "A" && !edit.has(c.file) && !ALWAYS.test(c.file)) sf.push(`changed ${c.file}, which the prompt is not about`);
  }
  for (const [file, names] of Object.entries(exp.keep || {})) {
    const src = read(join(app, file));
    for (const n of names) if (!src || !new RegExp(`\\b${n}\\b`).test(src)) sf.push(`${file} no longer uses ${n} (a feature or its data was removed)`);
  }
  const scope = verdict(sf, su);

  // Uniform
  const uf = [], uu = [];
  const after = consistency(app), was = before(app, consistency);
  if (!after || !was) uu.push("consistency scan failed");
  else if (exp.uniform === "same-or-fewer") {
    // A style the app did not have before is drift, even when an old one went away at the same time.
    // A card that only gained a background (it blended into the page before) keeps its style.
    const bare = (x) => x.replace(/background=\S+/, "").replace(/\s+/g, " ").trim();
    const fresh = after.filter((s) => !was.some((w) => w.style === s.style || (/background=default/.test(w.style) && bare(w.style) === bare(s.style))));
    if (fresh.length) uf.push(`new card style(s) the app did not have: ${fresh.map((s) => `${s.style} in ${s.where.join(", ")}`).join("; ")}`);
  }
  else if (exp.uniform?.match) {
    const styleOf = (f) => after.filter((s) => s.where.some((w) => w.startsWith(f))).map((s) => s.style);
    const a = styleOf(exp.uniform.match), b = styleOf(exp.uniform.with);
    if (!a.length) uf.push(`no card styles found in ${exp.uniform.match}`);
    else if (a.some((s) => !b.includes(s))) uf.push(`${exp.uniform.match} cards (${a.join(" | ")}) differ from ${exp.uniform.with} (${b.join(" | ")})`);
  }
  info.cardStyles = { before: was?.length ?? null, after: after?.length ?? null };

  // Correct
  const cf = [], cu = [];
  const tsc = join(app, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
  if (!existsSync(tsc)) cu.push("tsc not installed in the app (npm install)");
  else { const r = spawnSync(process.platform === "win32" ? `"${tsc}"` : tsc, ["--noEmit", "-p", "."], { cwd: app, encoding: "utf8", shell: process.platform === "win32" }); if (r.status !== 0) cf.push(`tsc fails: ${(r.stdout || r.stderr).split("\n").filter(Boolean).slice(0, 2).join(" | ")}`); }
  // The app's baseline (written at setup) tolerates the bench app's planted findings: only new ones count, as for the agent.
  const touched = new Set(ch.filter((c) => c.status !== "D").map((c) => c.file));
  const rules = spawnSync(process.execPath, [join(kit, ".fluent-kit", "scripts", "check.mjs"), ".", "--json"], { cwd: app, encoding: "utf8" });
  try {
    const errs = JSON.parse(rules.stdout).findings.filter((f) => f.severity === "error" && touched.has(f.file.replace(/\\/g, "/")));
    if (errs.length) cf.push(`${errs.length} kit rule error(s) in changed files: ${[...new Set(errs.map((e) => `${e.rule} (${e.file}:${e.line})`))].slice(0, 3).join(", ")}`);
  } catch { cu.push("kit rules did not run"); }
  const english = addedText(app).filter((t) => ENGLISH.test(t) && !DUTCH.test(t)); // "details" is a Dutch word too
  if (english.length) cf.push(`new UI text in English in a Dutch app: ${english.slice(0, 3).map((t) => `"${t.slice(0, 40)}"`).join(", ")}`);
  for (const [file, rx] of Object.entries(exp.must || {})) for (const [p, why] of rx) if (!new RegExp(p).test(read(join(app, file)) || "")) cf.push(`${file}: ${why}`);
  for (const [file, rx] of Object.entries(exp.mustNot || {})) for (const [p, why] of rx) if (new RegExp(p).test(read(join(app, file)) || "")) cf.push(`${file}: ${why}`);
  let newPage = null;
  if (exp.new) {
    const added = ch.filter((c) => c.status === "A" && /\.tsx$/.test(c.file));
    newPage = added.find((c) => new RegExp(`\\b${exp.new}\\b`).test(read(join(app, c.file)) || ""))?.file || null;
    if (!newPage) cf.push(`no new page uses the ${exp.new} data from data.ts`);
  }
  const correct = verdict(cf, cu);

  // Every state: the scorer runs verify itself, so it does not depend on whether the agent did.
  const xf = [], xu = [];
  let hash = PAGE_OF[(exp.edit || []).find((f) => PAGE_OF[f])];
  if (exp.new) {
    const keys = (s) => new Set([...(s || "").matchAll(/(?:^|[{,])\s*["']?([\w-]+)["']?\s*:\s*\[/gm)].map((m) => m[1]));
    const now = keys(read(join(app, "src/App.tsx"))), old = keys(git(app, ["show", "HEAD:src/App.tsx"]));
    hash = [...now].find((k) => !old.has(k)) || null;
    if (!hash) xu.push("could not find the new page's route in App.tsx");
  }
  const verifyJs = join(app, ".fluent-kit", "scripts", "verify.mjs");
  const port = +((read(join(app, "vite.config.ts")) || "").match(/port:\s*(\d+)/)?.[1] || 5173);
  const taken = () => spawnSync(process.execPath, ["-e", `require("net").connect(${port}, "localhost").on("connect", () => process.exit(1)).on("error", () => process.exit(0))`]).status === 1;
  const verifyIn = (cwd, dir, again = true) => {
    const r = spawnSync(process.execPath, [verifyJs, "--start", `/#${hash}`, "--widths", "1440,375", "--out", dir, "--no-login", "--fresh-server"], { cwd, encoding: "utf8", env: { ...process.env, CI: "1" }, timeout: 300000 });
    try { const rep = JSON.parse(readFileSync(join(dir, "verify-report.json"), "utf8")); if (rep.renders) return rep; } catch { /* below */ }
    // Once more after a pause: on Windows the dev server can crash right after the previous one stopped (bench #5, 1.10).
    if (again) { spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 5000)"]); try { rmSync(join(cwd, "node_modules", ".vite"), { recursive: true, force: true }); } catch { /* in use */ } return verifyIn(cwd, dir, false); }
    return { renders: 0, tail: (r.stdout + r.stderr).trim().split("\n").slice(-10).join(" | ").replace(/\r/g, "").slice(0, 600) };
  };
  const kinds = problemKinds; // the same comparison check --finish makes
  const isOld = (was) => (p) => kinds(p).every((k) => (was || []).includes(k));
  if (!browser) xu.push("browser check skipped (--no-browser)");
  else if (!hash) { /* reason above */ }
  else if (!existsSync(verifyJs)) xu.push("the kit is not installed in the app");
  else if (taken()) xu.push(`port ${port} is in use: stop the dev server there, then record again with --force before you reset`); // verify would check that server, before and after alike
  else {
    // Problems the page had before the run do not count against it: verify the untouched page once, cached per base commit
    // in .bench/ (git-ignored, so the reset after a run keeps it). A new page had nothing before.
    const base = git(app, ["rev-parse", "--short", "HEAD"]).trim(), cache = join(app, ".bench", `verify2-${base}-${hash}.json`); // verify2: one kind per listed item
    let old = exp.new ? [] : (() => { try { return JSON.parse(readFileSync(cache, "utf8")); } catch { return null; } })();
    if (!old) {
      old = before(app, (tmp) => {
        for (const d of LINKED) if (existsSync(join(app, d))) symlinkSync(join(app, d), join(tmp, d), "junction");
        const rep = verifyIn(tmp, join(tmp, ".fluent-kit", "out"));
        return rep.renders ? rep.problems.flatMap(kinds) : null;
      });
      if (old) { mkdirSync(dirname(cache), { recursive: true }); writeFileSync(cache, JSON.stringify(old)); }
      else xu.push("verify could not render the page before the run, so every problem counts");
    }
    // The before-run dev server must be gone: verify uses a server it finds on the port, and that one served the old code.
    for (let i = 0; i < 40 && taken(); i++) spawnSync(process.execPath, ["-e", "setTimeout(() => {}, 500)"]);
    const dir = out || mkdtempSync(join(tmpdir(), "fk-score-verify-"));
    const rep = verifyIn(app, dir);
    if (!rep.renders) xu.push(`verify did not render the page (${rep.tail || "no output"})`);
    else {
      info.verify = { renders: rep.renders, errors: rep.errors, warnings: rep.warnings, out: dir, alreadyThere: rep.problems.filter(isOld(old)).length };
      for (const p of rep.problems.filter((q) => !isOld(old)(q))) {
        if (p.level === "error") xf.push(`verify error: ${p.msg.slice(0, 140)}`);
        else if (p.level === "warn" && /scroll(s)? sideways|cut off|covers text|smaller than 24px|crowd another|not one size|too tall/i.test(p.msg)) xf.push(`verify: ${p.msg.slice(0, 140)}`);
      }
      if (rep.problems.some((p) => /not one size/.test(p.msg))) uf.push("verify: cards in a grid are not one size");
    }
  }
  const states = verdict(xf, xu);
  const uniform = verdict(uf, uu);

  const checks = { scope, uniform, correct, states };
  return { prompt: Number(prompt), quality: `${scope.v}-${uniform.v}${correct.v}${states.v}-`, checks, info, newPage };
}

export function report(s) {
  const lines = [`Machine score for #${s.prompt}: ${s.quality}  (scope, first glance, uniform, correct, every state, note; "-" is for the person)`];
  for (const [k, c] of Object.entries(s.checks)) lines.push(`  ${k.padEnd(8)} ${c.v}${c.why.length ? "  " + c.why.join("; ") : ""}`);
  return lines.join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  if (!opt("--prompt")) { console.error("score-run: --prompt <n> is required"); process.exit(1); }
  const s = scoreRun({ app: resolve(opt("--app") || "."), prompt: opt("--prompt"), browser: !args.includes("--no-browser") });
  console.log(args.includes("--json") ? JSON.stringify(s, null, 2) : report(s));
}
