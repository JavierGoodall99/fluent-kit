#!/usr/bin/env node
// Fluent kit doctor: finds what is wrong with an install or the environment, and says how to fix each thing.
// Usage: node .fluent-kit/scripts/doctor.mjs [dir] [--json]
// Prints one line per finding: ok, warn (works, but worse than it could) or FIX (something will not work).
// Exit code 1 when anything needs fixing, 0 otherwise. Changes nothing.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const args = process.argv.slice(2);
const root = resolve(args.find((a) => !a.startsWith("--")) || ".");
const json = args.includes("--json");
const START = "<!-- fluent-kit:start -->", END = "<!-- fluent-kit:end -->";
const INSTALL = "npx github:JavierGoodall99/fluent-kit";
const SKILL_DIRS = [".github/skills", ".claude/skills", ".agents/skills"];

const out = [];
const add = (level, msg, fix) => out.push({ level, msg, ...(fix ? { fix } : {}) });
const ok = (m) => add("ok", m), warn = (m, f) => add("warn", m, f), fix = (m, f) => add("FIX", m, f);
const read = (p) => { try { return readFileSync(join(root, p), "utf8"); } catch { return null; } };
const readJson = (p) => { const t = read(p); if (t === null) return undefined; try { return JSON.parse(t); } catch { return null; } };
const rel = (p) => p.split(sep).join("/");

// Node
const major = Number(process.versions.node.split(".")[0]);
if (major < 18) fix(`Node ${process.versions.node} is too old (the kit needs 18 or newer)`, "Install Node 20 or 22 from nodejs.org");
else ok(`Node ${process.versions.node}`);

// Git: --finish compares against HEAD
const git = (a) => spawnSync("git", a, { cwd: root, encoding: "utf8" });
const inGit = git(["rev-parse", "--is-inside-work-tree"]);
if (inGit.error || inGit.status !== 0) warn("Not a git repository (or git is not installed): check.mjs --finish cannot tell what changed, so it checks every file and always runs the browser check", "git init && git add -A && git commit -m \"base\"");
else if (git(["rev-parse", "--verify", "HEAD"]).status !== 0) warn("The git repository has no commit yet: check.mjs --finish compares against the last commit", "git add -A && git commit -m \"base\"");
else ok("git repository with a commit");

// Manifest and skill
const manifest = readJson(".fluent-kit/manifest.json");
let skill = null;
if (manifest === undefined) {
  if (existsSync(join(root, ".fluent-kit"))) fix("No .fluent-kit/manifest.json: the kit was copied by hand or installed by a version before 1.5", `Run ${INSTALL} in this folder`);
  else fix("The kit is not installed here (no .fluent-kit folder)", `Run ${INSTALL} in this folder`);
} else if (manifest === null || !Array.isArray(manifest.files) || typeof manifest.skill !== "string") {
  fix(".fluent-kit/manifest.json is damaged", `Run ${INSTALL} again; it rewrites the manifest`);
} else {
  skill = manifest.skill;
  ok(`Kit ${manifest.kit?.version ?? "?"}${manifest.kit?.commit ? ` (${manifest.kit.commit})` : ""}, skill in ${skill}/`);
  const gone = manifest.files.filter((f) => !existsSync(join(root, f)));
  if (gone.length) fix(`${gone.length} kit file(s) are missing: ${gone.slice(0, 3).join(", ")}${gone.length > 3 ? ", ..." : ""}`, `Run ${INSTALL} again`);
  else ok(`All ${manifest.files.length} kit files are present`);
  // Edited or out-of-date skill files: the fingerprint is computed the way the installer does it.
  const h = createHash("sha256");
  let readable = true;
  for (const f of manifest.files.filter((x) => x.startsWith(`${skill}/`)).sort()) {
    try { const c = readFileSync(join(root, f)); h.update(f.slice(skill.length + 1)); h.update(/\.(md|tsx?|json)$/.test(f) ? Buffer.from(c.toString("utf8").replace(/\r\n/g, "\n")) : c); } catch { readable = false; } // git may have turned LF into CRLF on Windows
  }
  if (readable && manifest.kit?.fingerprint) {
    if (h.digest("hex").slice(0, 12) === manifest.kit.fingerprint) ok("The skill files are unchanged since install");
    else warn("The skill files differ from what was installed: someone edited them, or two installs overlap", `Run ${INSTALL} again to restore them (put your own rules in .fluent-kit/PROFILE.md instead)`);
  }
}

// Skill folders: one copy only, in the folder the instructions point to
const copies = SKILL_DIRS.filter((d) => /^name:\s*fluent-ui\s*$/m.test(read(`${d}/fluent-ui/SKILL.md`) || ""));
if (copies.length > 1) fix(`The skill is installed ${copies.length} times (${copies.map((d) => `${d}/fluent-ui`).join(", ")}): Copilot lists it twice and the older copy can contradict the new rules`, `Run ${INSTALL} again (it removes the extra copies), or delete the folder you do not use`);
else if (!copies.length && skill) fix(`${skill}/SKILL.md is missing`, `Run ${INSTALL} again`);
else if (skill && copies.length === 1 && `${copies[0]}/fluent-ui` !== skill) warn(`The skill is in ${copies[0]}/fluent-ui but the manifest says ${skill}/`, `Run ${INSTALL} again`);
else if (copies.length === 1) ok("One copy of the skill");

// The always-on block, in each instruction file that carries one
const files = [".github/copilot-instructions.md", "AGENTS.md", "CLAUDE.md"];
const withBlock = [];
for (const f of files) {
  const t = read(f);
  if (t === null) continue;
  if (!t.includes(START) || !t.includes(END)) continue;
  withBlock.push(f);
  const block = t.slice(t.indexOf(START), t.indexOf(END));
  const paths = new Set([...block.matchAll(/(\.(?:github|claude|agents)\/skills\/fluent-ui)\//g)].map((m) => m[1]));
  const wrong = [...paths].filter((p) => skill && p !== skill);
  if (wrong.length) fix(`${f} points to ${wrong.join(", ")}, but the skill is in ${skill}/`, `Run ${INSTALL} again (it rewrites the block)`);
  else if (/^@AGENTS\.md\s*$/m.test(block)) {
    if (!(read("AGENTS.md") || "").includes(START)) fix("CLAUDE.md imports AGENTS.md, but AGENTS.md has no Fluent kit block", `Run ${INSTALL} --agents`);
    else ok("CLAUDE.md imports AGENTS.md");
  } else ok(`${f} carries the kit block`);
}
if (!withBlock.length) fix("No instruction file carries the kit block (.github/copilot-instructions.md, AGENTS.md or CLAUDE.md): the agent is never told to use the skill", `Run ${INSTALL} again`);
else if (!withBlock.includes(".github/copilot-instructions.md")) warn("GitHub Copilot reads .github/copilot-instructions.md and it has no kit block (fine if you only use Claude Code or an AGENTS.md agent)", `Run ${INSTALL} again`);

// Project: Fluent v9, TypeScript, verify's dependencies, package manager, dev script
const pkg = readJson("package.json");
const req = createRequire(join(root, "package.json"));
const has = (n) => { try { req.resolve(n); return true; } catch { return false; } };
const hasPkgJson = pkg !== undefined && pkg !== null;
if (pkg === undefined) warn("No package.json here: run the doctor from the app's folder (or pass it as an argument)");
else if (pkg === null) fix("package.json is not valid JSON");
else {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps["@fluentui/react-components"]) ok("@fluentui/react-components (Fluent UI v9) is a dependency");
  else if (deps["@fluentui/react"]) warn("The project uses Fluent UI v8 (@fluentui/react); the kit builds with v9 (@fluentui/react-components)", "Install @fluentui/react-components; the checker flags v8 imports as errors");
  else warn("@fluentui/react-components is not a dependency", "npm install @fluentui/react-components @fluentui/react-icons");
}
if (existsSync(join(root, "tsconfig.json"))) {
  if (has("typescript")) ok("TypeScript is installed (check.mjs --finish runs tsc)");
  else warn("tsconfig.json exists but TypeScript is not installed: --finish skips the type check", "npm install -D typescript");
}
const pm = existsSync(join(root, "pnpm-lock.yaml")) ? "pnpm" : existsSync(join(root, "yarn.lock")) ? "yarn" : (existsSync(join(root, "bun.lockb")) || existsSync(join(root, "bun.lock"))) ? "bun" : "npm";
const onPath = (cmd) => { const r = spawnSync(cmd, ["--version"], { encoding: "utf8", shell: process.platform === "win32" }); return !r.error && r.status === 0; };
if (hasPkgJson) {
  if (pm === "npm") ok(onPath("npm") ? "npm is available" : "npm is not on this shell's PATH");
  else if (onPath(pm)) ok(`${pm} is available`);
  else if (onPath("npm")) warn(`The lockfile says ${pm}, which is not on this shell's PATH (an agent's terminal often has a shorter PATH than yours): verify falls back to npm for the dev script`);
  else fix(`Neither ${pm} nor npm is on this shell's PATH: verify cannot start the dev server`, "Open the terminal where `npm run dev` works, or pass --cmd \"<your dev command>\" to verify.mjs");
  if (pkg?.scripts?.dev) ok('package.json has a "dev" script (verify --start runs it)');
  else warn('package.json has no "dev" script: verify --start cannot start the app on its own', 'Add a "dev" script, or run verify.mjs with --cmd "<your dev command>"');
}
const hasPlaywright = ["playwright", "@playwright/test", "playwright-core"].some(has);
if (!hasPlaywright) warn("Playwright is not installed: the browser check (verify) cannot run, and --finish says the UI was not verified", `${pm === "npm" ? "npm install -D" : `${pm} add -D`} playwright axe-core && npx playwright install chromium`);
else {
  ok("Playwright is installed");
  if (!has("axe-core") && !has("@axe-core/playwright")) warn("axe-core is not installed: verify skips the accessibility scan", `${pm === "npm" ? "npm install -D" : `${pm} add -D`} axe-core`);
  let chromium = null;
  try { const pw = req("playwright"); chromium = pw.chromium?.executablePath?.() ?? null; } catch { /* playwright-core only, or unusual layout */ }
  if (chromium && !existsSync(chromium) && !existsSync(join(root, ".verify-profile"))) warn("Playwright's Chromium browser is not downloaded", "npx playwright install chromium");
  else if (chromium && existsSync(chromium)) ok("Chromium for Playwright is downloaded");
}

// Local files the kit reads: valid JSON, and the signed-in profile kept out of git
for (const f of [".fluent-kit/config.json", ".fluent-kit/brand.json", ".fluent-kit/baseline.json"]) {
  if (readJson(f) === null) fix(`${f} is not valid JSON, so the kit ignores it or stops`, "Fix the JSON or delete the file");
}
const ignoreList = readJson(".fluent-kit/verify-ignore.json");
if (ignoreList === null) fix(".fluent-kit/verify-ignore.json is not valid JSON, so verify reports every console message", "Fix the JSON (an array of message fragments to ignore)");
else if (ignoreList !== undefined && !(Array.isArray(ignoreList) && ignoreList.every((x) => typeof x === "string"))) fix(".fluent-kit/verify-ignore.json must be an array of strings (message fragments to ignore)");
if (existsSync(join(root, ".verify-profile"))) {
  const ignored = inGit.status === 0 ? git(["check-ignore", "-q", ".verify-profile"]).status === 0 : /(^|\n)\/?\.verify-profile\/?\s*(\n|$)/.test(read(".gitignore") || "");
  if (ignored) ok(".verify-profile (signed-in browser profile) is ignored by git");
  else fix(".verify-profile holds a signed-in browser session and is not in .gitignore: it could be committed", "echo .verify-profile/ >> .gitignore");
}
if (existsSync(join(root, ".fluent-kit", "PROFILE.md"))) ok("PROFILE.md found (organisation rules)");

if (json) console.log(JSON.stringify({ root, findings: out }, null, 2));
else {
  console.log(`fluent-kit doctor: ${rel(root)}\n`);
  for (const f of out) console.log(`${f.level.padEnd(4)}  ${f.msg}${f.fix ? `\n      -> ${f.fix}` : ""}`);
  const nFix = out.filter((f) => f.level === "FIX").length, nWarn = out.filter((f) => f.level === "warn").length;
  console.log(`\n${nFix ? `${nFix} to fix` : "Nothing to fix"}${nWarn ? `, ${nWarn} warning(s)` : ""}.`);
}
process.exit(out.some((f) => f.level === "FIX") ? 1 : 0);
