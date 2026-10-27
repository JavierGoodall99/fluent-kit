#!/usr/bin/env node
// Lists every distinct color value used in one or more repos, with counts.
// Usage: node scan-colors.mjs <dir> [<dir> ...] [--min=2] [--csv]
// No dependencies. Reads .ts .tsx .js .jsx .css .scss .less .html .json (skips node_modules, dist, build, .git).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname, resolve, basename } from "node:path";

const args = process.argv.slice(2);
const dirs = args.filter((a) => !a.startsWith("--"));
const min = Number((args.find((a) => a.startsWith("--min=")) || "--min=1").split("=")[1]);
const csv = args.includes("--csv");
if (!dirs.length) {
  console.error("Usage: node scan-colors.mjs <dir> [<dir> ...] [--min=2] [--csv]");
  process.exit(1);
}

const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".scss", ".less", ".html", ".json"]);
const SKIP = new Set(["node_modules", "dist", "build", ".git", ".github", ".fluent-kit", ".next", "coverage", "storybook-static"]);
const RE = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|rgba?\(\s*\d+\s*[, ]\s*\d+\s*[, ]\s*\d+(?:\s*[,/]\s*[\d.]+%?)?\s*\)/g;

function norm(c) {
  c = c.toLowerCase();
  if (c[0] === "#") {
    if (c.length === 4) c = "#" + [...c.slice(1)].map((x) => x + x).join("");
    if (c.length === 9 && c.endsWith("ff")) c = c.slice(0, 7);
    return c;
  }
  const m = c.match(/\d+/g).slice(0, 3).map(Number);
  if (m.some((n) => n > 255)) return c;
  return "#" + m.map((n) => n.toString(16).padStart(2, "0")).join("");
}

function hsl(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

const stats = new Map(); // hex -> { count, files:Set, repos:Set }
function walk(dir, repo) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, repo);
    else if (EXT.has(extname(name)) && st.size < 2_000_000) {
      const txt = readFileSync(p, "utf8");
      for (const m of txt.matchAll(RE)) {
        const k = norm(m[0]);
        const s = stats.get(k) || { count: 0, files: new Set(), repos: new Set() };
        s.count++; s.files.add(p); s.repos.add(repo);
        stats.set(k, s);
      }
    }
  }
}
for (const d of dirs) walk(resolve(d), basename(resolve(d)));

// Candidate brand colors: saturated, mid-lightness, used often. Greys and near-white/black are excluded.
const rows = [...stats].filter(([, s]) => s.count >= min).map(([hex, s]) => {
  const [h, sat, l] = hsl(hex);
  return { hex, count: s.count, files: s.files.size, repos: [...s.repos].join("|"),
    hue: Math.round(h), sat: Math.round(sat * 100), light: Math.round(l * 100),
    candidate: hex.length === 7 && sat > 0.35 && l > 0.2 && l < 0.7 };
}).sort((a, b) => b.count - a.count);

if (csv) {
  console.log("hex,count,files,repos,hue,sat,light,brand_candidate");
  for (const r of rows) console.log([r.hex, r.count, r.files, r.repos, r.hue, r.sat, r.light, r.candidate].join(","));
} else {
  console.log(`Distinct colors: ${rows.length} (min count ${min}). Brand candidates are saturated mid-tone colors.\n`);
  console.log("Brand candidates (check these by hand, most used first):");
  for (const r of rows.filter((r) => r.candidate).slice(0, 25))
    console.log(`  ${r.hex}  x${r.count} in ${r.files} files  hue ${r.hue}  [${r.repos}]`);
  const greys = rows.filter((r) => !r.candidate).length;
  console.log(`\nOther colors (greys, near-black/white, tints): ${greys}. Use --csv for the full list.`);
}
