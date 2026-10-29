#!/usr/bin/env node
// Installs the Fluent kit into any repo. No dependencies.
// Usage: npx github:JavierGoodall99/fluent-kit [target-repo] [options]   (target defaults to the current folder)
// Safe to run again to update: kit files are replaced, files the kit no longer ships are removed, your PROFILE.md,
// brand.json and any .fluent-kit/brands/ files are not touched, and only the marked block in the instruction files is replaced.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, rmSync, rmdirSync } from "node:fs";
import { join, resolve, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const HELP = `Usage: npx github:JavierGoodall99/fluent-kit [target-repo] [options]
Target defaults to the current folder.

Options:
  --profile <name>       copy .fluent-kit/profiles/<name>.md to .fluent-kit/PROFILE.md (organisation overrides)
  --brand <stock|#hex>   record the brand decision in .fluent-kit/brand.json
  --claude               also install for Claude Code: the rules block in CLAUDE.md, and the skill in .claude/skills/fluent-ui/
                         instead of .github/skills/ (Copilot reads both folders; one copy avoids a duplicate skill).
                         Done automatically when the repo already has CLAUDE.md or a .claude/ folder.
  --skills-dir <dir>     put the skill in <dir>/fluent-ui/ instead (for example .github/skills or .agents/skills)
  --agents               also write the rules block to AGENTS.md (Codex, Cursor, Copilot's coding agent and others;
                         done automatically when AGENTS.md already exists)
  --with-deps            also install what verify.mjs needs: playwright and axe-core as dev dependencies, and the
                         Chromium browser (about 150 MB download). Without it the installer only tells you.
  --hooks                also install a git pre-commit hook that runs check.mjs --changed
  --ci                   also write .github/workflows/fluent-kit.yml: a pull-request check that fails on rule errors,
                         whether or not the agent ran its own check
  --wire                 also add an npm script "ui:check" to package.json
  --dry-run              show what would change, write nothing
  -h, --help             show this help`;

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const target = args.find((a, i) => !a.startsWith("-") && !["--profile", "--brand", "--skills-dir"].includes(args[i - 1]));
const dry = flag("--dry-run");
const profile = opt("--profile");
const brandOpt = opt("--brand");
if (flag("--help") || flag("-h")) { console.log(HELP); process.exit(0); }
const dest = resolve(target || process.cwd());
if (!existsSync(dest) || !statSync(dest).isDirectory()) { console.error(`Not a directory: ${dest}`); process.exit(1); }
if (resolve(here) === dest) { console.error("Target is the kit itself."); process.exit(1); }

const log = (m) => console.log((dry ? "[dry run] " : "") + m);
const rel = (p) => relative(dest, p).split(sep).join("/");
const START = "<!-- fluent-kit:start -->", END = "<!-- fluent-kit:end -->";
const MANIFEST = join(dest, ".fluent-kit", "manifest.json");
// Files older kit versions installed and this one no longer ships. Removed only if they still hold kit content.
const SK = ".github/skills/fluent-ui/";
const LEGACY = [
  { path: ".github/instructions/fluent-ui.instructions.md", marker: "# UI code rules (Fluent UI v9)" },
  { path: ".fluent-kit/DESIGN.md", marker: "# Fluent design kit: Microsoft look and feel" },
  { path: ".fluent-kit/DESIGNER.md", marker: "# Designer mindset" },
  { path: SK + "checklist.md", marker: "# Pre-delivery checklist" },
  { path: SK + "references/measurements.md", marker: "# Measurements" },
  { path: SK + "references/fluent2-component-guidance.md", marker: "# Fluent 2 component guidance" },
  { path: SK + "references/new-project-setup.md", marker: "# New project setup" },
  { path: SK + "references/theme-and-brand.md", marker: "# Theme, brand and language" },
  { path: SK + "references/migrating.md", marker: "# Migrating an existing screen" },
  { path: ".fluent-kit/scripts/scan-colors.mjs", marker: "// Lists every distinct color value used in one or more repos" },
  { path: ".fluent-kit/brands/_template.md", marker: "# Brand: <product name>" },
];

const installed = []; // relative paths of every kit file this run writes
function copyDir(from, to, skip = () => false) {
  for (const n of readdirSync(from)) {
    const a = join(from, n), b = join(to, n);
    if (skip(a, n)) continue;
    if (statSync(a).isDirectory()) { copyDir(a, b, skip); continue; }
    installed.push(rel(b));
    if (!dry) { mkdirSync(dirname(b), { recursive: true }); cpSync(a, b); }
  }
}

const previous = (() => { try { return JSON.parse(readFileSync(MANIFEST, "utf8")).files || []; } catch { return []; } })();
const claude = flag("--claude") || existsSync(join(dest, "CLAUDE.md")) || existsSync(join(dest, ".claude"));
const agents = flag("--agents") || existsSync(join(dest, "AGENTS.md"));

// 1. .fluent-kit/ (scripts, rules, lint rules). Only the profile template ships; the user's brand files are theirs.
// Never ship files a run of the kit's own scripts may have left in this checkout.
const LOCAL_ONLY = new Set(["out", "context.json", "manifest.json", "brand.json", "baseline.json", "config.json", "verify-ignore.json", "PROFILE.md"]);
copyDir(join(here, ".fluent-kit"), join(dest, ".fluent-kit"), (a, n) =>
  (dirname(a) === join(here, ".fluent-kit") && LOCAL_ONLY.has(n)) ||
  a.includes(join(".fluent-kit", "profiles")));
installed.push(".fluent-kit/profiles/_template.md");
if (!dry) { mkdirSync(join(dest, ".fluent-kit", "profiles"), { recursive: true }); cpSync(join(here, ".fluent-kit", "profiles", "_template.md"), join(dest, ".fluent-kit", "profiles", "_template.md")); }
log("copied .fluent-kit/ (scripts, eslint, templates)");

// 2. profile
if (profile) {
  const src = join(here, ".fluent-kit", "profiles", `${profile}.md`);
  if (!existsSync(src)) { console.error(`No profile named "${profile}" in .fluent-kit/profiles/`); process.exit(1); }
  const out = join(dest, ".fluent-kit", "PROFILE.md");
  if (existsSync(out) && readFileSync(out, "utf8") !== readFileSync(src, "utf8")) log("PROFILE.md already exists and differs: left as is (delete it to replace)");
  else { if (!dry) cpSync(src, out); log(`PROFILE.md set from profile "${profile}"`); }
} else if (!existsSync(join(dest, ".fluent-kit", "PROFILE.md"))) log("no profile chosen (fine; defaults apply). To add one later: copy .fluent-kit/profiles/_template.md to .fluent-kit/PROFILE.md");

// 2b. brand decision
if (brandOpt) {
  const val = brandOpt === "stock" ? { mode: "stock" } : /^#[0-9a-fA-F]{6}$/.test(brandOpt) ? { hex: brandOpt.toLowerCase() } : null;
  if (!val) { console.error('--brand must be "stock" or a 6-digit hex like #0f6cbd'); process.exit(1); }
  const out = join(dest, ".fluent-kit", "brand.json");
  if (existsSync(out)) log("brand.json already exists: left as is");
  else { if (!dry) writeFileSync(out, JSON.stringify(val, null, 2) + "\n"); log(`brand.json written: ${JSON.stringify(val)}`); }
}

// 3. the skill, in one folder only: Copilot reads .github/skills, .claude/skills and .agents/skills, and shows a skill
// twice if it is in two of them. Claude Code reads only .claude/skills, so that folder serves both when Claude is used.
const skillSrc = join(here, ".github", "skills", "fluent-ui");
const skillsDir = (opt("--skills-dir") || (claude ? ".claude/skills" : ".github/skills")).replace(/\\/g, "/").replace(/\/+$/, "");
const SKILL = `${skillsDir}/fluent-ui`;
copyDir(skillSrc, join(dest, ...SKILL.split("/")));
log(`copied ${SKILL}/`);
if (!opt("--skills-dir") && !flag("--claude") && claude) log(`chose ${SKILL}/ because this repo has CLAUDE.md or a .claude/ folder (Copilot reads it too). Using only Copilot? Re-run with --skills-dir .github/skills`);
// A copy in another skill folder (from an older install, before the kit kept a manifest, or from a different --claude choice) makes the
// agent see two skills named fluent-ui, and the older one can contradict the new rules. Remove it when it is the kit's skill.
for (const other of [".github/skills", ".claude/skills", ".agents/skills"]) {
  const od = `${other}/fluent-ui`;
  if (od === SKILL) continue;
  const f = join(dest, ...od.split("/"), "SKILL.md");
  if (!existsSync(f) || !/^name:\s*fluent-ui\s*$/m.test(readFileSync(f, "utf8"))) continue;
  if (!dry) rmSync(join(dest, ...od.split("/")), { recursive: true, force: true });
  log(`removed ${od}/ (an older copy of this skill; the kit now lives in ${SKILL}/)`);
}

// 4. rules block in copilot-instructions.md, CLAUDE.md and AGENTS.md
const kitText = readFileSync(join(here, ".github", "copilot-instructions.md"), "utf8");
// The block names the skill by its real path, so the agent does not have to look for it.
const block = kitText.slice(kitText.indexOf(START), kitText.indexOf(END) + END.length).split(".github/skills/fluent-ui/").join(`${SKILL}/`);
function putBlock(file, title, content = block) {
  let text = existsSync(file) ? readFileSync(file, "utf8") : null;
  let action;
  if (text === null) { text = `# ${title}\n\n${content}\n`; action = "created"; }
  else if (text.includes(START) && text.includes(END)) {
    const rest = text.slice(0, text.indexOf(START)) + text.slice(text.indexOf(END) + END.length);
    if (content === null) { text = rest.replace(/\n{3,}/g, "\n\n"); action = "removed the Fluent kit block from"; }
    else { text = text.slice(0, text.indexOf(START)) + content + text.slice(text.indexOf(END) + END.length); action = "updated the Fluent kit block in"; }
  }
  else if (content === null) return;
  else { text = text.replace(/\s*$/, "") + `\n\n${content}\n`; action = "appended the Fluent kit block to"; }
  if (!dry) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); }
  log(`${action} ${rel(file)}`);
}
putBlock(join(dest, ".github", "copilot-instructions.md"), "Copilot instructions");
if (agents) putBlock(join(dest, "AGENTS.md"), "Agent instructions");
// With AGENTS.md in use, CLAUDE.md imports it (Claude Code reads @path imports) instead of holding a second copy of the
// block; if CLAUDE.md already imports AGENTS.md outside the kit block, the kit block is left out of it altogether.
if (claude) {
  const cm = join(dest, "CLAUDE.md");
  const own = existsSync(cm) ? readFileSync(cm, "utf8").replace(/<!-- fluent-kit:start -->[\s\S]*?<!-- fluent-kit:end -->/, "") : "";
  if (!agents) putBlock(cm, "Claude instructions");
  else if (/^@(\.\/)?AGENTS\.md\s*$/m.test(own)) putBlock(cm, "Claude instructions", null);
  else putBlock(cm, "Claude instructions", `${START}\n@AGENTS.md\n${END}`);
}

// 5. remove kit files this version no longer ships
const now = new Set(installed);
const inside = (f) => typeof f === "string" && !f.split("/").includes("..") && resolve(dest, f).startsWith(dest + sep);
const stale = previous.filter((f) => inside(f) && !now.has(f) && existsSync(join(dest, f)));
for (const { path, marker } of LEGACY) {
  const f = join(dest, path);
  if (!now.has(path) && !stale.includes(path) && existsSync(f) && readFileSync(f, "utf8").includes(marker)) stale.push(path);
}
for (const f of stale) {
  if (!dry) {
    rmSync(join(dest, f), { force: true });
    for (let d = dirname(join(dest, f)); d.startsWith(dest + sep) && d !== dest; d = dirname(d)) { try { if (readdirSync(d).length) break; rmdirSync(d); } catch { break; } }
  }
  log(`removed ${f} (no longer part of the kit)`);
}
// Which kit this is: the package version, the git commit when installed from a checkout (npx from GitHub has no .git),
// and a fingerprint of the skill files, so a benchmark run can say exactly what the agent read.
const kitInfo = (() => {
  let version = null; try { version = JSON.parse(readFileSync(join(here, "package.json"), "utf8")).version; } catch { /* none */ }
  const git = spawnSync("git", ["-C", here, "rev-parse", "--short", "HEAD"], { encoding: "utf8" });
  const h = createHash("sha256");
  // Hash each skill file by its path inside the skill, so the fingerprint does not depend on the folder it went to.
  for (const f of installed.filter((x) => x.startsWith(`${SKILL}/`)).sort()) { const r = f.slice(SKILL.length + 1); h.update(r); h.update(readFileSync(join(skillSrc, r))); }
  return { version, commit: git.status === 0 ? git.stdout.trim() : null, fingerprint: h.digest("hex").slice(0, 12) };
})();
if (!dry) writeFileSync(MANIFEST, JSON.stringify({ note: "Files installed by fluent-kit. The installer uses this list to remove files a newer kit no longer ships.", kit: kitInfo, skill: SKILL, files: [...now].sort() }, null, 2) + "\n");

// 6. look at the project
console.log("\nWhat the kit found in this project:\n");
spawnSync(process.execPath, [join(dry ? here : dest, ".fluent-kit", "scripts", dry ? "detect-theme.mjs" : "context.mjs"), ...(dry ? [dest] : [])], { cwd: dest, stdio: "inherit" }); // context.mjs also primes its cache

// 7. how much old code already breaks the rules
const checkScript = join(dry ? here : dest, ".fluent-kit", "scripts", "check.mjs");
const chk = spawnSync(process.execPath, [checkScript, dest, "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
let existingErrors = 0;
try { const r = JSON.parse(chk.stdout); existingErrors = r.errors; console.log(`Existing code: ${r.filesChecked} files checked, ${r.errors} rule violation(s), ${r.warnings} warning(s).`); } catch { /* no report */ }

// 8. what verify.mjs needs
const pj = join(dest, "package.json");
const req = createRequire(join(dest, "package.json"));
const canResolve = (n) => { try { req.resolve(n); return true; } catch { return false; } };
const hasPlaywright = ["playwright", "@playwright/test", "playwright-core"].some(canResolve);
const hasAxe = canResolve("axe-core") || canResolve("@axe-core/playwright");
const pm = existsSync(join(dest, "pnpm-lock.yaml")) ? "pnpm" : existsSync(join(dest, "yarn.lock")) ? "yarn" : (existsSync(join(dest, "bun.lockb")) || existsSync(join(dest, "bun.lock"))) ? "bun" : "npm";
const addDev = (pkgs) => (pm === "npm" ? ["install", "-D", ...pkgs] : pm === "yarn" ? ["add", "-D", ...pkgs] : ["add", "-D", ...pkgs]);
const missing = [!hasPlaywright && "playwright", !hasAxe && "axe-core"].filter(Boolean);
let depsNote;
if (!missing.length) depsNote = "verify.mjs dependencies: installed.";
else if (flag("--with-deps") && !dry && existsSync(pj)) {
  console.log(`\nInstalling for verify.mjs: ${missing.join(", ")} (dev dependencies), then the Chromium browser (about 150 MB)...`);
  const a = spawnSync(pm, addDev(missing), { cwd: dest, stdio: "inherit", shell: process.platform === "win32" });
  const b = a.status === 0 ? spawnSync("npx", ["playwright", "install", "chromium"], { cwd: dest, stdio: "inherit", shell: process.platform === "win32" }) : null;
  depsNote = a.status === 0 && b?.status === 0 ? "verify.mjs dependencies: installed." : "verify.mjs dependencies: install failed (see above). verify will say NOT RUN until they are installed.";
} else depsNote = `verify.mjs needs ${missing.join(" and ")} (not installed). Install once: ${pm} ${addDev(missing).join(" ")} && npx playwright install chromium (about 150 MB), or re-run this installer with --with-deps.`;

// 9. optional: npm script
if (flag("--wire") && !dry) {
  if (existsSync(pj)) {
    try {
      const j = JSON.parse(readFileSync(pj, "utf8"));
      j.scripts = j.scripts || {};
      if (!j.scripts["ui:check"]) { j.scripts["ui:check"] = "node .fluent-kit/scripts/check.mjs"; writeFileSync(pj, JSON.stringify(j, null, 2) + "\n"); log('added npm script "ui:check" to package.json'); }
      else log('npm script "ui:check" already exists: left as is');
    } catch { log("could not edit package.json: add the ui:check script by hand"); }
  }
}

// 9b. optional: GitHub Actions workflow that runs the rules on every pull request
if (flag("--ci") && !dry) {
  const wf = join(dest, ".github", "workflows", "fluent-kit.yml");
  if (existsSync(wf)) log("kept .github/workflows/fluent-kit.yml (already there)");
  else {
    mkdirSync(dirname(wf), { recursive: true });
    writeFileSync(wf, `# Written by the Fluent kit installer. Fails the pull request on UI rule errors, even when nobody ran the agent's own check.
name: fluent-kit
on:
  pull_request:
jobs:
  ui-rules:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: node .fluent-kit/scripts/check.mjs
`);
    log("wrote .github/workflows/fluent-kit.yml (runs check.mjs on every pull request)");
  }
}

// 10. optional: git pre-commit hook
if (flag("--hooks") && !dry) {
  const hookDir = join(dest, ".git", "hooks");
  if (!existsSync(join(dest, ".git"))) log("no .git folder here: hook not installed");
  else {
    const hook = join(hookDir, "pre-commit");
    const body = '#!/bin/sh\n# fluent-kit: block commits that break the UI rules\nnode .fluent-kit/scripts/check.mjs --changed --no-next || { echo "fluent-kit: fix the errors above before committing."; exit 1; }\n';
    if (existsSync(hook) && !readFileSync(hook, "utf8").includes("fluent-kit")) log("a pre-commit hook already exists: not changed. Add this line to it:  node .fluent-kit/scripts/check.mjs --changed --no-next || exit 1");
    else { mkdirSync(hookDir, { recursive: true }); writeFileSync(hook, body, { mode: 0o755 }); log("installed .git/hooks/pre-commit (runs check.mjs --changed)"); }
  }
}

console.log(`
Next steps:
  - Commit ${[".fluent-kit/", ".github/", ...(claude ? [".claude/", "CLAUDE.md"] : []), ...(agents ? ["AGENTS.md"] : [])].join(", ")}. ${claude ? "Copilot and Claude Code read them on their own." : "Copilot reads .github/ on its own."}${claude ? "" : " Using Claude Code? Re-run with --claude."}
  - ${depsNote}
  - The agent ends each task with \`node .fluent-kit/scripts/check.mjs --finish --page /path\`. For CI, run \`node .fluent-kit/scripts/check.mjs\` (--ci writes a GitHub Actions workflow for it, --hooks adds a pre-commit hook).
${existingErrors ? `  - This repo already has ${existingErrors} violation(s) in old code. To fail only on NEW ones, run once: node .fluent-kit/scripts/check.mjs --baseline  (then commit .fluent-kit/baseline.json)\n` : ""}  - Optional lint: see "Lint setup" in the kit README (needs ESLint v9).
`);
