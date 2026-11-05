// Reading cost per task route: the tokens an agent reads before it writes code (files the always-on block, the
// router and the cards name, plus the output of context.mjs on a sample project) and the tool calls it takes.
// Tokens are counted with a proxy encoding (tests/tokens.mjs); code costs about 2.7 tokens per word, prose about 1.5.
// Run: node tests/reading-cost.mjs   Exits 1 if a budget is exceeded, so growth is noticed in CI.
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tokens } from "./tokens.mjs";

const K = ".github/skills/fluent-ui/";
const text = (f) => readFileSync(f, "utf8");
const tok = (f) => tokens(text(f));
const lines = (f) => text(f).trimEnd().split("\n").length;

// context.mjs output, measured on a small Fluent v9 app with a profile and two card styles.
function contextOutput(route) {
  const dir = mkdtempSync(join(tmpdir(), "fk-cost-"));
  try {
    mkdirSync(join(dir, "src"), { recursive: true }); mkdirSync(join(dir, ".fluent-kit"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: { "@fluentui/react-components": "^9", "@fluentui/react-icons": "^2" } }));
    writeFileSync(join(dir, "index.html"), '<html lang="nl"></html>');
    writeFileSync(join(dir, "src/main.tsx"), 'import { FluentProvider, webLightTheme } from "@fluentui/react-components";\nexport const A = () => <FluentProvider theme={webLightTheme} />;\n');
    for (const [f, r] of [["Home", "borderRadiusXLarge"], ["Log", "borderRadiusMedium"]]) writeFileSync(join(dir, `src/${f}.tsx`), `import { makeStyles, tokens } from "@fluentui/react-components";\nexport const s = makeStyles({ kpiCard: { borderRadius: tokens.${r}, boxShadow: tokens.shadow4 } });\n`);
    writeFileSync(join(dir, ".fluent-kit/PROFILE.md"), text(".fluent-kit/profiles/acme-nl.md"));
    return spawnSync(process.execPath, [resolve(".fluent-kit/scripts/context.mjs"), route], { cwd: dir, encoding: "utf8" }).stdout;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const ci = text(".github/copilot-instructions.md");
const block = tokens(ci.slice(ci.indexOf("<!-- fluent-kit:start -->"), ci.indexOf("<!-- fluent-kit:end -->")));
const router = tok(K + "SKILL.md"), deviations = tok(K + "deviations.md");
const task = (n) => tok(`${K}tasks/${n}.md`);
const ctx = Object.fromEntries(["restyle", "new-page", "new-app", "migrate"].map((r) => [r, tokens(contextOutput(r))]));
const cards = readdirSync(K + "patterns").filter((f) => f.endsWith(".md")).map((f) => {
  const examples = [...new Set(text(K + "patterns/" + f).match(/examples\/[\w-]+\.tsx/g) || [])];
  return { name: f.replace(/\.md$/, ""), tokens: tok(K + "patterns/" + f), example: Math.max(0, ...examples.map((e) => tok(K + e))) }; // the agent opens the one that fits: count the largest
});

// Pages that show values also read patterns/alignment.md (the router sends them there) and may open its example.
const DATA = new Set(["dashboard", "list", "status-page"]);
const align = cards.find((c) => c.name === "alignment");
const extra = (c, example) => (DATA.has(c.name) && align ? align.tokens + (example && c.name === "dashboard" ? align.example : 0) : 0); // its example is for a grid of data cards

// Budgets in tokens, and tool calls before the first edit (independent reads in one parallel call) and to finish.
// 1.7.0: restyle 2750 to 3250, new page 4900 to 5350, new app 5400 to 5950, SKILL.md 850 to 1000. The router gained the
// card-grid and popup rules (about 155 tokens, every route) and pages that show data read patterns/alignment.md.
// 1.7.1: restyle 3250 to 3350, new page 5350 to 5450, migrate 3300 to 3350, SKILL.md 1000 to 1050 (the scrollbar rule, about 40
// tokens on every route; the context line for an app without it is counted in restyle and new page).
const BUDGET = { block: 260, smallFix: 800, restyle: 3350, newPage: 5450, newApp: 5950, migrate: 3350 };
const rows = [];
const add = (name, cost, budget, calls) => rows.push({ name, cost, budget, calls });
add("always-on block", block, BUDGET.block, "-");
add("small fix: block, tasks/small-fix, deviations if unsure", block + task("small-fix") + deviations, BUDGET.smallFix, "1-2 + 1");
for (const c of cards) add(`restyle, ${c.name}: block, SKILL, context, tasks/restyle + card`, block + router + ctx.restyle + task("restyle") + c.tokens + extra(c, false), BUDGET.restyle, "3 + 1");
for (const c of cards) add(`new page, ${c.name}: block, SKILL, context, tasks/new-page + card + example`, block + router + ctx["new-page"] + task("new-page") + c.tokens + c.example + extra(c, true), BUDGET.newPage, "3 + 1");
const worst = cards.reduce((a, c) => (c.tokens + c.example > a.tokens + a.example ? c : a));
add(`new app (first page ${worst.name}): block, SKILL, context, tasks/new-app, new-page + card + example`, block + router + ctx["new-app"] + task("new-app") + task("new-page") + worst.tokens + worst.example + extra(worst, true), BUDGET.newApp, "4 + 1");
const biggest = cards.reduce((a, c) => (c.tokens > a.tokens ? c : a));
add(`migrate (screen ${biggest.name}): block, SKILL, context, tasks/migrate-v8 + card`, block + router + ctx.migrate + task("migrate-v8") + biggest.tokens, BUDGET.migrate, "3 + 1");

const limits = [
  ["SKILL.md", router, 1050], ["deviations.md", deviations, 500],
  ...["small-fix", "restyle", "new-page", "new-app", "migrate-v8"].map((n) => [`tasks/${n}.md`, task(n), n === "small-fix" ? 300 : n === "migrate-v8" ? 1100 : 700]),
  ...cards.map((c) => [`patterns/${c.name}.md`, c.tokens, 650]),
  ...Object.entries(ctx).map(([r, n]) => [`context.mjs ${r} output`, n, 700]),
  ...readdirSync(K + "examples").map((e) => [`examples/${e}`, tok(K + "examples/" + e), 2200]),
];

let bad = 0;
const w = Math.max(...rows.map((r) => r.name.length));
console.log(`${"Route".padEnd(w)}  tokens  budget  calls (before edit + finish)`);
for (const r of rows) { const over = r.cost > r.budget; if (over) bad++; console.log(`${r.name.padEnd(w)}  ${String(r.cost).padStart(6)}  ${String(r.budget).padStart(6)}  ${r.calls}${over ? "  OVER" : ""}`); }
console.log("");
for (const [name, n, max] of limits) if (n > max) { bad++; console.log(`OVER  ${name}: ${n} tokens (limit ${max})`); }
for (const e of readdirSync(K + "examples")) { const n = lines(K + "examples/" + e); if (n > 150) { bad++; console.log(`OVER  examples/${e}: ${n} lines (limit 150)`); } }
console.log(bad ? `\n${bad} budget(s) exceeded.` : `All budgets met: ${rows.length} routes, ${limits.length} files.`);
process.exit(bad ? 1 : 0);
