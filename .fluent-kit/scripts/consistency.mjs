#!/usr/bin/env node
// Fluent kit consistency scan: finds out whether the same kind of thing (cards, tiles, panels) is styled the same way across the app.
// Usage: node .fluent-kit/scripts/consistency.mjs [folder ...]      (default: src, app, components, pages)
// Prints every distinct "card style" (radius, shadow, background, accent stripe) with the files that use it and says which one is the
// project's standard. New cards and tiles must use the standard one (or its shared component). Exit code 0; with --strict 1 if styles differ.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const strict = process.argv.includes("--strict");
const asJson = process.argv.includes("--json"); // { styles: [{ style, count, where }] }, most used first
const roots = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const dirs = (roots.length ? roots : ["src", "app", "components", "pages"]).filter((d) => existsSync(d));
if (!dirs.length) { console.log(asJson ? JSON.stringify({ styles: [], note: "no src, app, components or pages folder" }) : "No src, app, components or pages folder here. Pass the folder: node .fluent-kit/scripts/consistency.mjs <folder>"); process.exit(0); }

const files = [];
const walk = (d) => { for (const n of readdirSync(d)) { if (/^(node_modules|\.next|dist|build|\.git|\.fluent-kit|\.github|\.claude|\.agents)$/.test(n)) continue; const p = join(d, n); const st = statSync(p); if (st.isDirectory()) walk(p); else if (/\.(tsx|jsx|ts)$/.test(n) && !/\.(test|spec|stories)\./.test(n)) files.push(p); } };
dirs.forEach(walk);

const NAME = /(?:^|[a-z0-9])(?:[Cc]ard|[Tt]ile|[Kk]pi|[Ss]tats?|[Mm]etric|[Pp]anel)(?:[A-Z0-9]|$)/;
const sigs = new Map();
for (const f of files) {
  const src = readFileSync(f, "utf8");
  if (!/makeStyles|<Card\b/.test(src)) continue;
  const re = /([\w$]+)\s*:\s*\{/g; let m;
  while ((m = re.exec(src))) {
    if (!NAME.test(m[1])) continue;
    let depth = 1, i = re.lastIndex;
    while (i < src.length && depth) { const c = src[i++]; if (c === "{") depth++; else if (c === "}") depth--; }
    const body = src.slice(re.lastIndex, i - 1);
    if (!/(border|shadow|background|padding)/i.test(body)) continue;
    const pick = (rx) => (body.match(rx) || [])[1];
    const radius = pick(/borderRadius\w*\s*:\s*(?:tokens\.(\w+)|"([^"]+)")/) || (body.match(/borderRadius\w*\s*:\s*"([^"]+)"/) || [])[1];
    const shadow = pick(/boxShadow\s*:\s*tokens\.(\w+)/) || (/boxShadow\s*:/.test(body) ? "custom" : null);
    const bg = pick(/background(?:Color)?\s*:\s*tokens\.(\w+)/);
    const accent = /border(Left|InlineStart|Top)\w*\s*:/.test(body);
    const key = `radius=${radius || "default"}  shadow=${shadow || "none"}  background=${bg || "default"}${accent ? "  ACCENT-STRIPE" : ""}`;
    const e = sigs.get(key) || { n: 0, where: [] };
    e.n++; e.where.push(`${relative(process.cwd(), f)} (${m[1]})`); sigs.set(key, e);
  }
}
if (asJson) { console.log(JSON.stringify({ styles: [...sigs].sort((a, b) => b[1].n - a[1].n).map(([style, e]) => ({ style, count: e.n, where: [...new Set(e.where)] })) })); process.exit(0); }
if (!sigs.size) { console.log("No card-like styles found (names with card, tile, kpi, stat, metric or panel). Nothing to compare."); process.exit(0); }
const list = [...sigs].sort((a, b) => b[1].n - a[1].n);
console.log(`Card-like styles in this project: ${list.length} distinct.\n`);
for (const [k, e] of list) console.log(`${e.n}x  ${k}\n      ${[...new Set(e.where)].slice(0, 6).join("\n      ")}${e.where.length > 6 ? "\n      ..." : ""}\n`);
if (list.length > 1) {
  console.log(`The most used style is the standard: ${list[0][0]}.\nNew cards and tiles use that style (or its shared component). Do not invent a second look. If the others look different on purpose, say why in the note; otherwise tell the person the app has ${list.length} card styles and offer to unify them (one shared component), without changing other pages unasked.`);
  if (strict) process.exit(1);
} else console.log("One card style everywhere. Keep it.");
