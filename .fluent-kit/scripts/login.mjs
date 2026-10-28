#!/usr/bin/env node
// Fluent kit login helper: sign in once so `verify` can check pages behind a login.
// Usage: node .fluent-kit/scripts/login.mjs [url]      (default http://localhost:3000; start your dev server first)
// Opens the real Microsoft Edge with a profile folder (.verify-profile) kept in your project. Sign in, close the window, done.
// `verify` then uses that signed-in profile by itself. The folder holds your session: it is added to .gitignore, never commit it.
import { existsSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const url = process.argv.slice(2).find((a) => !a.startsWith("--")) || "http://localhost:3000";
const profile = resolve(".verify-profile");

const candidates = process.platform === "win32"
  ? [process.env["ProgramFiles(x86)"] + "\\Microsoft\\Edge\\Application\\msedge.exe", process.env.ProgramFiles + "\\Microsoft\\Edge\\Application\\msedge.exe"]
  : process.platform === "darwin" ? ["/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"]
  : ["/usr/bin/microsoft-edge", "/usr/bin/microsoft-edge-stable"];
const edge = candidates.find((p) => p && existsSync(p));
if (!edge) { console.error("Microsoft Edge was not found. Install Edge, then run this again."); process.exit(2); }

try { await fetch(url); } catch {
  console.error(`Nothing is running at ${url}. Start your dev server in another terminal (for example: npm run dev), then run this again.\nOther address? node .fluent-kit/scripts/login.mjs http://localhost:3001`);
  process.exit(2);
}

// Keep the session out of git.
const gi = resolve(".gitignore");
const line = ".verify-profile/";
try {
  const cur = existsSync(gi) ? readFileSync(gi, "utf8") : "";
  if (!cur.split(/\r?\n/).some((l) => l.trim() === line || l.trim() === ".verify-profile")) {
    if (existsSync(gi)) appendFileSync(gi, (cur.endsWith("\n") || !cur ? "" : "\n") + line + "\n"); else writeFileSync(gi, line + "\n");
    console.log("Added .verify-profile/ to .gitignore");
  }
} catch { console.log("Add .verify-profile/ to your .gitignore yourself."); }

spawn(edge, [`--user-data-dir=${profile}`, "--no-first-run", url], { detached: true, stdio: "ignore" }).unref();
console.log(`
Edge is opening ${url}.
1. Sign in until your app shows. Then pick the tenant, stage or customer that has real data (it is remembered, so verify sees the real page).
2. Close that Edge window (all of it).
Then run:  node .fluent-kit/scripts/verify.mjs --start /
It uses the signed-in profile by itself.`);
