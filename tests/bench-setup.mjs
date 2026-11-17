#!/usr/bin/env node
// Sets up the benchmark app: a copy of bench/app with this kit installed, ready for the prompts in tests/BENCHMARK.md.
//   node tests/bench-setup.mjs [target-dir] [--no-install] [--force]
// target-dir defaults to ../fluent-kit-bench next to this repo. Steps: copy the app, git init and commit it, npm install,
// install the kit from this checkout, record the app's existing rule findings as the kit's baseline (as a team adopting the
// kit would), commit. After a run: record it with tests/record-run.mjs (it scores the bench app by itself), then reset with
// git reset --hard && git clean -fd.
import { cpSync, existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const kit = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const target = resolve(args.find((a) => !a.startsWith("--")) || join(kit, "..", "fluent-kit-bench"));
const die = (m) => { console.error(`bench-setup: ${m}`); process.exit(1); };
const run = (cmd, a, cwd = target) => {
  const r = spawnSync(cmd, a, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) die(`${cmd} ${a.join(" ")} failed`);
};
const git = (...a) => run("git", ["-c", "user.name=fluent-kit bench", "-c", "user.email=bench@example.invalid", ...a]);

if (existsSync(target) && readdirSync(target).length && !args.includes("--force")) die(`${target} is not empty. Pass another folder, or --force to copy over it.`);
cpSync(join(kit, "bench", "app"), target, { recursive: true, filter: (src) => !/[\\/](node_modules|dist)([\\/]|$)/.test(src) });
if (!existsSync(join(target, ".git"))) run("git", ["init", "-q", "-b", "main"]);
git("add", "-A"); git("commit", "-qm", "bench app", "--allow-empty");
if (!args.includes("--no-install")) { run("npm", ["install", "--no-audit", "--no-fund"]); git("add", "-A"); git("commit", "-qm", "npm install", "--allow-empty"); }

const commit = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: kit, encoding: "utf8" }).stdout.trim() || "unknown";
run(process.execPath, [join(kit, "install.mjs"), target, "--no-cloud-setup"], kit);
run(process.execPath, [join(".fluent-kit", "scripts", "check.mjs"), ".", "--baseline"]);
git("add", "-A"); git("commit", "-qm", `kit ${commit}`);

const rec = relative(target, join(kit, "tests", "record-run.mjs")).replace(/\\/g, "/");
console.log(`
Bench app ready in ${target} (kit ${commit}).

Per run:
  1. Open the folder in your editor, start a fresh agent chat, paste one prompt from tests/BENCHMARK.md exactly. No follow-ups.
  2. node ${rec} --prompt 4 --run 1 --credits <n> --time <3m40s> --files-read <n> --route <y|n>
     (scores scope, uniform, correct and every state by itself; it starts the dev server for the browser check)
  3. git reset --hard && git clean -fd

The browser check needs Playwright once: node .fluent-kit/scripts/verify.mjs --setup`);
