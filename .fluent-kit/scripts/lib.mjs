// Shared helpers for the kit's scripts: package manager, the skill's install path, and what verify needs
// (Playwright, axe-core, a browser). One copy, so install, check, verify and doctor always agree.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

// verify's own dependencies live here, inside the kit folder, so the project's package.json and lockfile stay untouched.
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
