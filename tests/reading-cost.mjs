// Reading budget: how many words an agent reads for each kind of task before it writes code, counting every file
// and section the always-on block, the router row and the files it opens tell it to read (not an ideal path).
// Run: node tests/reading-cost.mjs   Exits 1 if a budget is exceeded, so a growing file is noticed.
import { readFileSync } from "node:fs";
const text = (f) => readFileSync(f, "utf8");
const count = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const words = (f) => count(text(f));
const section = (f, heading) => {
  const t = text(f);
  const i = t.indexOf(heading);
  if (i < 0) throw new Error(`${heading} not found in ${f}`);
  const rest = t.slice(i + heading.length);
  const j = rest.search(/\n#{1,2} /);
  return count(heading + (j < 0 ? rest : rest.slice(0, j)));
};
const K = ".github/skills/fluent-ui/";
const M = K + "references/measurements.md";
const D = ".fluent-kit/DESIGNER.md";
const E = (n) => words(`${K}examples/${n}.tsx`);
const ci = text(".github/copilot-instructions.md");
const block = count(ci.slice(ci.indexOf("<!-- fluent-kit:start -->") + 25, ci.indexOf("<!-- fluent-kit:end -->")));
const router = words(K + "SKILL.md");
const dev = words(K + "deviations.md");
const check = words(K + "checklist.md");
const M1 = section(M, "## 1 Page patterns"), M2 = section(M, "## 2 Components"), M3 = section(M, "## 3 Narrow screens");
const tasks = [
  { name: "always-on block", cost: block, budget: 250 },
  { name: "small fix (block + deviations if unsure)", cost: block + dev, budget: 800 },
  { name: "restyle (router, DESIGNER 1 and 3)", cost: block + router + section(D, "## 1. Design before you code") + section(D, "## 3. Hierarchy and focus"), budget: 3500 },
  { name: "new section on a page (dashboard card)", cost: block + router + E("dashboard") + M1 + M3, budget: 4500 },
  { name: "new dashboard page", cost: block + router + E("dashboard") + M1 + M3 + check, budget: 5000 },
  { name: "new settings page", cost: block + router + E("settings-page") + M1 + M3 + check, budget: 6000 },
  { name: "new status grid page", cost: block + router + E("status-grid") + M2 + M3 + check, budget: 6000 },
];
let bad = 0;
for (const t of tasks) { const over = t.cost > t.budget; if (over) bad++; console.log(`${over ? "OVER " : "ok   "} ${t.name}: ${t.cost} words (budget ${t.budget})`); }
const lines = text(K + "SKILL.md").split("\n").length;
console.log(`router: ${router} words, ${lines} lines (limit 500 lines); deviations: ${dev} words (limit 600)`);
if (lines > 500 || dev > 600) bad++;
process.exit(bad ? 1 : 0);
