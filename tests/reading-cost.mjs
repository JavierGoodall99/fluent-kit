// Reading budget: how many words an agent has to read for each kind of task, when it follows the router.
// Run: node tests/reading-cost.mjs   Exits 1 if a budget is exceeded, so a growing file is noticed.
import { readFileSync } from "node:fs";
const words = (f) => readFileSync(f, "utf8").trim().split(/\s+/).length;
const section = (f, heading) => {
  const t = readFileSync(f, "utf8");
  const i = t.indexOf(heading);
  if (i < 0) throw new Error(`${heading} not found in ${f}`);
  const rest = t.slice(i + heading.length);
  const j = rest.search(/\n#{1,3} /);
  return (heading + (j < 0 ? rest : rest.slice(0, j))).trim().split(/\s+/).length;
};
const always = words(".github/copilot-instructions.md") + words(".github/instructions/fluent-ui.instructions.md");
const router = words(".github/skills/fluent-ui/SKILL.md");
const M = ".github/skills/fluent-ui/references/measurements.md";
const E = (n) => words(`.github/skills/fluent-ui/examples/${n}.tsx`);
const tasks = [
  { name: "small change (no router)", cost: words(".github/copilot-instructions.md") + words(".github/instructions/fluent-ui.instructions.md"), budget: 2000 },
  { name: "new dashboard", cost: always + router + E("dashboard") + section(M, "## 3 Narrow screens"), budget: 6500 },
  { name: "new settings page", cost: always + router + E("settings-page") + section(M, "## 3 Narrow screens"), budget: 6500 },
  { name: "new status grid", cost: always + router + E("status-grid") + section(M, "## 3 Narrow screens"), budget: 6500 },
];
let bad = 0;
for (const t of tasks) { const over = t.cost > t.budget; if (over) bad++; console.log(`${over ? "OVER " : "ok   "} ${t.name}: ${t.cost} words (budget ${t.budget})`); }
const lines = readFileSync(".github/skills/fluent-ui/SKILL.md", "utf8").split("\n").length;
console.log(`router: ${router} words, ${lines} lines (limit 500 lines)`);
if (lines > 500) bad++;
process.exit(bad ? 1 : 0);
