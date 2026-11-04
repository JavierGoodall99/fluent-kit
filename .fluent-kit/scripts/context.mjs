#!/usr/bin/env node
// Fluent kit context: everything a UI task needs to know about this project, in one call.
// Usage: node .fluent-kit/scripts/context.mjs <restyle|new-page|new-app|migrate> [--refresh] [--no-cache] [--json]
// Prints the theme and brand, the UI language, the repo's own design guidance, .fluent-kit/PROFILE.md (inlined),
// framework notes, and the app's standard card style and the pages that differ. The task card that told the agent to
// run this is what it reads next, so the output does not route again.
// The project scan is cached in .fluent-kit/context.json and redone when package.json, a lockfile, brand.json,
// PROFILE.md or a theme file changes (or with --refresh). The card scan always runs: it is fast and pages change.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { skillPath } from "./lib.mjs";

const ROUTES = ["restyle", "new-page", "new-app", "migrate"];
const args = process.argv.slice(2);
const route = args.find((a) => ROUTES.includes(a)) || null;
const root = resolve(".");
const here = dirname(fileURLToPath(import.meta.url));
const kitDir = join(root, ".fluent-kit");
const cacheFile = join(kitDir, "context.json");
const read = (f) => { try { return readFileSync(f, "utf8"); } catch { return null; } };
const node = (script, a) => { const r = spawnSync(process.execPath, [join(here, script), ...a], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }); try { return JSON.parse(r.stdout); } catch { return null; } };

const skill = skillPath(root);
const noCache = args.includes("--no-cache"); // the installer's dry run: read, never write

// What the cached scan depends on.
function cacheKey(themeFiles) {
  const h = createHash("sha256");
  for (const f of ["package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb", ".fluent-kit/brand.json", ".fluent-kit/PROFILE.md", "index.html", ...themeFiles]) {
    h.update(f); h.update(read(join(root, f)) ?? "-");
  }
  return h.digest("hex").slice(0, 16);
}

let cached = null; try { cached = JSON.parse(read(cacheFile)); } catch { /* none */ }
let detect, fromCache = false;
if (cached && !noCache && !args.includes("--refresh") && cached.key === cacheKey(cached.detect?.themeFiles || [])) { detect = cached.detect; fromCache = true; }
else {
  detect = node("detect-theme.mjs", [root, "--json"]);
  if (detect && !noCache) {
    try {
      mkdirSync(kitDir, { recursive: true });
      writeFileSync(cacheFile, JSON.stringify({ note: "Cache written by context.mjs. Safe to delete.", key: cacheKey(detect.themeFiles || []), at: new Date().toISOString(), detect }, null, 2) + "\n");
      const gi = join(kitDir, ".gitignore");
      if (!(read(gi) || "").split("\n").includes("context.json")) writeFileSync(gi, ((read(gi) || "").trimEnd() + "\ncontext.json\n").trimStart());
    } catch { /* a read-only checkout still gets the output */ }
  }
}
if (!detect) { console.log("fluent-kit context: the project scan failed. Run node .fluent-kit/scripts/detect-theme.mjs . to see why."); process.exit(2); }

const profile = read(join(kitDir, "PROFILE.md"));
const cards = route === "restyle" || route === "new-page" ? node("consistency.mjs", ["--json"]) : null;

const out = { route, fromCache, theme: detect.kind, advice: detect.advice, brandAdvice: detect.brandAdvice, language: detect.locale?.uiLanguage || null, languageAdvice: detect.localeAdvice,
  guidance: detect.existingGuidance || [], framework: detect.framework, tailwind: !!detect.tailwind, setup: detect.setup, profile, cards: cards?.styles || null, skill };
if (args.includes("--json")) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }

const lines = [`Fluent kit context${route ? ` for ${route}` : ""}${fromCache ? " (cached; --refresh to rescan)" : ""}`];
const theme = { "fluent-v9-custom-brand": "Fluent v9 with its own brand ramp: keep it.", "fluent-v9-custom-brand-unparsed": "Fluent v9 with its own theme: keep it as it is.",
  "fluent-v9-stock-theme": "Fluent v9 on the stock Microsoft theme: keep it; do not ask for a brand colour." }[detect.kind] || detect.advice;
// An empty folder (or one holding only the kit): there is nothing to install Fluent into yet.
const noPackage = detect.setup && !detect.setup.hasPackageJson;
// The person already asked for the migration: do not tell the agent to ask whether this is one.
const migrating = route === "migrate" && detect.kind === "fluent-v8";
lines.push(`Theme:     ${noPackage ? "none yet (no app in this folder)." : migrating ? "Fluent v8, migrating to v9 screen by screen: v9 goes around v8, v8 stays until the last screen." : theme}${!noPackage && detect.themeFiles?.length ? ` (${detect.themeFiles.slice(0, 2).join(", ")})` : ""}`);
if (route === "migrate" && detect.kind !== "fluent-v8") lines.push(`Note:      this project is ${detect.kind}, not Fluent v8: there is nothing to migrate. Tell the person, and use the new-page or restyle route.`);
if (noPackage) {
  lines.push("Result:    no package.json");
  lines.push(`Brand:     ${detect.brandDecision ? `saved decision (.fluent-kit/brand.json): ${detect.brandDecision.mode === "stock" ? "stock" : detect.brandDecision.hex}.` : 'none yet: ask for the brand hex or "stock" (never invent one); scaffold.mjs takes the answer.'}`);
} else if (route === "new-app" || route === "migrate" || !/^fluent-v9/.test(detect.kind)) {
  lines.push(`Result:    ${detect.kind}${detect.otherUiLibraries?.length ? ` (${detect.otherUiLibraries.slice(0, 3).join(", ")})` : ""}`);
  if (detect.brandAdvice) lines.push(`Brand:     ${detect.brandAdvice}`);
  if (detect.rampContrastFailures) lines.push(`Contrast:  a ramp from that colour fails ${detect.rampContrastFailures} contrast check(s); make-theme.mjs stops and prints a darker shade to offer.`);
}
lines.push(`Language:  ${out.language ? `${out.language}: write UI text in it.` : detect.localeAdvice}`);
if (out.guidance.length) lines.push(`Guidance:  ${out.guidance.join(", ")}: the repo's own rules win over the kit where they conflict.`);
if (detect.possibleSharedPackages?.length) lines.push(`Shared UI: ${detect.possibleSharedPackages.slice(0, 3).join(", ")} may be the company's shared UI package (a guess from the name): check it, and use its components first.`);
if (detect.framework === "next") lines.push("Next.js:   files with makeStyles, hooks or handlers need \"use client\"; pass strings, not icons, from Server to Client Components; mount a virtualized DataGrid and @fluentui/react-charts on the client only (next/dynamic with ssr: false); a hydration diff made only of <i data-tabster-dummy> is a known Fluent issue (mention it, do not restructure the page).");
if (detect.tailwind) lines.push("Tailwind:  keep it for page layout; colours, type, radii and shadows come from Fluent tokens.");
if (noPackage) lines.push("Setup:     no app yet. Create it in this folder with: node .fluent-kit/scripts/scaffold.mjs --brand <#hex|stock> --lang <code> (add --next only if Next.js was asked for).");
else if (detect.setup?.installCmd) lines.push(`Setup:     missing ${detect.setup.missingDeps.join(", ")}. Install: ${detect.setup.installCmd}`);

if (profile) {
  const body = profile.split("\n").filter((l) => l.trim() && !/^Copy this file/.test(l)).slice(0, 60);
  lines.push("Profile:   .fluent-kit/PROFILE.md (overrides the kit):", ...body.map((l) => "  " + l));
} else lines.push("Profile:   none (kit defaults).");

if (cards) {
  const s = cards.styles;
  if (!s.length) lines.push("Cards:     no card-like styles in the app yet.");
  else if (s.length === 1) lines.push(`Cards:     one style everywhere (${s[0].style}): use it.`);
  else lines.push(`Cards:     standard style ${s[0].style} (${s[0].count}x): use it.`, ...s.slice(1, 4).map((x) => `           also ${x.style} in ${x.where.slice(0, 3).join(", ")}`), "           Leave other pages as they are; mention a difference only if it looks like a mistake.");
}

if (!route) lines.push(`Route:     run with the task's route: ${ROUTES.join(" | ")} (a small fix needs no context call).`);
console.log(lines.join("\n"));
