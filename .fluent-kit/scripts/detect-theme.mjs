#!/usr/bin/env node
// Detects how a React project is themed (theme, brand color, UI language), so an agent (or you) can decide:
// keep the existing theme, derive a brand ramp, migrate, or ask.
// Usage: node detect-theme.mjs <project-dir> [--json]
// No dependencies.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, extname, resolve, relative } from "node:path";
import { generateRamp, checks } from "./generate-ramp.mjs";

const root = resolve(process.argv[2] || ".");
const asJson = process.argv.includes("--json");
const EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const STYLE_EXT = new Set([".css", ".scss", ".less"]);
const SKIP = new Set(["node_modules", "dist", "build", ".git", ".github", ".fluent-kit", ".next", "coverage", "storybook-static"]);

const files = [];
const styleFiles = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (SKIP.has(n)) continue;
    const p = join(d, n);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p);
    else if (EXT.has(extname(n)) && st.size < 1_000_000) files.push(p);
    else if (STYLE_EXT.has(extname(n)) && st.size < 1_000_000) styleFiles.push(p);
  }
})(root);

// 1. dependencies (root package.json only; monorepo: run per package)
const deps = {};
const pkgPath = join(root, "package.json");
if (existsSync(pkgPath)) {
  try { const j = JSON.parse(readFileSync(pkgPath, "utf8")); Object.assign(deps, j.dependencies, j.devDependencies, j.peerDependencies); } catch {}
}
const has = (n) => deps[n];
const OTHER_UI = ["@mui/material", "antd", "@chakra-ui/react", "react-bootstrap", "@mantine/core", "primereact", "@blueprintjs/core", "semantic-ui-react"];
const OTHER_ICONS = ["react-icons", "lucide-react", "@heroicons/react", "@fortawesome/react-fontawesome", "@mui/icons-material"];

// 2. source signals
const sig = { providers: [], createTheme: [], stockTheme: [], v8: [], tokenOverrides: [] };
const RAMP_KEYS = [10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160];
let ramp = null, rampFile = null;
for (const f of files) {
  const t = readFileSync(f, "utf8");
  const rel = relative(root, f);
  if (/<FluentProvider\b/.test(t)) sig.providers.push(rel);
  if (/\bcreate(Light|Dark)Theme\s*\(/.test(t)) sig.createTheme.push(rel);
  if (/\b(web|teams)(Light|Dark)Theme\b/.test(t)) sig.stockTheme.push(rel);
  if (/from\s+["']@fluentui\/react(\/|["'])/.test(t) || /from\s+["']office-ui-fabric-react/.test(t)) sig.v8.push(rel);
  if (/\b(?:\.\.\.\s*)?(?:light|dark)Theme\s*=\s*\{[^}]*\.\.\.web(Light|Dark)Theme|\bcolorBrandBackground\s*:/.test(t)) sig.tokenOverrides.push(rel);
  if (!ramp && /BrandVariants|create(Light|Dark)Theme/.test(t)) {
    const found = {};
    for (const k of RAMP_KEYS) {
      const m = t.match(new RegExp(`\\b${k}\\s*:\\s*["'](#[0-9a-fA-F]{6})["']`));
      if (m) found[k] = m[1].toLowerCase();
    }
    if (Object.keys(found).length >= 12) { ramp = found; rampFile = rel; }
  }
}


// 2a. fresh scaffold? (a few files, only framework/tooling deps). Its default colors are not a brand.
const TOOLING = /^(react|react-dom|vite|@vitejs\/.+|typescript|typescript-eslint|eslint|eslint-.+|@eslint\/.+|globals|@types\/.+|next|tailwindcss|@tailwindcss\/.+|postcss|autoprefixer|vitest|@babel\/.+|babel-.+|webpack.*|react-scripts|web-vitals|@testing-library\/.+|jest.*|prettier.*|oxlint|@biomejs\/.+|esbuild|@swc\/.+|sass|less|tsx|ts-node|dotenv|cross-env)$/;
const nonTrivialDeps = Object.keys(deps).filter((n) => !TOOLING.test(n));
let readmeScaffold = false;
for (const n of ["README.md", "readme.md"]) {
  try { readmeScaffold = /minimal setup to get React working in Vite|Getting Started with Create React App|bootstrapped with \[?`?create-next-app|bootstrapped with .?create-next-app|This template provides/i.test(readFileSync(join(root, n), "utf8").slice(0, 4000)); break; } catch {}
}
const freshScaffold = files.length <= 8 && (nonTrivialDeps.length === 0 || readmeScaffold) && !has("@fluentui/react-components") && !has("@fluentui/react");

// 2b. brand color detection (used when there is no 16-step ramp to keep)
const HEX = /#[0-9a-fA-F]{6}\b/;
function hsl(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  if (!d) return [0, 0, l];
  return [0, d / (1 - Math.abs(2 * l - 1)), l];
}
let brand = null;
if (!ramp && !freshScaffold) {
  const named = new Map(); // hex -> {count, where}
  const direct = [];
  for (const f of [...files, ...styleFiles]) {
    const t = readFileSync(f, "utf8");
    const rel = relative(root, f);
    for (const m of t.matchAll(/\bcolorBrandBackground\s*:\s*["'](#[0-9a-fA-F]{6})["']/g)) direct.push({ hex: m[1].toLowerCase(), where: rel, why: "colorBrandBackground override" });
    for (const m of t.matchAll(/(?:brand|primary|accent)[\w$]*\s*:\s*\{[^{}]{0,80}?\b(?:main|DEFAULT|base|500)\s*:\s*["'](#[0-9a-fA-F]{6})["']/gi)) {
      const hex = m[1].toLowerCase();
      const e = named.get(hex) || { count: 0, where: rel };
      e.count++; named.set(hex, e);
    }
    for (const m of t.matchAll(/(?:--[\w-]*(?:brand|primary|accent)[\w-]*|\b[\w$]*(?:brand|primary|accent)[\w$]*(?:color|colour)?[\w$]*)\s*[:=]\s*["']?(#[0-9a-fA-F]{6})\b/gi)) {
      const hex = m[1].toLowerCase();
      const e = named.get(hex) || { count: 0, where: rel };
      e.count++; named.set(hex, e);
    }
  }
  if (direct.length) brand = { hex: direct[0].hex, source: `${direct[0].why} in ${direct[0].where}`, confidence: "high", candidates: [] };
  else if (named.size) {
    const rows = [...named].sort((a, b) => b[1].count - a[1].count);
    const top = rows[0], second = rows[1];
    const clear = !second || top[1].count >= 2 * second[1].count;
    brand = { hex: top[0], source: `variable named brand/primary/accent (${top[1].where}, x${top[1].count})`, confidence: clear ? "high" : "ambiguous", candidates: rows.slice(0, 5).map(([h, e]) => ({ hex: h, count: e.count })) };
  } else {
    // last resort: most used saturated mid-tone color
    const counts = new Map();
    for (const f of [...files, ...styleFiles]) {
      for (const m of readFileSync(f, "utf8").matchAll(/#[0-9a-fA-F]{6}\b/g)) { const h = m[0].toLowerCase(); counts.set(h, (counts.get(h) || 0) + 1); }
    }
    const rows = [...counts].filter(([h]) => { const [, sat, l] = hsl(h); return sat > 0.35 && l > 0.2 && l < 0.7; }).sort((a, b) => b[1] - a[1]);
    if (rows.length) {
      const clear = rows.length === 1 || rows[0][1] >= 2 * rows[1][1];
      brand = { hex: rows[0][0], source: `most used saturated color (x${rows[0][1]})`, confidence: clear ? "medium" : "ambiguous", candidates: rows.slice(0, 5).map(([h, c]) => ({ hex: h, count: c })) };
    }
  }
}
// shared UI/theme packages (names are not known in advance, so this is a heuristic: verify)
const KNOWN_SCOPES = /^@(fluentui|types|babel|testing-library|storybook|vitejs|typescript-eslint|eslint|azure|microsoft|griffel|emotion|swc|rollup|vitest|playwright|angular|nx|tanstack|reduxjs|react-spring|floating-ui|mui|chakra-ui|mantine|blueprintjs|heroicons|fortawesome|radix-ui)\//;
const sharedPackages = Object.keys(deps).filter((n) => n[0] === "@" && !KNOWN_SCOPES.test(n) && /(^|[\/-])(ui|design|theme|components)(-|$)/.test(n));


// 2c. UI language signals
const allPaths = [];
(function walkNames(d, depth) {
  if (depth > 8 || allPaths.length > 30000) return;
  for (const n of readdirSync(d)) {
    if (SKIP.has(n)) continue;
    const p = join(d, n);
    let st; try { st = statSync(p); } catch { continue; }
    allPaths.push(relative(root, p).split("\\").join("/"));
    if (st.isDirectory()) walkNames(p, depth + 1);
  }
})(root, 0);
const I18N_LIBS = ["i18next", "react-i18next", "next-i18next", "react-intl", "@formatjs/intl", "@lingui/core", "@lingui/react", "next-intl", "typesafe-i18n", "react-localization"];
let htmlLang = null;
for (const rel of allPaths) {
  if (!/(^|\/)(index\.html|_document\.(t|j)sx?|layout\.(t|j)sx?|App\.html)$/.test(rel)) continue;
  try {
    const t = readFileSync(join(root, rel), "utf8").slice(0, 200000);
    const m = t.match(/<html[^>]*\blang\s*=\s*["']([A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?)["']/);
    if (m) { htmlLang = m[1]; break; }
  } catch {}
}
const localeCodes = new Set();
for (const rel of allPaths) {
  const m = rel.match(/(?:^|\/)(?:locales?|i18n|translations?|lang|messages)\/(?:([a-z]{2,3}(?:[-_][A-Za-z]{2,4})?)(?:\/|\.(?:json|ts|js|ya?ml|po|xlf|properties)$)|(?:[\w-]+\.)?([a-z]{2,3}(?:[-_][A-Za-z]{2,4})?)\.(?:json|ya?ml|po)$)/);
  if (m) localeCodes.add((m[1] || m[2]).replace("_", "-"));
}
for (const rel of allPaths) {
  const m = rel.match(/(?:^|\/)(?:messages|strings|translations)[.-]([a-z]{2,3}(?:-[A-Za-z]{2,4})?)\.(?:json|ts|js|ya?ml)$/);
  if (m) localeCodes.add(m[1]);
}
const i18nLibrary = I18N_LIBS.filter(has);
const primary = htmlLang ? htmlLang.toLowerCase().split("-")[0] : null;
const codes = [...localeCodes].sort();
let uiLanguage = null, localeAdvice;
if (primary) { uiLanguage = primary; localeAdvice = `UI text is in "${htmlLang}" (html lang). Write new strings in that language${i18nLibrary.length ? `, in the project's ${i18nLibrary[0]} resource files` : ""}.`; }
else if (codes.length === 1) { uiLanguage = codes[0].toLowerCase().split("-")[0]; localeAdvice = `One locale found (${codes[0]}). Write new strings in that language.`; }
else if (codes.length > 1) localeAdvice = `Several locales found (${codes.join(", ")}). Add keys for all of them, and write the default locale first. If unsure which is the default, ask.`;
else localeAdvice = "No language signals. Ask the user once which language the UI text should be in; if they do not say, use English.";

// 2d. a saved decision (.fluent-kit/brand.json): {"mode":"stock"} or {"hex":"#rrggbb"}
let decision = null;
try {
  const d = JSON.parse(readFileSync(join(root, ".fluent-kit", "brand.json"), "utf8"));
  if (d && d.mode === "stock") decision = { mode: "stock" };
  else if (d && /^#[0-9a-fA-F]{6}$/.test(d.hex || "")) decision = { hex: d.hex.toLowerCase() };
} catch {}
if (decision && decision.hex && !ramp) brand = { hex: decision.hex, source: ".fluent-kit/brand.json", confidence: "high", candidates: [] };

// 2e. existing guidance in the repo, styling approach, framework
const existingGuidance = [];
for (const f of ["design.md", "DESIGN.md", "STYLEGUIDE.md", "docs/design.md", "docs/DESIGN.md", "AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md", ".cursorrules"]) {
  if (existsSync(join(root, f))) {
    let note = "";
    if (f === ".github/copilot-instructions.md") { try { if (readFileSync(join(root, f), "utf8").includes("fluent-kit:start")) continue; } catch {} }
    existingGuidance.push(f + note);
  }
}
for (const d of [".agents/skills", ".github/skills", ".claude/skills", ".cursor/rules"]) {
  try {
    for (const n of readdirSync(join(root, d))) if (/fluent|design|\bui\b|style|theme|frontend/i.test(n) && n !== "fluent-ui") existingGuidance.push(`${d}/${n}`);
  } catch {}
}
const framework = has("next") ? "next" : has("vite") ? "vite" : has("react-scripts") ? "cra" : has("@remix-run/react") ? "remix" : null;
const tailwind = !!(has("tailwindcss") || has("@tailwindcss/postcss") || has("@tailwindcss/vite"));

// 2f. setup info (package manager, missing Fluent packages)
const pm = existsSync(join(root, "bun.lock")) || existsSync(join(root, "bun.lockb")) ? "bun"
  : existsSync(join(root, "pnpm-lock.yaml")) ? "pnpm"
  : existsSync(join(root, "yarn.lock")) ? "yarn" : "npm";
const missingDeps = ["@fluentui/react-components", "@fluentui/react-icons"].filter((n) => !has(n));
const installCmd = missingDeps.length ? `${pm === "npm" ? "npm install" : pm === "yarn" ? "yarn add" : pm + " add"} ${missingDeps.join(" ")}` : null;
const hasPackageJson = existsSync(pkgPath);

// 3. classification
let kind, advice;
const v9 = has("@fluentui/react-components");
const v8 = has("@fluentui/react") || sig.v8.length;
if (v9 && ramp) {
  kind = "fluent-v9-custom-brand";
  advice = `Fluent v9 with its own brand ramp (${rampFile}). Keep it. Treat the ramp as this product's brand file; do not change it. Check its contrast against .fluent-kit/DESIGN.md.`;
} else if (v9 && sig.createTheme.length) {
  kind = "fluent-v9-custom-brand-unparsed";
  advice = `createLightTheme/createDarkTheme found in ${sig.createTheme[0]} but the ramp could not be read. Open that file and use it as is.`;
} else if (v9 && (sig.stockTheme.length || sig.providers.length)) {
  kind = "fluent-v9-stock-theme";
  advice = "Fluent v9 with a stock Microsoft theme (no brand ramp). If a brand color is found below, derive a ramp from it; if not, ask the user for the brand color.";
} else if (v8) {
  kind = "fluent-v8";
  advice = "Fluent v8 in use. Do not mix v8 and v9 in new code. Ask the user whether this task is a migration; if not, build new UI in v9 inside a FluentProvider alongside v8 only if the project already does so.";
} else if (OTHER_UI.some(has)) {
  kind = "other-ui-library";
  advice = "Another UI library is in use. Ask the user: migrate to Fluent v9, or keep that library for this task. A brand color, if found below, still applies.";
} else if (!files.length || (!v9 && !v8)) {
  kind = "new-project";
  advice = "New project (nothing Fluent yet). Follow .github/skills/fluent-ui/references/new-project-setup.md: ask once for the brand hex or \"stock\", install Fluent, run .fluent-kit/scripts/make-theme.mjs, wrap the app.";
}

let brandAdvice = null;
if (decision && decision.mode === "stock" && !ramp) brandAdvice = "Saved decision (.fluent-kit/brand.json): this project uses the stock Microsoft theme. Do not ask for a brand color and do not generate a ramp.";
else if (ramp) brandAdvice = "Keep the existing ramp. Do not regenerate it.";
else if (brand) {
  if (brand.confidence === "ambiguous") brandAdvice = `Several possible brand colors (${brand.candidates.map((c) => c.hex).join(", ")}). Ask the user which one is the product brand, then run: node .fluent-kit/scripts/generate-ramp.mjs <hex> --ts`;
  else if (brand.confidence === "high") brandAdvice = `Brand color ${brand.hex} found (${brand.source}). Use it without asking: ${sig.providers.length ? `run node .fluent-kit/scripts/generate-ramp.mjs ${brand.hex} --ts and put the result where the theme is created` : `run node .fluent-kit/scripts/make-theme.mjs ${brand.hex} --out <theme file> (add --next for Next.js) and wrap the app`}, and tell the user in one line which color was used.`;
  else brandAdvice = `Probable brand color ${brand.hex} (${brand.source}). It is only a guess from usage counts. Run node .fluent-kit/scripts/generate-ramp.mjs ${brand.hex} --ts, use it, and say in one line which color you used and that it is a guess, so the user can correct it.`;
} else if (freshScaffold) brandAdvice = "This looks like a fresh scaffold; its default colors are not a brand. Ask the user for the brand hex, or whether to use the stock Microsoft theme (then run make-theme.mjs).";
else if (!ramp) brandAdvice = "No brand color found in this project. Ask the user for the brand hex, or whether to stay on the stock Microsoft theme; record the answer in .fluent-kit/brand.json.";

const out = {
  root, kind, advice,
  fluentVersion: v9 || null,
  fluentV8: !!v8,
  otherUiLibraries: OTHER_UI.filter(has),
  otherIconLibraries: OTHER_ICONS.filter(has),
  hasFluentIcons: !!has("@fluentui/react-icons"),
  fluentProviderFiles: sig.providers.slice(0, 5),
  themeFiles: [...new Set([...sig.createTheme, ...sig.stockTheme])].slice(0, 5),
  v8Files: sig.v8.length,
  brandRamp: ramp,
  freshScaffold,
  setup: { hasPackageJson, packageManager: pm, missingDeps, installCmd },
  existingGuidance,
  framework,
  tailwind,
  brandDecision: decision,
  locale: { htmlLang, uiLanguage, localeCodes: codes, i18nLibrary },
  localeAdvice,
  brand,
  brandAdvice,
  generatedRamp: brand && !ramp && brand.confidence !== "ambiguous" ? generateRamp(brand.hex) : null,
  possibleSharedPackages: sharedPackages,
};

if (asJson) console.log(JSON.stringify(out, null, 2));
else {
  console.log(`Project:  ${out.root}`);
  console.log(`Result:   ${out.kind}`);
  console.log(`Advice:   ${out.advice}`);
  console.log(`Fluent v9: ${out.fluentVersion || "no"}   v8 files: ${out.v8Files}   fluent icons: ${out.hasFluentIcons ? "yes" : "no"}`);
  if (out.otherUiLibraries.length) console.log(`Other UI libs:   ${out.otherUiLibraries.join(", ")}`);
  if (out.otherIconLibraries.length) console.log(`Other icon libs: ${out.otherIconLibraries.join(", ")}`);
  if (out.fluentProviderFiles.length) console.log(`FluentProvider:  ${out.fluentProviderFiles.join(", ")}`);
  if (out.themeFiles.length) console.log(`Theme files:     ${out.themeFiles.join(", ")}`);
  if (out.brandRamp) console.log(`Brand (80/100):  ${out.brandRamp[80]} / ${out.brandRamp[100]}`);
  else if (out.brand) console.log(`Brand color:     ${out.brand.hex} (${out.brand.confidence}; ${out.brand.source})`);
  if (out.brandAdvice) console.log(`Brand advice:    ${out.brandAdvice}`);
  if (out.generatedRamp) { const c = checks(out.generatedRamp).filter((r) => !r.ok); if (c.length) console.log(`Warning:         generated ramp fails ${c.length} contrast check(s); run generate-ramp.mjs for details and ask the user.`); }
  if (out.existingGuidance.length) console.log(`Existing guidance: ${out.existingGuidance.join(", ")}\n                   The repo already has its own rules. Follow them first where they conflict with the kit; use the kit to fill gaps.`);
  if (out.framework === "next") console.log("Next.js:         files that use makeStyles or Fluent hooks need \"use client\". Do not pass icon components from Server to Client Components.");
  if (out.tailwind) console.log("Tailwind:        in use. Keep the project's existing Tailwind usage for page layout; in new code take colors, type, radii and shadows from Fluent tokens, not Tailwind color utilities, unless the project's own guidance says otherwise.");
  if (!out.setup.hasPackageJson) console.log("Setup:           no package.json here. Create the app first (ask which framework; default is Vite + React + TypeScript), then follow .github/skills/fluent-ui/references/new-project-setup.md.");
  else if (out.setup.installCmd) console.log(`Setup:           Fluent packages missing. Install: ${out.setup.installCmd}   (then follow .github/skills/fluent-ui/references/new-project-setup.md)${out.freshScaffold ? "\n                 Looks like a fresh scaffold." : ""}`);
  console.log(`UI language:     ${out.locale.uiLanguage || (out.locale.localeCodes.length ? "several: " + out.locale.localeCodes.join(", ") : "unknown")}${out.locale.i18nLibrary.length ? "   i18n: " + out.locale.i18nLibrary.join(", ") : ""}`);
  console.log(`Language advice: ${out.localeAdvice}`);
  if (out.possibleSharedPackages.length) console.log(`Possible shared UI packages (verify): ${out.possibleSharedPackages.join(", ")}`);
}
