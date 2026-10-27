#!/usr/bin/env node
// Installs the Fluent kit into any repo.
// Usage: npx @javiergoodall99/fluent-kit [target-repo] [--profile <name>] [--agents] [--dry-run]   (target defaults to the current folder)
//   --profile <name>  copy .fluent-kit/profiles/<name>.md to <target>/.fluent-kit/PROFILE.md (organisation overrides)
//   --agents          also add the short rules block to AGENTS.md (read by Copilot's coding agent, Codex, Cursor and others)
//   --brand <stock|#hex>  record the brand decision in .fluent-kit/brand.json ("stock" = keep the stock Microsoft theme)
//   --wire            also add an npm script "ui:check" to package.json
//   --dry-run         show what would change, write nothing
// Safe to run again to update: kit files are replaced, your PROFILE.md and .fluent-kit/brands/ files are not touched,
// and the block in copilot-instructions.md is replaced between its markers (the rest of that file is left alone).
// No dependencies.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const target = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--profile" && args[i - 1] !== "--brand");
const dry = flag("--dry-run");
const profile = opt("--profile");
const brandOpt = opt("--brand");
if (flag("--help") || flag("-h")) { console.log("Usage: npx fluent-kit [target-repo] [--profile <name>] [--agents] [--brand <stock|#hex>] [--dry-run]\nTarget defaults to the current folder."); process.exit(0); }
const dest = resolve(target || process.cwd());
if (!existsSync(dest) || !statSync(dest).isDirectory()) { console.error(`Not a directory: ${dest}`); process.exit(1); }
if (resolve(here) === dest) { console.error("Target is the kit itself."); process.exit(1); }

const log = (m) => console.log((dry ? "[dry run] " : "") + m);
const START = "<!-- fluent-kit:start -->", END = "<!-- fluent-kit:end -->";

function copyDir(from, to, skip = () => false) {
  for (const n of readdirSync(from)) {
    const a = join(from, n), b = join(to, n);
    if (skip(a, n)) continue;
    if (statSync(a).isDirectory()) { copyDir(a, b, skip); continue; }
    if (!dry) { mkdirSync(dirname(b), { recursive: true }); cpSync(a, b); }
  }
}

// 1. .fluent-kit/ (docs, scripts, lint rules). Profiles and the user's brands are handled separately.
copyDir(join(here, ".fluent-kit"), join(dest, ".fluent-kit"), (a, n) => a.includes(`${join(".fluent-kit", "profiles")}`) || (a.includes(join(".fluent-kit", "brands")) && existsSync(join(dest, ".fluent-kit", "brands", n)) && n !== "_template.md"));
log("copied .fluent-kit/ (DESIGN.md, scripts, eslint)");
if (!dry) { mkdirSync(join(dest, ".fluent-kit", "profiles"), { recursive: true }); cpSync(join(here, ".fluent-kit", "profiles", "_template.md"), join(dest, ".fluent-kit", "profiles", "_template.md")); }

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

// 3. skill + path-specific instructions
if (!dry) {
  copyDir(join(here, ".github", "skills", "fluent-ui"), join(dest, ".github", "skills", "fluent-ui"));
  mkdirSync(join(dest, ".github", "instructions"), { recursive: true });
  cpSync(join(here, ".github", "instructions", "fluent-ui.instructions.md"), join(dest, ".github", "instructions", "fluent-ui.instructions.md"));
}
log("copied .github/skills/fluent-ui/ and .github/instructions/fluent-ui.instructions.md");

// 4. rules block in copilot-instructions.md (and AGENTS.md)
const kitText = readFileSync(join(here, ".github", "copilot-instructions.md"), "utf8");
const block = kitText.slice(kitText.indexOf(START), kitText.indexOf(END) + END.length);
function putBlock(file, title) {
  let text = existsSync(file) ? readFileSync(file, "utf8") : null;
  let action;
  if (text === null) { text = `# ${title}\n\n${block}\n`; action = "created"; }
  else if (text.includes(START) && text.includes(END)) { text = text.slice(0, text.indexOf(START)) + block + text.slice(text.indexOf(END) + END.length); action = "updated the Fluent kit block in"; }
  else { text = text.replace(/\s*$/, "") + `\n\n${block}\n`; action = "appended the Fluent kit block to"; }
  if (!dry) { mkdirSync(dirname(file), { recursive: true }); writeFileSync(file, text); }
  log(`${action} ${file.replace(dest + "/", "")}`);
}
putBlock(join(dest, ".github", "copilot-instructions.md"), "Copilot instructions");
if (flag("--agents")) putBlock(join(dest, "AGENTS.md"), "Agent instructions");

// 5. look at the project
console.log("\nWhat the kit found in this project:\n");
if (!dry) spawnSync(process.execPath, [join(dest, ".fluent-kit", "scripts", "detect-theme.mjs"), dest], { stdio: "inherit" });
else spawnSync(process.execPath, [join(here, ".fluent-kit", "scripts", "detect-theme.mjs"), dest], { stdio: "inherit" });

// 6. how much old code already breaks the rules
const checkScript = join(dry ? here : dest, ".fluent-kit", "scripts", "check.mjs");
const chk = spawnSync(process.execPath, [checkScript, dest, "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
let existingErrors = 0;
try { const r = JSON.parse(chk.stdout); existingErrors = r.errors; console.log(`Existing code: ${r.filesChecked} files checked, ${r.errors} rule violation(s), ${r.warnings} warning(s).`); } catch { /* no report */ }

// 7. optional: npm script
if (flag("--wire") && !dry) {
  const pj = join(dest, "package.json");
  if (existsSync(pj)) {
    try {
      const j = JSON.parse(readFileSync(pj, "utf8"));
      j.scripts = j.scripts || {};
      if (!j.scripts["ui:check"]) { j.scripts["ui:check"] = "node .fluent-kit/scripts/check.mjs"; writeFileSync(pj, JSON.stringify(j, null, 2) + "\n"); log('added npm script "ui:check" to package.json'); }
      else log('npm script "ui:check" already exists: left as is');
    } catch { log("could not edit package.json: add the ui:check script by hand"); }
  }
}

console.log(`
Next steps (nothing else is required):
  - Commit .fluent-kit/ and .github/. Copilot reads .github/ on its own.
  - The agent runs two checks before it finishes UI work:
      node .fluent-kit/scripts/check.mjs --changed          rules: colours, spacing, imports, native controls, labels
      node .fluent-kit/scripts/verify.mjs <url>             renders the page (light/dark, 3 widths), checks layout and accessibility
    Add the first to CI (and a pre-commit hook if you like) so nothing slips through. verify needs: npm i -D playwright axe-core
${existingErrors ? `  - This repo already has ${existingErrors} violation(s) in old code. To fail only on NEW ones, run once: node .fluent-kit/scripts/check.mjs --baseline  (then commit .fluent-kit/baseline.json)\n` : ""}  - Optional lint: see "Lint setup" in the kit README (needs eslint v9). The agent follows the rules without it.
  - Check that your Copilot version supports Agent Skills (.github/skills/); the instructions files work without it.
`);
