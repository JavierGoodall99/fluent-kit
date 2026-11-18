// Shared helpers for the kit's scripts: package manager, the skill's install path, and what verify needs
// (Playwright, axe-core, a browser). One copy, so install, check, verify and doctor always agree.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

// verify's own dependencies live here, inside the kit folder, so the project's package.json and lockfile stay untouched.
// How to cap a long popup list (check.mjs and verify.mjs both print it, so the cards need not carry it).
export const POPUP_CAP = 'Dropdown and Combobox: positioning={{ autoSize: false }} and listbox={{ className }} with maxHeight "320px" (a style prop is overridden). Menu: maxHeight on MenuPopover.';
export const DEPS_DIR = ".fluent-kit/deps";
export const VERIFY_DEPS = ["playwright-core@^1.64.1", "axe-core@^4.14.0"];
export const SETUP_CMD = "node .fluent-kit/scripts/verify.mjs --setup";

export function packageManager(root) {
  if (existsSync(join(root, "bun.lock")) || existsSync(join(root, "bun.lockb"))) return "bun";
  if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(root, "yarn.lock"))) return "yarn";
  return "npm";
}

// The folder the skill was installed to (the manifest knows; the default is Copilot's folder).
export function skillPath(root) {
  try { const s = JSON.parse(readFileSync(join(root, ".fluent-kit", "manifest.json"), "utf8")).skill; if (typeof s === "string") return s; } catch { /* no manifest */ }
  return ".github/skills/fluent-ui";
}

// Resolve a package from the project first, then from the kit's private deps folder.
function requirers(root) {
  return [createRequire(join(root, "package.json")), createRequire(join(root, DEPS_DIR, "package.json"))];
}
export function resolveFrom(root, name) {
  for (const r of requirers(root)) { try { return { path: r.resolve(name), require: r }; } catch { /* next */ } }
  return null;
}
export function loadPlaywright(root) {
  for (const name of ["playwright", "@playwright/test", "playwright-core"]) {
    const hit = resolveFrom(root, name);
    if (hit) { try { const pw = hit.require(name); if (pw?.chromium) return { pw, name }; } catch { /* broken install */ } }
  }
  return null;
}
export const hasPlaywright = (root) => ["playwright", "@playwright/test", "playwright-core"].some((n) => resolveFrom(root, n));
export function axeSourcePath(root) {
  const direct = resolveFrom(root, "axe-core/axe.min.js");
  if (direct) return direct.path;
  const wrapper = resolveFrom(root, "@axe-core/playwright");
  if (wrapper) { try { return createRequire(wrapper.path).resolve("axe-core/axe.min.js"); } catch { /* none */ } }
  return null;
}

// The project's tsc launcher, through package.json "bin" (TypeScript 7 no longer exports "typescript/bin/tsc").
export function tscPath(root) {
  const hit = resolveFrom(root, "typescript/package.json");
  if (!hit) return null;
  try {
    const pkg = JSON.parse(readFileSync(hit.path, "utf8"));
    const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.tsc;
    const p = bin && join(dirname(hit.path), bin);
    return p && existsSync(p) ? p : null;
  } catch { return null; }
}

// Edge or Chrome already on this machine: verify launches it through Playwright, so no browser download is needed.
export function systemBrowser() {
  const env = process.env;
  const list = process.platform === "win32"
    ? [env["ProgramFiles(x86)"], env.ProgramFiles].filter(Boolean).map((p) => `${p}\\Microsoft\\Edge\\Application\\msedge.exe`)
      .concat([env.ProgramFiles, env["ProgramFiles(x86)"], env.LOCALAPPDATA].filter(Boolean).map((p) => `${p}\\Google\\Chrome\\Application\\chrome.exe`))
    : process.platform === "darwin"
      ? ["/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
      : ["/usr/bin/microsoft-edge", "/usr/bin/microsoft-edge-stable", "/opt/microsoft/msedge/msedge", "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable"];
  return list.find((p) => existsSync(p)) || null;
}
export function systemEdge() {
  const b = systemBrowser();
  return b && /edge/i.test(b) ? b : null;
}

// Installs verify's dependencies into .fluent-kit/deps with npm (it ships with Node, whatever the project uses), and
// Playwright's Chromium only when no Edge or Chrome is on the machine. Returns true when verify can run afterwards.
export function installVerifyDeps(root, log = console.log) {
  const dir = join(root, DEPS_DIR);
  mkdirSync(dir, { recursive: true });
  const pj = join(dir, "package.json");
  if (!existsSync(pj)) writeFileSync(pj, JSON.stringify({ name: "fluent-kit-verify-deps", private: true, description: "verify.mjs dependencies, installed by the Fluent kit. Not part of your app; git ignores this folder." }, null, 2) + "\n");
  const shell = process.platform === "win32";
  log(`Installing ${VERIFY_DEPS.join(", ")} into ${DEPS_DIR}/ (your package.json is not changed)...`);
  const a = spawnSync("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", ...VERIFY_DEPS], { cwd: dir, stdio: "inherit", shell });
  if (a.status !== 0) { log("Install failed (see above). A company proxy or registry setting is the usual cause; check npm config, then run again."); return false; }
  const browser = systemBrowser();
  if (browser) { log(`No browser download: verify uses ${browser}.`); return true; }
  log("No Edge or Chrome found: downloading Playwright's Chromium (about 150 MB)...");
  const cli = join(dir, "node_modules", "playwright-core", "cli.js");
  const b = spawnSync(process.execPath, [cli, "install", "chromium"], { cwd: dir, stdio: "inherit" });
  if (b.status !== 0) { log("Chromium download failed. Install Microsoft Edge or Google Chrome instead; verify finds them by itself."); return false; }
  return true;
}

// How the app addresses its pages, read from the source: hash routing (/#key) or paths, and which file is which page.
// Finds `path: "x" ... <Page` (React Router) and, in a hash-routed app, `x: [..., Page]` or `x: Page` maps. Null if unsure.
export function pageRoutes(root) {
  const top = ["src", "app"].map((d) => join(root, d)).find((d) => existsSync(d));
  const files = [], walk = (d, n) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.name === "node_modules" || e.name.startsWith(".") || files.length > 400) continue; if (e.isDirectory()) { if (n < 6) walk(p, n + 1); } else if (/\.[jt]sx?$/.test(e.name)) files.push(p); } };
  if (top) walk(top, 0);
  let hash = false; const found = [];
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    if (/location\.hash|HashRouter|createHashRouter/.test(s)) hash = true;
    for (const m of s.matchAll(/import\s+(?:(\w+)|\{([^}]+)\})\s+from\s+["'](\.[^"']+)["']/g)) {
      const file = ["", ".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.jsx"].map((x) => resolve(dirname(f), m[3] + x)).find((p) => existsSync(p) && statSync(p).isFile());
      if (file) for (const n of m[1] ? [m[1]] : m[2].split(",").map((x) => x.trim().split(/\s+as\s+/).pop()).filter(Boolean)) {
        const k = s.match(new RegExp(`path\\s*[:=]\\s*\\{?\\s*["'\`]/?([^"'\`]*)["'\`](?:(?!path\\b)[^\\n]){0,120}?<${n}\\b`));
        const o = s.match(new RegExp(`["']?([\\w-]+)["']?\\s*:\\s*(?:\\[[^\\]\\n]*\\b${n}\\b|${n}\\s*[,}\\n])`));
        if (k) found.push({ key: k[1], file }); else if (o) found.push({ key: o[1], file, map: true });
      }
    }
  }
  const pages = found.filter((p) => hash || !p.map);
  return pages.length ? { hash, pages, url: (key) => (hash ? `/#${key}` : `/${key}`) } : null;
}
