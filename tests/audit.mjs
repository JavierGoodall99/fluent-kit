// The automated half of docs/AUDIT.md: every check a script can judge, with the same ID as in that file, so an audit
// gives the same answer each time and a finding fixed once stays fixed. The browser half is tests/render-examples.mjs.
// Run: node tests/audit.mjs   Exits 1 if any check fails.
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tokens } from "./tokens.mjs";

const K = ".github/skills/fluent-ui/";
const read = (f) => readFileSync(f, "utf8");
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const block = (() => { const t = read(".github/copilot-instructions.md"); return t.slice(t.indexOf("<!-- fluent-kit:start -->"), t.indexOf("<!-- fluent-kit:end -->")); })();
const agentMd = [".github/copilot-instructions.md", ...walk(K).filter((f) => f.endsWith(".md"))];
const scripts = ["install.mjs", ...walk(".fluent-kit/scripts").filter((f) => f.endsWith(".mjs"))];
const results = [];
const check = (id, title, problems) => results.push({ id, title, problems });

// AUD-01 Every "no hard-coded X" in the always-on block is enforced by a check.mjs rule (a rule nothing enforces gets
// ignored, and the kit's own examples then contradict it).
{
  const ENFORCED = { colours: "hardcoded-color", colors: "hardcoded-color", spacing: "hardcoded-spacing", radii: "hardcoded-spacing", fonts: "hardcoded-font" };
  const m = block.match(/no hard-coded ([^,.;]+(?:, [^,.;]+)*?)(?:,? no |[.;])/i);
  const words = m ? m[1].split(/,\s*|\s+or\s+|\s+and\s+/).map((w) => w.trim().toLowerCase()).filter(Boolean) : [];
  const src = read(".fluent-kit/scripts/check.mjs");
  check("AUD-01", "hard-coded rules in the block are enforced", [
    ...(!m ? ["the block names no hard-coded values"] : []),
    ...words.filter((w) => !ENFORCED[w] || !src.includes(`"${ENFORCED[w]}"`)).map((w) => `"${w}": no check.mjs rule enforces it`),
  ]);
}

// AUD-02 Every field detect-theme.mjs outputs is used by context.mjs (a dead field is a promise the docs can still make).
{
  const dir = join(process.cwd(), "tests", ".audit-tmp");
  const out = spawnSync(process.execPath, [".fluent-kit/scripts/detect-theme.mjs", "tests"], { encoding: "utf8" }).stdout;
  let keys = []; try { keys = Object.keys(JSON.parse(out)); } catch { /* reported below */ }
  const ctx = read(".fluent-kit/scripts/context.mjs");
  check("AUD-02", "detect-theme fields are all used", keys.length ? keys.filter((k) => !new RegExp(`detect\\??\\.${k}\\b`).test(ctx)).map((k) => `${k}: computed, never shown to the agent`) : ["detect-theme.mjs printed no JSON"]);
  void dir;
}

// AUD-03 No sentence is repeated across the agent-facing files (the same rule in two files costs tokens on routes that
// read both, and the copies drift). A repeat is 9 words in a row in two files.
{
  const N = 9;
  const shingles = new Map();
  for (const f of agentMd) {
    const words = read(f).replace(/<!--[\s\S]*?-->/g, " ").replace(/`[^`]*`/g, " CODE ").toLowerCase().match(/[a-z0-9']+/g) || [];
    for (let i = 0; i + N <= words.length; i++) {
      const s = words.slice(i, i + N).join(" ");
      if ((s.match(/\bcode\b/g) || []).length > 3) continue; // a run of code spans is a list, not a sentence
      if (!shingles.has(s)) shingles.set(s, new Set());
      shingles.get(s).add(f.replace(K, ""));
    }
  }
  const dupes = new Map();
  for (const [s, files] of shingles) if (files.size > 1) { const k = [...files].sort().join(" + "); if (!dupes.has(k)) dupes.set(k, s); }
  check("AUD-03", "no repeated sentences in agent-facing files", [...dupes].map(([files, s]) => `${files}: "${s} ..."`));
}

// AUD-04 Shipped scripts do not grow past their size (an agent that opens one to debug pays for all of it). Lower a
// limit when a script shrinks; raising one needs a reason in the pull request. (1.7.0: check.mjs +400 for the popup rule;
// the browser probes moved out of verify.mjs into probes.mjs, so verify.mjs shrank.)
{
  const LIMIT = {"install.mjs": 5500, "check.mjs": 8600, "consistency.mjs": 1300, "context.mjs": 2250, "detect-theme.mjs": 5500, "doctor.mjs": 3300, "generate-ramp.mjs": 2000, "lib.mjs": 1500, "make-theme.mjs": 1550, "scaffold.mjs": 2200, "verify.mjs": 13150, "probes.mjs": 1400};
  const problems = [];
  for (const f of scripts) {
    const name = f.split("/").pop(), n = tokens(read(f));
    if (!LIMIT[name]) problems.push(`${f}: new script, ${n} tokens: give it a limit here`);
    else if (n > LIMIT[name]) problems.push(`${f}: ${n} tokens, limit ${LIMIT[name]}`);
  }
  check("AUD-04", "scripts stay within their size", problems);
}

// AUD-05 Every --option the docs and cards name exists in a script (docs drift when a flag is renamed or removed).
{
  const docs = ["README.md", "docs/REFERENCE.md", ...agentMd];
  const code = scripts.map(read).join("\n");
  const problems = [];
  for (const f of docs) for (const m of read(f).matchAll(/(?<![\w-])(--[a-zA-Z][\w-]+)/g)) {
    if (["--template", "--ts", "--app", "--no-tailwind", "--save-storage", "--overwrite", "--noEmit"].includes(m[1])) continue; // other tools' flags
    if (!code.includes(`"${m[1]}"`) && !code.includes(`'${m[1]}'`)) problems.push(`${f}: ${m[1]} is not an option of any kit script`);
  }
  check("AUD-05", "documented options exist", [...new Set(problems)]);
}

// AUD-06 Commands in agent-facing files can be copied as they are (a markdown table turns "|" into "\|").
{
  const problems = [];
  for (const f of agentMd) read(f).split("\n").forEach((l, i) => { for (const m of l.matchAll(/`([^`]*\\\|[^`]*)`/g)) problems.push(`${f}:${i + 1}: \`${m[1]}\` would be copied with a backslash`); });
  check("AUD-06", "commands copy cleanly", problems);
}

// AUD-07 The kit repo tells an agent working on the repo itself what the shipped rules are for (otherwise the UI block
// in .github/ reads as this repo's own rules).
{
  const a = existsSync("AGENTS.md") ? read("AGENTS.md") : "";
  check("AUD-07", "the repo explains itself to agents", [
    ...(!a ? ["no AGENTS.md at the repo root"] : !/payload|installs|ships/i.test(a) ? ["AGENTS.md does not say the .github/ block is what the kit installs"] : []),
    ...(existsSync("CLAUDE.md") && /@AGENTS\.md/.test(read("CLAUDE.md")) ? [] : ["no CLAUDE.md importing AGENTS.md (Claude Code does not read AGENTS.md on its own)"]),
  ]);
}

// AUD-08 A card does not set a size Fluent already sets (SKILL.md: never set Fluent's own sizes by hand).
{
  const DEFAULTS = [[/selection column \d+px/i, "Fluent sets the selection column (44px)"], [/rows? (?:stay )?near \d+px/i, "Fluent sets row heights; say what may change instead"], [/drawer[^.]*\b(320|592|940)px/i, "use the drawer size prop"], [/dialog[^.]*\b600px/i, "the dialog width is Fluent's own"]];
  const problems = [];
  for (const f of walk(K + "patterns")) read(f).split("\n").forEach((l, i) => { for (const [re, why] of DEFAULTS) if (re.test(l)) problems.push(`${f}:${i + 1}: ${why}`); });
  check("AUD-08", "cards do not repeat Fluent's default sizes", problems);
}

// AUD-16 The companion versions deviations.md tells agents to install are the ones the kit installs and checks against
// (the agent pins them without looking them up, so a stale version would ship into every app).
{
  const lock = JSON.parse(read("package-lock.json")).packages || {};
  const problems = [];
  for (const m of read(K + "deviations.md").matchAll(/`((?:@[\w-]+\/)?[\w-]+)@(\d+\.\d+\.\d+)`/g)) {
    const have = lock[`node_modules/${m[1]}`]?.version;
    if (!have) problems.push(`${m[1]}@${m[2]}: not a dev dependency of the kit, so nothing checks it`);
    else if (have !== m[2]) problems.push(`${m[1]}: deviations.md says ${m[2]}, the kit has ${have}`);
  }
  check("AUD-16", "pinned companion versions match the kit's", problems);
}

// AUD-17 The rules for card grids and long popups (SKILL.md, "Every page") are followed by the shipped examples, and the
// checker flags an uncapped list-fed Dropdown but not a capped one (the first customer feedback: cards sized by their
// content, dropdowns as tall as the window).
{
  const problems = [];
  for (const f of walk(K + "examples").filter((n) => n.endsWith(".tsx"))) {
    const t = read(f);
    if (/<Card\b/.test(t) && /repeat\(auto-fit/.test(t) && !/gridAutoRows/.test(t)) problems.push(`${f}: a grid of cards without fixed rows (gridAutoRows)`);
  }
  const dir = mkdtempSync(join(tmpdir(), "fk-aud17-"));
  try {
    const file = (props) => `import { Dropdown, Option } from "@fluentui/react-components";\nexport const A = ({ items }: { items: string[] }) => <Dropdown${props}>{items.map((i) => <Option key={i}>{i}</Option>)}</Dropdown>;\n`;
    writeFileSync(join(dir, "package.json"), "{}");
    writeFileSync(join(dir, "Open.tsx"), file(""));
    writeFileSync(join(dir, "Capped.tsx"), file(' positioning={{ autoSize: false }} listbox={{ className: "c" }}'));
    const out = spawnSync(process.execPath, [".fluent-kit/scripts/check.mjs", dir], { encoding: "utf8" }).stdout;
    if (!/Open\.tsx:\d+\s+\[popup-height\]/.test(out)) problems.push("check.mjs does not flag a Dropdown fed from a list with no height cap");
    if (/Capped\.tsx/.test(out)) problems.push("check.mjs flags a Dropdown that is capped");
  } finally { rmSync(dir, { recursive: true, force: true }); }
  const ex = spawnSync(process.execPath, [".fluent-kit/scripts/check.mjs", K + "examples"], { encoding: "utf8" }).stdout;
  for (const l of ex.split("\n").filter((x) => /\[popup-height\]/.test(x))) problems.push(`example: ${l.trim().slice(0, 120)}`);
  check("AUD-17", "card grids and popups follow the rules in the examples and the checker", problems);
}

let failed = 0;
for (const r of results) {
  console.log(`${r.problems.length ? "FAIL" : "ok  "}  ${r.id}  ${r.title}`);
  for (const p of r.problems) console.log(`        ${p}`);
  if (r.problems.length) failed++;
}
console.log(failed ? `\naudit: ${failed} of ${results.length} checks failed.` : `\naudit: all ${results.length} checks pass.`);
process.exit(failed ? 1 : 0);
