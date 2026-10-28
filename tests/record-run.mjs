#!/usr/bin/env node
// Records one benchmark run of the kit in a pilot app, and summarises a set of runs. See tests/BENCHMARK.md.
//
// Record (run it from the pilot app's root, right after the agent finishes):
//   node <kit>/tests/record-run.mjs --prompt 4 --run 1 [--credits 38.5] [--time 3m40s] [--files-read 3] [--route y]
//        [--quality PPPPPP] [--transcript chat.json] [--note "..."] [--kit <commit>] [--app <dir>] [--out <dir>] [--keep-out]
//   Saves <out>/p4-run1/: run.json, diff.patch, verify/ (screenshots, contact sheet, verify-report.json, verify-runs.jsonl),
//   the transcript if given; then empties .fluent-kit/out so the next run starts clean; then rewrites <out>/results.md.
//   <out> defaults to ../bench-runs next to the app, because `git clean -fd` would delete an un-ignored folder inside it.
// Fill in what you only know later (score the quality checks without looking at which run it is):
//   node <kit>/tests/record-run.mjs --prompt 4 --run 1 --update --quality PPPPFP
// Summarise against the targets:
//   node <kit>/tests/record-run.mjs --summary [--out <dir>]
//
// Quality is six letters, P (pass), F (fail) or ? (not scored), in this order:
//   scope, first glance, uniform, correct, every state, honest note.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const die = (m) => { console.error(`record-run: ${m}`); process.exit(1); };
const here = dirname(fileURLToPath(import.meta.url));

export const QUALITY = ["Scope", "5 s", "Uniform", "Correct", "States", "Note"];
export const TARGET = { medianCredits: 45, worstCredits: 90, medianSec: 240, worstSec: 480 };
export const PROMPTS = [4, 5, 6]; // the restyle prompts this benchmark covers

export function parseTime(v) {
  if (v === undefined || v === null || v === "") return null;
  const s = String(v).trim();
  let m;
  if ((m = s.match(/^(\d+):(\d{1,2})$/))) return +m[1] * 60 + +m[2];
  if ((m = s.match(/^(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?$/i)) && (m[1] || m[2])) return (+m[1] || 0) * 60 + (+m[2] || 0);
  if (/^\d+$/.test(s)) return +s;
  die(`cannot read the time "${s}" (use 3m40s, 3:40 or seconds)`);
}
export const fmtTime = (sec) => (sec == null ? "?" : `${Math.floor(sec / 60)}m ${String(sec % 60).padStart(2, "0")}s`);
export function parseQuality(v) {
  if (v === undefined) return null;
  const q = String(v).toUpperCase().replace(/[^PF?]/g, "");
  if (q.length !== 6) die(`--quality needs six letters P, F or ? (got "${v}")`);
  return q;
}
const median = (xs) => { const a = [...xs].sort((x, y) => x - y); const n = a.length; return n ? (n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2) : null; };

// The benchmark's prompt table, so a run records the exact words that were typed.
function promptText(n) {
  try {
    const row = readFileSync(join(here, "BENCHMARK.md"), "utf8").split("\n").find((l) => new RegExp(`^\\|\\s*${n}\\s*\\|`).test(l));
    return row ? row.split("|")[2].trim() : null;
  } catch { return null; }
}

function git(cwd, a) { const r = spawnSync("git", a, { cwd, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }); return { ok: r.status === 0, out: r.stdout || "", code: r.status }; }

function diffStats(app) {
  let ins = 0, del = 0, files = 0;
  for (const l of git(app, ["diff", "--numstat", "HEAD"]).out.split("\n").filter(Boolean)) {
    const [a, d] = l.split("\t"); files++; ins += Number(a) || 0; del += Number(d) || 0;
  }
  const untracked = git(app, ["ls-files", "--others", "--exclude-standard"]).out.split("\n").filter(Boolean);
  for (const f of untracked) {
    files++;
    try { const s = readFileSync(join(app, f)); if (!s.includes(0) && s.length) ins += s.toString("utf8").split("\n").length - (s.at(-1) === 10 ? 1 : 0); } catch { /* unreadable */ } // count lines as git does
  }
  let patch = git(app, ["diff", "HEAD", "--binary"]).out;
  for (const f of untracked) patch += git(app, ["diff", "--no-index", "--binary", "--", "/dev/null", f]).out; // exit 1 is normal here
  return { files, insertions: ins, deletions: del, untracked, patch };
}

// Which kit the app has, and whether its skill files still match what the installer wrote.
function kitInfo(app) {
  let manifest = null; try { manifest = JSON.parse(readFileSync(join(app, ".fluent-kit", "manifest.json"), "utf8")); } catch { /* none */ }
  const kit = manifest?.kit || {};
  const h = createHash("sha256");
  for (const f of (manifest?.files || []).filter((x) => x.startsWith(".github/skills/fluent-ui/")).sort()) { h.update(f); try { h.update(readFileSync(join(app, f))); } catch { h.update("missing"); } }
  const now = manifest ? h.digest("hex").slice(0, 12) : null;
  return { version: kit.version ?? null, commit: kit.commit ?? null, fingerprint: kit.fingerprint ?? null, fingerprintNow: now, changed: !!(kit.fingerprint && now && kit.fingerprint !== now) };
}

// Kit files the transcript mentions: a hint for "route followed", to check by hand.
function routeHint(text, prompt) {
  const seen = [...new Set(text.match(/(?:SKILL\.md|deviations\.md|tasks\/[\w-]+\.md|patterns\/[\w-]+\.md|examples\/[\w-]+\.tsx|docs\/[\w.-]+|DESIGN(?:ER)?\.md)/g) || [])];
  const expectTask = [4, 5, 6].includes(Number(prompt)) ? "tasks/restyle.md" : null;
  const stray = seen.filter((f) => f.startsWith("docs/") || /^DESIGN/.test(f) || (expectTask && f.startsWith("tasks/") && f !== expectTask));
  const cards = seen.filter((f) => f.startsWith("patterns/"));
  const looks = expectTask ? seen.includes(expectTask) && cards.length <= 1 && !stray.length : null;
  return { mentioned: seen, stray, looksFollowed: looks };
}

function loadRuns(out) {
  if (!existsSync(out)) return [];
  return readdirSync(out).filter((d) => existsSync(join(out, d, "run.json"))).map((d) => JSON.parse(readFileSync(join(out, d, "run.json"), "utf8")))
    .sort((a, b) => a.prompt - b.prompt || a.run - b.run);
}

export function row(r) {
  const q = (r.quality || "??????").split("");
  const kit = r.kit.commit || (r.kit.version ? `v${r.kit.version} ${r.kit.fingerprint}` : "?");
  const diff = `+${r.diff.insertions} −${r.diff.deletions} (${r.diff.files} file${r.diff.files === 1 ? "" : "s"})`;
  const route = r.route ? r.route.toUpperCase() : r.routeHint?.looksFollowed == null ? "?" : `?${r.routeHint.looksFollowed ? " (looks Y)" : " (looks N)"}`;
  return `| ${kit} | ${r.stage} | #${r.prompt} | ${r.run} | ${r.credits ?? "?"} | ${fmtTime(r.seconds)} | ${r.filesRead ?? "?"} | ${route} | ${r.verify.calls}${r.verify.notRun ? ` (${r.verify.notRun} not run)` : ""} | ${diff} | ${q.join(" | ")} |`;
}
export const HEADER = `| Kit | Stage | Prompt | Run | Credits | Time | Files read before edit | Route followed | Verify calls | Diff | ${QUALITY.join(" | ")} |\n|${" --- |".repeat(10 + QUALITY.length)}`;

export function summarise(runs) {
  const lines = [];
  const groups = [["all", runs], ...[...new Set(runs.map((r) => r.prompt))].map((p) => [`#${p}`, runs.filter((r) => r.prompt === p)])];
  lines.push("| Prompts | Runs | Median credits | Worst credits | Median time | Worst time | Quality fails |", "| --- | --- | --- | --- | --- | --- | --- |");
  for (const [name, rs] of groups) {
    const c = rs.map((r) => r.credits).filter((x) => x != null), t = rs.map((r) => r.seconds).filter((x) => x != null);
    const fails = rs.reduce((n, r) => n + ((r.quality || "").match(/F/g) || []).length, 0);
    lines.push(`| ${name} | ${rs.length} | ${median(c) ?? "?"} | ${c.length ? Math.max(...c) : "?"} | ${fmtTime(median(t) == null ? null : Math.round(median(t)))} | ${fmtTime(t.length ? Math.max(...t) : null)} | ${fails} |`);
  }
  const s1 = runs.filter((r) => r.stage === 1);
  const runOk = (r) => r.credits != null && r.credits <= TARGET.medianCredits && r.seconds != null && r.seconds <= TARGET.medianSec && r.route === "y" && r.quality === "PPPPPP";
  const missing = (r) => r.credits == null || r.seconds == null || !r.route || !r.quality || r.quality.includes("?");
  const s1Missing = PROMPTS.filter((p) => !s1.some((r) => r.prompt === p));
  const s1Verdict = !s1.length ? "no stage 1 runs yet" : s1.some((r) => !runOk(r)) && !s1.some(missing) ? `FAIL: ${s1.filter((r) => !runOk(r)).map((r) => `#${r.prompt} run ${r.run}`).join(", ")}`
    : s1Missing.length ? `incomplete (no run yet for ${s1Missing.map((p) => "#" + p).join(", ")})` : s1.some(missing) ? "incomplete (fill in credits, time, route and quality)"
    : s1.every(runOk) ? `PASS: ${s1.length} run(s), each ≤${TARGET.medianCredits} credits, ≤4 min, route followed, 6 of 6 checks` : `FAIL: ${s1.filter((r) => !runOk(r)).map((r) => `#${r.prompt} run ${r.run}`).join(", ")}`;
  const c = runs.map((r) => r.credits).filter((x) => x != null), t = runs.map((r) => r.seconds).filter((x) => x != null);
  const anyFail = runs.some((r) => (r.quality || "").includes("F"));
  const s2Ready = runs.some((r) => r.stage === 2);
  const s2Verdict = !s2Ready ? "not started" : runs.some(missing) ? "incomplete"
    : median(c) <= TARGET.medianCredits && Math.max(...c) <= TARGET.worstCredits && median(t) <= TARGET.medianSec && Math.max(...t) <= TARGET.worstSec && !anyFail
      ? "PASS: medians and worst cases within targets, no quality fails" : "FAIL: a median, a worst case or a quality check misses the target";
  lines.push("", `Stage 1 (smoke test): ${s1Verdict}`, `Stage 2 (consistency): ${s2Verdict}`, `Targets: median ≤${TARGET.medianCredits} credits and ≤4 min; worst ≤${TARGET.worstCredits} credits and ≤8 min; no quality check fails.`);
  return lines.join("\n");
}

function writeResults(out, runs) {
  writeFileSync(join(out, "results.md"), `# Benchmark runs\n\nWritten by tests/record-run.mjs. Copy rows into tests/BENCHMARK.md when a stage is done.\n\n${HEADER}\n${runs.map(row).join("\n")}\n\n## Summary\n\n${summarise(runs)}\n`);
}

function main() {
  if (flag("--help") || flag("-h")) { console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1).filter((l) => l.startsWith("//")).map((l) => l.replace(/^\/\/ ?/, "")).join("\n")); return; }
  const app = resolve(opt("--app") || process.cwd());
  const top = git(app, ["rev-parse", "--show-toplevel"]);
  const appRoot = top.ok ? top.out.trim() : app;
  const out = resolve(opt("--out") || join(appRoot, "..", "bench-runs"));

  if (flag("--summary")) { const runs = loadRuns(out); if (!runs.length) die(`no runs in ${out}`); writeResults(out, runs); console.log(summarise(runs)); console.log(`\n${join(out, "results.md")}`); return; }

  const prompt = Number(opt("--prompt")), run = Number(opt("--run"));
  if (!prompt || !run) die("--prompt <n> and --run <n> are required (or --summary)");
  if (!top.ok) die(`${app} is not a git repository`);
  const dir = join(out, `p${prompt}-run${run}`);
  const manual = {
    credits: opt("--credits") !== undefined ? Number(opt("--credits")) : undefined,
    seconds: opt("--time") !== undefined ? parseTime(opt("--time")) : undefined,
    filesRead: opt("--files-read") !== undefined ? Number(opt("--files-read")) : undefined,
    route: opt("--route") !== undefined ? (/^y/i.test(opt("--route")) ? "y" : "n") : undefined,
    quality: parseQuality(opt("--quality")) ?? undefined,
    note: opt("--note"),
  };
  for (const k of Object.keys(manual)) if (manual[k] === undefined) delete manual[k];
  if (manual.credits !== undefined && Number.isNaN(manual.credits)) die("--credits must be a number");

  if (flag("--update")) {
    if (!existsSync(join(dir, "run.json"))) die(`no recorded run at ${dir}`);
    const r = { ...JSON.parse(readFileSync(join(dir, "run.json"), "utf8")), ...manual };
    writeFileSync(join(dir, "run.json"), JSON.stringify(r, null, 2) + "\n");
    writeResults(out, loadRuns(out));
    console.log(`${HEADER}\n${row(r)}`);
    return;
  }
  if (existsSync(dir) && !flag("--force")) die(`${dir} already exists. Use --update to fill in fields, or --force to record it again.`);

  // A run folder inside the app must be git-ignored, or the reset after the run deletes it.
  const rel = relative(appRoot, out);
  if (!rel.startsWith("..") && !rel.startsWith(sep) && rel !== "" && !git(appRoot, ["check-ignore", "-q", out]).ok) die(`${out} is inside the app and not git-ignored, so \`git clean -fd\` would delete it. Use --out outside the app or ignore it.`);

  const d = diffStats(appRoot);
  const kit = kitInfo(appRoot);
  if (opt("--kit")) kit.commit = opt("--kit");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "diff.patch"), d.patch);

  const fkOut = join(appRoot, ".fluent-kit", "out");
  const verify = { calls: 0, notRun: 0, last: null };
  if (existsSync(fkOut)) {
    cpSync(fkOut, join(dir, "verify"), { recursive: true });
    try {
      const calls = readFileSync(join(fkOut, "verify-runs.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
      verify.calls = calls.length; verify.notRun = calls.filter((c) => c.exitCode === 2).length;
      verify.last = calls.at(-1) || null;
    } catch { /* verify never ran, or an older kit without the log */ }
    if (!flag("--keep-out")) for (const n of readdirSync(fkOut)) if (n !== ".gitignore") rmSync(join(fkOut, n), { recursive: true, force: true });
  }

  let hint = null;
  const transcript = opt("--transcript");
  if (transcript) {
    if (!existsSync(transcript)) die(`no transcript at ${transcript}`);
    cpSync(transcript, join(dir, "transcript" + (basename(transcript).match(/\.[\w]+$/)?.[0] || ".txt")));
    hint = routeHint(readFileSync(transcript, "utf8"), prompt);
  }

  const r = {
    prompt, run, stage: Number(opt("--stage")) || (run === 1 ? 1 : 2), promptText: promptText(prompt), recordedAt: new Date().toISOString(),
    app: { root: appRoot, branch: git(appRoot, ["rev-parse", "--abbrev-ref", "HEAD"]).out.trim(), commit: git(appRoot, ["rev-parse", "--short", "HEAD"]).out.trim() },
    kit, diff: { files: d.files, insertions: d.insertions, deletions: d.deletions, untracked: d.untracked }, verify, routeHint: hint,
    credits: null, seconds: null, filesRead: null, route: null, quality: null, note: null, ...manual,
  };
  writeFileSync(join(dir, "run.json"), JSON.stringify(r, null, 2) + "\n");
  writeResults(out, loadRuns(out));

  console.log(`Recorded ${dir}`);
  if (kit.changed) console.log(`Warning: the app's skill files differ from what the installer wrote (fingerprint ${kit.fingerprint} -> ${kit.fingerprintNow}). This run did not use a clean kit.`);
  if (!verify.calls) console.log("Note: no verify calls were logged (verify never ran, or the kit predates the log).");
  if (hint) console.log(`Kit files in the transcript: ${hint.mentioned.join(", ") || "none"}${hint.stray.length ? `; outside the route: ${hint.stray.join(", ")}` : ""}. Check "route followed" by hand.`);
  console.log(`\n${HEADER}\n${row(r)}\n`);
  const left = ["credits", "seconds", "filesRead", "route", "quality"].filter((k) => r[k] == null);
  if (left.length) console.log(`Still to fill in: ${left.join(", ")}  ->  node ${(() => { const r = relative(process.cwd(), fileURLToPath(import.meta.url)); return r.startsWith("..") ? fileURLToPath(import.meta.url) : r; })()} --prompt ${prompt} --run ${run} --update ...`);
  console.log(`Next: git reset --hard && git clean -fd   (.fluent-kit/out was ${flag("--keep-out") ? "kept" : "emptied"})`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
