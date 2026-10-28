// Reading budget: the words an agent reads for each kind of task before it writes code, following every file the
// always-on block, the router and the cards tell it to read. Counts whitespace-separated words (code counts too).
// Run: node tests/reading-cost.mjs   Exits 1 if any budget is exceeded, so a growing file is noticed in CI.
import { readFileSync, readdirSync } from "node:fs";

const K = ".github/skills/fluent-ui/";
const text = (f) => readFileSync(f, "utf8");
const count = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const words = (f) => count(text(f));
const lines = (f) => text(f).trimEnd().split("\n").length;

const ci = text(".github/copilot-instructions.md");
const block = count(ci.slice(ci.indexOf("<!-- fluent-kit:start -->") + 25, ci.indexOf("<!-- fluent-kit:end -->")));
const router = words(K + "SKILL.md");
const deviations = words(K + "deviations.md");
const task = (n) => words(`${K}tasks/${n}.md`);
const cards = readdirSync(K + "patterns").filter((f) => f.endsWith(".md")).map((f) => {
  const examples = [...new Set(text(K + "patterns/" + f).match(/examples\/[\w-]+\.tsx/g) || [])];
  // A card may name several examples; the agent opens the one that fits, so count the largest.
  const example = Math.max(0, ...examples.map((e) => words(K + e)));
  return { name: f.replace(/\.md$/, ""), words: words(K + "patterns/" + f), example };
});
const examples = readdirSync(K + "examples").filter((f) => f.endsWith(".tsx"));

const BUDGET = 2500;
const rows = [];
const add = (name, cost, budget = BUDGET) => rows.push({ name, cost, budget });

add("always-on block", block, 250);
add("small fix: block + tasks/small-fix + deviations (if unsure)", block + task("small-fix") + deviations);
for (const c of cards) add(`restyle, ${c.name}: block + router + tasks/restyle + card`, block + router + task("restyle") + c.words);
for (const c of cards) add(`new page, ${c.name}: block + router + tasks/new-page + card + example`, block + router + task("new-page") + c.words + c.example);
const worst = cards.reduce((a, c) => (c.words + c.example > a.words + a.example ? c : a));
add(`new app (first page: ${worst.name}): block + router + tasks/new-app + tasks/new-page + card + example`, block + router + task("new-app") + task("new-page") + worst.words + worst.example);

// File limits that keep each card small.
const limits = [
  ["SKILL.md", router, 450],
  ["deviations.md", deviations, 600],
  ["tasks/small-fix.md", task("small-fix"), 200],
  ["tasks/restyle.md", task("restyle"), 400],
  ["tasks/new-page.md", task("new-page"), 400],
  ["tasks/new-app.md", task("new-app"), 450],
  ...cards.map((c) => [`patterns/${c.name}.md`, c.words, 350]),
];

let bad = 0;
const w = Math.max(...rows.map((r) => r.name.length));
console.log("Task".padEnd(w) + "  words  budget");
for (const r of rows) { const over = r.cost > r.budget; if (over) bad++; console.log(`${r.name.padEnd(w)}  ${String(r.cost).padStart(5)}  ${String(r.budget).padStart(6)}${over ? "  OVER" : ""}`); }
console.log("");
for (const [name, n, max] of limits) if (n > max) { bad++; console.log(`OVER  ${name}: ${n} words (limit ${max})`); }
for (const e of examples) { const n = lines(K + "examples/" + e); if (n > 150) { bad++; console.log(`OVER  examples/${e}: ${n} lines (limit 150)`); } }
console.log(bad ? `\n${bad} budget(s) exceeded.` : `All budgets met: ${rows.length} task paths, ${limits.length} files, ${examples.length} examples.`);
process.exit(bad ? 1 : 0);
