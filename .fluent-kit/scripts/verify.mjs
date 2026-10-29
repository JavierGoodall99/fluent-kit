#!/usr/bin/env node
// Fluent kit visual verification. Opens a page in a real browser and checks it.
// Usage: node .fluent-kit/scripts/verify.mjs --start /invoices          (starts the dev server itself, checks, stops it)
//        node .fluent-kit/scripts/verify.mjs http://localhost:3000/invoices   (dev server already running)
// Options: default 1440 and 375px, light. [--full] (1440, 768 and 375px, light and dark: new pages, shells, overlays)
//          [--widths 1440,768,375] [--schemes light,dark] [--out .fluent-kit/out] [--wait <css selector>] [--no-axe]   (--quick is accepted and is the default)
//          [--start] [--cmd "npm run dev"]   --start runs the project's dev script (or --cmd) and waits for its URL; paths like /invoices are
//                                            then opened on it. Use it from agent terminals, where a long-running server blocks the terminal.
//          [--storage auth.json]   a Playwright storage state (saved with: npx playwright codegen --save-storage=auth.json <url>) so pages behind a login can be checked.
//          [--profile .verify-profile]   use the real Microsoft Edge with this profile folder (kept between runs). For apps whose login needs Edge, a work device policy or an SSO extension: sign in once in that Edge profile (see below) and it stays signed in. Add --headed to watch it.
//          [--click "role=button[name='New task']"]   after the normal check, click this (several steps separated by ;), then check and screenshot that state too (-open.png).
//                                            Use it for drawers, dialogs, menus and pickers: the page alone never shows them.
// Needs Playwright in the project (npm i -D playwright; npx playwright install chromium). For accessibility checks also: npm i -D axe-core
// (or @axe-core/playwright). Writes screenshots plus one contact-sheet.png of every first screen; it names the screenshot to open
// next to each problem, so look at the contact sheet once and open other files only when a problem points to them.
// Exit codes: 0 ok (warnings allowed), 1 problems found, 2 could not run (no Playwright, no browser, server or page did not load).
import { createRequire } from "node:module";
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const valueFlags = new Set(["--widths", "--schemes", "--out", "--wait", "--cmd", "--click", "--storage", "--profile"]);
if (args.includes("--help") || args.includes("-h")) { console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.replace(/^\/\/ ?/, "")).join("\n")); process.exit(0); }
const startServer = args.includes("--start") || args.includes("--cmd");
let urls = args.filter((a, i) => !a.startsWith("--") && !valueFlags.has(args[i - 1]));
if (startServer && !urls.length) urls = ["/"];
if (!urls.length) { console.error("Usage: node .fluent-kit/scripts/verify.mjs --start /path   or   node .fluent-kit/scripts/verify.mjs <url>"); process.exit(2); }

// Console errors, shortened. A React hydration error carries a long boilerplate list and then the part that
// matters (the diff of server vs client markup); keep the first sentence and the diff lines, drop the list.
// True when every server-side ("-") line of a hydration diff belongs to a tabster helper element.
function tabsterOnly(e) {
  if (!/Hydration failed/i.test(e) || !/data-tabster-dummy/.test(e)) return false;
  const parts = e.split("| diff:")[1];
  if (!parts) return false;
  const server = parts.split(" ; ").map((l) => l.trim()).filter((l) => /^-\s/.test(l));
  const helper = /^-\s+(<i\b|<\/i>|>|tabindex=|role=|data-tabster|aria-hidden=|style=)/;
  return server.length > 0 && server.every((l) => helper.test(l));
}
const rawErrors = [];
function shortError(text) {
  rawErrors.push(text);
  if (/hydrat|didn't match/i.test(text)) {
    const lines = text.split("\n").map((l) => l.trimEnd());
    const first = lines[0].replace(/\s+/g, " ").slice(0, 160);
    const isDelta = (l) => /^\s*[+-] /.test(l) && !/^\s*- (A|Variable|Date|External|Invalid|It) /.test(l);
    const delta = lines.filter(isDelta).slice(0, 40).map((l) => l.trim().slice(0, 160));
    const ctx = lines.filter((l) => !isDelta(l) && /^\s*<[A-Za-z]/.test(l)).slice(-4).map((l) => l.trim().slice(0, 120));
    const diff = delta.length ? [...delta, "context:", ...ctx] : ctx;
    return diff.length ? `${first} | diff: ${diff.join(" ; ")}` : text.replace(/\s+/g, " ").slice(0, 1200);
  }
  if (/Minified React error #(418|423|425)\b/.test(text)) {
    return text.replace(/\s+/g, " ").slice(0, 200) + " | This is a React hydration mismatch from a production build; the message is stripped, so the element is unknown. Run verify against a dev server (--start) to get the diff. If that diff is only <i data-tabster-dummy>, it is the known Fluent focus-helper issue.";
  }
  return text.replace(/\s+/g, " ").slice(0, 600);
}
if (!startServer && urls.some((u) => u.startsWith("/"))) { console.error("A path like /invoices needs --start (to run the dev server) or a full URL like http://localhost:3000/invoices."); process.exit(2); }
const full = args.includes("--full"); // default is the fast pass (1440 and 375, light); --full adds 768 and dark
const widths = opt("--widths", full ? "1440,768,375" : "1440,375").split(",").map(Number);
const schemes = opt("--schemes", full ? "light,dark" : "light").split(",");
const outDir = resolve(opt("--out", ".fluent-kit/out"));
const ANSI = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g"); // terminal colour codes in dev-server output
// One line per call in verify-runs.jsonl (also calls that stop early), so a benchmark can count how often the agent verified.
const runLog = { at: new Date().toISOString(), args, renders: 0, errors: null, warnings: null };
process.on("exit", (code) => {
  try { mkdirSync(outDir, { recursive: true }); appendFileSync(join(outDir, "verify-runs.jsonl"), JSON.stringify({ ...runLog, exitCode: code, ms: Date.now() - Date.parse(runLog.at) }) + "\n"); } catch { /* never block the exit */ }
});
const waitFor = opt("--wait", null);
const clickSteps = (opt("--click", "") || "").split(";").map((x) => x.trim()).filter(Boolean);
const useAxe = !args.includes("--no-axe");
const storagePath = opt("--storage", null);
const profileDir = opt("--profile", null) ? resolve(opt("--profile")) : (!storagePath && existsSync(resolve(".verify-profile"))) ? resolve(".verify-profile") : null; // a .verify-profile folder in the project is used automatically
if (profileDir && !opt("--profile", null)) console.log("Using the signed-in Edge profile .verify-profile");

const req = createRequire(join(process.cwd(), "package.json"));
let pw = null;
for (const name of ["playwright", "@playwright/test", "playwright-core"]) { try { pw = req(name); break; } catch { /* next */ } }
if (!pw?.chromium) {
  console.error("fluent-kit verify: NOT RUN, Playwright is not installed. Fix once: npm i -D playwright axe-core && npx playwright install chromium (or re-run the kit installer with --with-deps). Do not retry before that; say in your reply that the UI was not verified.");
  process.exit(2);
}
// Optionally start the dev server, wait for its URL, and stop it when we are done.
let server = null;
const stopServer = () => {
  if (!server) return;
  try { if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"]); else process.kill(-server.pid); } catch { /* already gone */ }
  server = null;
};
process.on("exit", stopServer);
process.on("SIGINT", () => process.exit(130));
if (startServer) {
  const cwd = process.cwd();
  let cmd = opt("--cmd", null);
  if (!cmd) {
    let dev = null; try { dev = JSON.parse(readFileSync(join(cwd, "package.json"), "utf8")).scripts?.dev; } catch { /* none */ }
    if (!dev) { console.error("No \"dev\" script in package.json. Pass the command with --cmd \"...\", or start the server yourself and pass a full URL."); process.exit(2); }
    cmd = existsSync(join(cwd, "pnpm-lock.yaml")) ? "pnpm run dev" : existsSync(join(cwd, "yarn.lock")) ? "yarn dev" : (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) ? "bun run dev" : "npm run dev";
    // The agent's shell may not have the package manager the lockfile points to (bun on a Windows PATH, say): fall back to npm, which runs the same "dev" script.
    const pm = cmd.split(" ")[0];
    if (pm !== "npm" && spawnSync(pm, ["--version"], { shell: true, stdio: "ignore" }).status !== 0) {
      if (spawnSync("npm", ["--version"], { shell: true, stdio: "ignore" }).status !== 0) { console.error(`${pm} is not available in this shell, and neither is npm. Start the dev server yourself and pass its full URL, or pass --cmd "<your dev command>". If you cannot verify, say that verification was NOT done.`); process.exit(2); }
      console.log(`Note: ${pm} is not available in this shell; running the dev script with npm instead.`);
      cmd = "npm run dev";
    }
  }
  console.log(`Starting dev server: ${cmd}`);
  let log = "";
  let exited = false;
  server = spawn(cmd, { shell: true, cwd, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, BROWSER: "none", FORCE_COLOR: "0", NO_COLOR: "1" } });
  const ready = new Promise((resolveUrl) => {
    let timer = null, noted = null; // the busy-port note is printed once per URL, not once per chunk of server output
    const onData = (d) => {
      log = (log + d.toString()).slice(-4000);
      const clean = log.replace(ANSI, "");
      const all = clean.match(/https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):\d+/g);
      if (!all) return;
      // If the port was busy the server says so and then prints the port it really uses: wait a moment and take the last URL.
      const busy = /in use|already|trying|instead/i.test(clean);
      clearTimeout(timer); timer = setTimeout(() => resolveUrl(all[all.length - 1]), busy ? 2500 : 0);
      if (busy && noted !== all[all.length - 1]) { noted = all[all.length - 1]; console.log("Note: the dev server reported a busy port. Using " + noted + " (another project may be using the default port). Check the heading printed below against the page you asked for before you trust the run."); }
    };
    server.stdout.on("data", onData); server.stderr.on("data", onData);
    server.on("exit", () => {
      exited = true;
      // The dev server stopped at once, often because one is already running for this project ("another instance is already running"
      // and it prints that server's URL). Use that URL instead of failing.
      const all = log.replace(ANSI, "").match(/https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):\d+/g);
      if (all) { console.log("Note: the dev server did not start a new instance; using the one already running at " + all[all.length - 1] + "."); resolveUrl(all[all.length - 1]); } else resolveUrl(null);
    });
    setTimeout(() => resolveUrl(null), 90000);
  });
  const base = await ready;
  if (!base) { console.error(`${exited ? "The dev server exited without printing a localhost URL." : "The dev server did not report a URL within 90 seconds."}\nLast output:\n${log.slice(-800)}\nIf another dev server is already running (the log may say "port in use" or "already running"), pass its full URL instead, for example http://localhost:3000/your-page. Otherwise fix the server error. If you cannot verify, say that verification was NOT done.`); process.exit(2); }
  for (let i = 0; i < 60; i++) { try { await fetch(base); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  urls = urls.map((u) => (u.startsWith("/") ? base + u : u));
  console.log(`Dev server ready at ${base}`);
}
let axeSource = null;
if (useAxe) {
  try { axeSource = readFileSync(req.resolve("axe-core/axe.min.js"), "utf8"); }
  catch { try { axeSource = readFileSync(createRequire(req.resolve("@axe-core/playwright")).resolve("axe-core/axe.min.js"), "utf8"); } catch { /* optional */ } }
}

mkdirSync(outDir, { recursive: true });
try { writeFileSync(join(outDir, ".gitignore"), "*\n"); } catch { /* ignore */ }

const problems = [];
// Known app-wide issues the team accepted (for example one in the app shell) can be listed in .fluent-kit/verify-ignore.json as an array of
// text fragments, such as ["scrollable-region-focusable", "landmark-no-duplicate-main"]. Matching messages are not reported.
let ignoreList = [];
try { const f = resolve(".fluent-kit/verify-ignore.json"); if (existsSync(f)) ignoreList = JSON.parse(readFileSync(f, "utf8")).filter((x) => typeof x === "string"); } catch { /* ignore */ }
const note = (level, where, msg) => { if (ignoreList.some((x) => msg.includes(x))) return; problems.push({ level, where, msg }); };
const shots = [];
const shotFor = new Map(); // render label -> the screenshot that shows it
const firstShots = []; // [label, file] for the contact sheet
const slug = (u) => u.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "page";

// Try the bundled Chromium, then Edge, then Chrome already installed on the machine.
let browser = null;
const launchErrors = [];
if (profileDir) browser = { newContext: async (o) => { try { return await pw.chromium.launchPersistentContext(profileDir, { channel: "msedge", headless: !args.includes("--headed"), ...o }); } catch (e) { console.error("Edge could not start with the profile " + profileDir + ".\nMost likely an Edge window is still open on that profile: close it (PowerShell: Get-CimInstance Win32_Process -Filter \"name='msedge.exe'\" | Where-Object CommandLine -match 'verify-profile' | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }) and run again.\nIf it still fails, try --headed.\n" + String(e).split("\n")[0]); process.exit(2); } }, close: async () => {} };
for (const o of profileDir ? [] : [{}, { channel: "msedge" }, { channel: "chrome" }]) {
  try { browser = await pw.chromium.launch(o); break; } catch (e) { launchErrors.push(String(e).split("\n")[0]); }
}
if (!browser) {
  console.error("fluent-kit verify: NOT RUN, no browser could start (" + (launchErrors[0] || "unknown error").slice(0, 160) + "). Fix once: npx playwright install chromium (Edge or Chrome on this machine also works). Do not retry before that; say in your reply that the UI was not verified.");
  process.exit(2);
}
let loaded = 0;
async function runAxe(page, where) {
  if (!axeSource) return;
  try {
    await page.evaluate(axeSource);
    const res = await page.evaluate(async () => { const r = await window.axe.run({ exclude: [["[data-tabster-dummy]"]] }, { resultTypes: ["violations"] }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, target: v.nodes[0]?.target?.join(" "), html: (v.nodes[0]?.html || "").replace(/\s+/g, " ").slice(0, 160) })); });
    for (const v of res) note(v.impact === "critical" || v.impact === "serious" ? "error" : "warn", where, `Accessibility [${v.id}] ${v.help} (${v.nodes} element(s), e.g. ${v.target}${v.html ? ` , html: ${v.html}` : ""})`);
  } catch (e) { note("warn", where, `axe could not run: ${String(e).split("\n")[0]}`); }
}

for (const url of urls) {
  for (const scheme of schemes) {
    for (const width of widths) {
      const where = `${url} [${scheme}, ${width}px]`;
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, ...(storagePath ? { storageState: storagePath } : {}) });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(shortError(String(e))));
      page.on("console", (m) => { if (m.type() === "error") errors.push(shortError(m.text())); });
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      } catch (e) {
        console.error(`Could not open ${url}: ${String(e).split("\n")[0]}\nIs the dev server running?`);
        await ctx.close(); await browser.close(); process.exit(2);
      }
      if (waitFor) { try { await page.waitForSelector(waitFor, { timeout: 10000 }); } catch { note("error", where, `Selector '${waitFor}' never appeared.`); } }
      await page.waitForTimeout(500);
      // Do not photograph a loading state: wait until skeletons, spinners and aria-busy regions are gone.
      try { await page.waitForFunction(() => !document.querySelector(".fui-Skeleton, .fui-Spinner, [aria-busy='true']"), undefined, { timeout: 8000 }); await page.waitForTimeout(200); }
      catch { note("warn", where, "Still showing a loading state (skeleton, spinner or aria-busy) after 8 seconds, so the screenshots show loading, not content. Use --wait \"<selector of the loaded content>\" or check that the data loads."); }
      loaded++;

      const pageTitle = await page.title();
      // The tab title is often fixed in index.html and says nothing about the view: also print the page's own heading and URL.
      const heading = await page.evaluate(() => (document.querySelector("h1, [role=heading][aria-level='1']") || document.querySelector("h2"))?.textContent?.trim().slice(0, 60) || "");
      console.log(`  ${where}: heading "${heading}"  (tab title "${pageTitle.slice(0, 40)}")`);
      if (/sign in|log ?in|inloggen|aanmelden/i.test(pageTitle) || /login\.microsoftonline|login\.live/.test(page.url())) note("error", where, "This is a sign-in page, not your app, so nothing here was really checked. Run once: node .fluent-kit/scripts/login.mjs (README: Pages behind a login), then run verify again.");
      const info = await page.evaluate(() => {
        const prov = document.querySelector(".fui-FluentProvider");
        const cs = prov ? getComputedStyle(prov) : null;
        const lum = (rgb) => { const m = (rgb || "").match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        const stray = [...document.querySelectorAll("button, input, select, textarea, a[href], table, dialog")].filter((el) => !el.closest("[class*='fui-']") && !(el.className && String(el.className).includes("fui-")));
        const tiny = [...document.querySelectorAll(".fui-Button, .fui-Link, .fui-Checkbox, .fui-Switch, .fui-Radio")].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24); }).map((el) => { const r = el.getBoundingClientRect(); return `<${el.tagName.toLowerCase()}> "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}px`; });
        return {
          provider: !!prov,
          font: cs?.fontFamily || null,
          bgLum: lum(cs?.backgroundColor),
          bodyBgLum: lum(getComputedStyle(document.body).backgroundColor),
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          stray: stray.slice(0, 5).map((el) => `<${el.tagName.toLowerCase()}> ${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}`),
          strayCount: stray.length,
          tiny,
          emptyBody: document.body.innerText.trim().length === 0,
          // Containers that scroll sideways: on a narrow screen the part that is off-screen can hide the key column.
          hscroll: window.innerWidth <= 480 ? [...document.querySelectorAll("div, section, main, table")].filter((el) => { const o = getComputedStyle(el); const r = el.getBoundingClientRect(); return /(auto|scroll)/.test(o.overflowX) && el.scrollWidth > el.clientWidth + 1 && r.width > 0 && r.height > 0; }).length : 0,
          // Space under the last content in the scrolling area: a card that ends flush with the window edge looks cut off.
          bottomGap: (() => {
            const se = document.scrollingElement;
            let c = se, best = se ? se.scrollHeight - se.clientHeight : 0;
            for (const el of document.querySelectorAll("div, main, section")) { if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY)) continue; const ex = el.scrollHeight - el.clientHeight; if (ex > best) { best = ex; c = el; } }
            if (!c || best < 40) return null;
            const top = c === se ? -c.scrollTop : c.getBoundingClientRect().top - c.scrollTop;
            let bottom = 0;
            for (const el of c.querySelectorAll("*")) { const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue; const cs = getComputedStyle(el); if (cs.position === "fixed" || cs.visibility === "hidden") continue;
              if (r.height >= 0.9 * c.scrollHeight) continue; // a wrapper around the whole page: its bottom padding is the gap being measured
              bottom = Math.max(bottom, r.bottom - top); }
            return Math.round(c.scrollHeight - bottom);
          })(),
          // Cards that blend in: three or more panels in one row/group that are only a thin outline on the same colour as the page behind them.
          flatCards: (() => {
            const bgOf = (el) => { for (let a = el; a; a = a.parentElement) { const c = getComputedStyle(a).backgroundColor; if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c; } return "rgb(255, 255, 255)"; };
            const groups = new Map();
            for (const el of document.querySelectorAll("div, section, article")) {
              const r = el.getBoundingClientRect(); if (r.width < 140 || r.height < 60 || r.height > 420 || r.width > window.innerWidth * 0.6) continue;
              const cs = getComputedStyle(el);
              if (cs.boxShadow !== "none" || !(parseFloat(cs.borderTopWidth) > 0) || cs.borderTopStyle === "none") continue;
              if (el.querySelector("input, select, textarea, table, [role=grid], [role=combobox]")) continue;
              const parent = el.parentElement; if (!parent || !parent.parentElement) continue;
              if (bgOf(el) !== bgOf(parent)) continue; // different fill from the page behind it: it stands out
              groups.set(parent, (groups.get(parent) || 0) + 1);
            }
            return [...groups.values()].filter((n) => n >= 3).length ? Math.max(...groups.values()) : 0;
          })(),
          // First glance: how much reading the first screen asks for, and text blocks that repeat.
          firstWords: (() => { let n = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let t = w.nextNode(); t; t = w.nextNode()) { const el = t.parentElement; if (!el || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(el.tagName)) continue; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); if (!r.width || !r.height || cs.visibility === "hidden" || cs.display === "none" || r.top >= window.innerHeight || r.bottom <= 0) continue; n += (t.textContent.trim().match(/\S+/g) || []).length; } return n; })(),
          repeated: (() => { const m = new Map(); for (const el of document.querySelectorAll("p, span, div, td, li, pre, code")) { if (el.children.length) continue; const t = (el.textContent || "").replace(/\s+/g, " ").trim(); if (t.length < 70) continue; const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue; m.set(t, (m.get(t) || 0) + 1); } return [...m].filter(([, c]) => c >= 3).slice(0, 2).map(([t, c]) => `"${t.slice(0, 50)}..." x${c}`); })(),
          // Reading text that runs far across a wide window: lines over about 100 characters are hard to read.
          longlines: window.innerWidth >= 768 ? [...document.querySelectorAll("p, span, div, code, pre, li, td")].filter((el) => {
            const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
            if (own.length < 100) return false;
            const r = el.getBoundingClientRect(); if (!r.width || !r.height) return false;
            const cs = getComputedStyle(el); const mono = /mono|consolas|courier/i.test(cs.fontFamily);
            return r.width / (parseFloat(cs.fontSize) * (mono ? 0.6 : 0.5)) > 100;
          }).slice(0, 3).map((el) => `"${(el.textContent || "").trim().slice(0, 28)}..." (${Math.round(el.getBoundingClientRect().width)}px wide)`) : [],
          // Controls or headings cut off by a container with overflow hidden (content you cannot reach).
          clipped: [...document.querySelectorAll(".fui-Button, .fui-Link, .fui-Input, h1, h2, h3, .fui-Text")].filter((el) => {
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) return false;
            if (r.right <= 0 || r.left >= window.innerWidth) return false; // fully off screen on purpose (a closed drawer), not cut off
            const own = getComputedStyle(el);
            if (el.scrollWidth > el.clientWidth + 1 && /(hidden|clip)/.test(own.overflowX) && own.textOverflow !== "ellipsis") return true;
            for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
              const o = getComputedStyle(a);
              if (/(auto|scroll)/.test(o.overflowX)) return false;
              if (/(hidden|clip)/.test(o.overflowX)) { const ar = a.getBoundingClientRect(); if (r.right > ar.right + 1 || r.left < ar.left - 1) return true; }
            }
            return false;
          }).slice(0, 4).map((el) => `<${el.tagName.toLowerCase()}> ${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24)}`),
        };
      });
      if (!info.provider) note("error", where, "No FluentProvider on the page. Fluent components will be unstyled. Wrap the app in FluentProvider with the project theme.");
      if (info.provider && info.font && !/Segoe UI/i.test(info.font)) note("warn", where, `Page font is '${info.font.slice(0, 50)}', not Segoe UI. Use the theme's font (tokens.fontFamilyBase).`);
      if (info.overflow > 1) note("error", where, `Page scrolls sideways (${info.overflow}px wider than the window). Fix the layout for this width.`);
      if (info.longlines.length) note("warn", where, `Text lines are too long to read comfortably (over about 100 characters across): ${info.longlines.join("; ")}. Cap the text width (max-width around 70 to 80ch, tokens for spacing) and let the card or page be wider than the text.`);
      if (info.clipped.length) note("error", where, `Content is cut off by its container: ${info.clipped.join("; ")}. Let it wrap or move it into an overflow menu at this width.`);
      if (info.hscroll) note("warn", where, `${info.hscroll} container(s) scroll sideways at this width. Check that the identifying column and the status stay on screen (hide or move less important columns, or use a list).`);
      if (info.emptyBody) note("error", where, "The page is empty.");
      if (info.bottomGap !== null && info.bottomGap < 8) note("warn", where, `The last content ends ${Math.max(info.bottomGap, 0)}px from the bottom of the scrolling area, so cards look cut off at the end. Add space below the page content (padding-bottom: tokens.spacingVerticalXL, or the page wrapper's bottom padding).`);
      if (info.flatCards) note("warn", where, `${info.flatCards} cards in a row are only a thin outline on the same colour as the page, so they blend in. Put the page area on tokens.colorNeutralBackground2 and the cards on tokens.colorNeutralBackground1 with tokens.shadow4 and tokens.borderRadiusXLarge (8px), see deviations.md "Surfaces".`);
      if (info.firstWords > 220) note("warn", where, `The first screen holds about ${info.firstWords} words. Someone should grasp the page in five seconds: put a one-line verdict and the key numbers first, and move detail behind a click or below the fold.`);
      if (info.repeated.length) note("warn", where, `The same long text appears 3 or more times: ${info.repeated.join("; ")}. In one table or list, group repeats and show the text once with the names it applies to. If each item is its own card, repeats are fine: keep them clamped (about 3 lines) with "Show more".`);
      if (info.strayCount) note("warn", where, `${info.strayCount} control(s) are not Fluent components: ${info.stray.join("; ")}`);
      if (info.tiny.length) note("warn", where, `${info.tiny.length} Fluent control(s) smaller than 24px: ${info.tiny.slice(0, 4).join("; ")}. Make them at least 24px (32px on touch) or use a larger size.`);
      if (scheme === "dark" && info.bgLum !== null && info.bgLum > 0.5) note("warn", where, "The browser asks for dark mode but the app stayed light. Fine if the app has a manual theme switch; otherwise follow the system scheme.");
      // Fluent's focus helper (tabster) can insert hidden <i data-tabster-dummy> elements before React hydrates a
      // page chunk. React then reports a mismatch whose only server-side difference is those helpers. It is a known
      // Fluent + Next.js timing issue, not a mistake in the page, so it is a warning, not an error.
      const isTabsterOnly = tabsterOnly;
      const real = errors.filter((e) => !isTabsterOnly(e));
      const tab = errors.filter(isTabsterOnly);
      if (real.length) note("error", where, `Console errors: ${[...new Set(real)].slice(0, 3).join(" | ")}`);
      if (tab.length) note("warn", where, "Hydration warning caused only by Fluent's tabster focus helpers (<i data-tabster-dummy>) inserted before React hydrated. Known Fluent + Next.js timing issue, not caused by this page; do not rewrite the page for it. Confirm it also appears (or not) in a production build before spending time on it.");

      await runAxe(page, where);

      const file = join(outDir, `${slug(url)}-${scheme}-${width}.png`);
      const firstFile = file.replace(/\.png$/, "-first.png");
      await page.screenshot({ path: firstFile });
      // Apps with their own scrolling area (a fixed shell with a scrolling <main>) make a "full page" screenshot show only the first screen.
      // Grow the window to the height of the biggest scrolling area so the whole page is in the picture.
      try {
        const extra = await page.evaluate(() => { let best = 0; for (const el of document.querySelectorAll("div, main, section")) { const o = getComputedStyle(el).overflowY; if (/(auto|scroll)/.test(o) && el.scrollHeight > el.clientHeight + 40) best = Math.max(best, el.scrollHeight - el.clientHeight); } return best; });
        if (extra > 0) { await page.setViewportSize({ width, height: Math.min(900 + extra, 7000) }); await page.waitForTimeout(400); }
      } catch { /* screenshot as is */ }
      await page.screenshot({ path: file, fullPage: true });
      shots.push(file, firstFile);
      shotFor.set(where, file);
      if (scheme === schemes[0]) firstShots.push([where, firstFile]); // the sheet shows one scheme; problems in others still name their file
      // --click: open what is behind a button (drawer, dialog, menu, picker) and check that state too.
      if (clickSteps.length) {
        let opened = true;
        for (const step of clickSteps) {
          try { await page.locator(step).first().click({ timeout: 5000 }); await page.waitForTimeout(600); }
          catch { note("error", where, `--click '${step}' could not be clicked within 5 seconds (not on the page, covered, or disabled: a button that needs a selected row stays disabled until you add that click first, for example --click "role=checkbox[name='Row 1'];role=button[name='Delete']"). Use a Playwright selector such as "role=button[name='New task']" or "text=New task".`); opened = false; break; }
        }
        if (opened) {
          shotFor.set(`${where} after clicking ${clickSteps.join(" then ")}`, file.replace(/\.png$/, "-open.png"));
          await runAxe(page, `${where} after clicking ${clickSteps.join(" then ")}`);
          await page.screenshot({ path: file.replace(/\.png$/, "-open.png") });
          shots.push(file.replace(/\.png$/, "-open.png"));
          if (scheme === schemes[0]) firstShots.push([`${where} after click`, file.replace(/\.png$/, "-open.png")]);
        }
      }
      await ctx.close();
    }
  }
}
// One contact sheet of every first screen, so one image shows all renders.
let sheet = null;
if (firstShots.length) {
  try {
    const tiles = firstShots.map(([label, f]) => `<figure><img src="data:image/png;base64,${readFileSync(f).toString("base64")}"><figcaption>${label.replace(/[<>&]/g, "")}</figcaption></figure>`).join("");
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    const pg = await ctx.newPage();
    await pg.setContent(`<style>body{margin:0;padding:8px;font:12px sans-serif;background:#ddd}main{display:inline-flex;flex-wrap:wrap;max-width:1584px;gap:8px;align-items:flex-start}figure{margin:0}img{height:${firstShots.length > 2 ? 480 : 560}px;display:block;border:1px solid #999}</style><main>${tiles}</main>`);
    sheet = join(outDir, "contact-sheet.png");
    await (await pg.$("main")).screenshot({ path: sheet });
    await ctx.close();
  } catch { sheet = null; }
}
await browser.close();

if (!axeSource && useAxe) problems.push({ level: "warn", where: "setup", msg: "axe-core is not installed, so accessibility was not checked. npm i -D axe-core" });
// Same problem at several widths or schemes is reported once, with the list of places and the screenshot to open.
const groups = new Map();
for (const p of problems) {
  const k = p.level + "|" + p.msg;
  if (!groups.has(k)) groups.set(k, { level: p.level, msg: p.msg, where: [] });
  groups.get(k).where.push(p.where);
}
const uniq = [...groups.values()];
for (const g of uniq) {
  const w = g.where.length > 3 ? `${g.where.length} checks across ${loaded} renders` : g.where.join(", ");
  const shot = g.where.map((x) => shotFor.get(x)).find(Boolean);
  console.log(`${g.level === "error" ? "ERROR" : "warn "}  ${g.msg}\n       at: ${w}${shot ? `\n       open: ${shot}` : ""}`);
}
const errs = uniq.filter((p) => p.level === "error").length;
Object.assign(runLog, { renders: loaded, errors: errs, warnings: uniq.length - errs });
try { writeFileSync(join(outDir, "verify-report.json"), JSON.stringify({ at: runLog.at, args, renders: loaded, errors: errs, warnings: uniq.length - errs, problems: uniq, contactSheet: sheet, screenshots: shots }, null, 2) + "\n"); } catch { /* report is optional */ }
console.log(`\nfluent-kit verify: ${loaded} renders, ${errs} error(s), ${uniq.length - errs} warning(s).`);
if (sheet) console.log(`Look once at ${sheet} (every first screen and opened state in one image). Open another screenshot only where a problem above says "open:". All files: ${outDir}`);
else console.log(`Screenshots: ${outDir}. Open the 1440px *-first.png once, and other files only where a problem above says "open:".`);
console.log(`Critique before you report (one line each in your head, fix what fails):
  1. Five seconds: what is this page, is anything wrong, what do I do next? (verdict and key numbers on the first screen)
  2. Squint: is the main thing still obvious, with a clear second level?
  3. Remove one: does any element do nothing? Leave it out.
  4. Stranger: does every label make sense without knowing the code?
  5. Same as the rest: does it match the nearest existing page (cards, header, spacing, wording)?`);
if (rawErrors.length) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "console-errors.txt"), [...new Set(rawErrors)].join("\n\n----\n\n"));
  console.log(`Full console errors (unshortened): ${join(outDir, "console-errors.txt")}`);
}
process.exit(errs ? 1 : 0);
