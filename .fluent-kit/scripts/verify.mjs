#!/usr/bin/env node
// Fluent kit visual verification. Opens a page in a real browser and checks it.
// Usage: node .fluent-kit/scripts/verify.mjs --start /invoices          (starts the dev server itself, checks, stops it)
//        node .fluent-kit/scripts/verify.mjs http://localhost:3000/invoices   (dev server already running)
// Options: [--widths 1440,768,375] [--schemes light,dark] [--out .fluent-kit/out] [--wait <css selector>] [--no-axe]
//          [--start] [--cmd "npm run dev"]   --start runs the project's dev script (or --cmd) and waits for its URL; paths like /invoices are
//                                            then opened on it. Use it from agent terminals, where a long-running server blocks the terminal.
// Needs Playwright in the project (npm i -D playwright; npx playwright install chromium). For accessibility checks also: npm i -D axe-core
// Writes one screenshot per url x scheme x width, then LOOK AT THEM (open the PNG files) before reporting.
// Exit codes: 0 ok (warnings allowed), 1 problems found, 2 could not run (no Playwright, no browser, server or page did not load).
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const valueFlags = new Set(["--widths", "--schemes", "--out", "--wait", "--cmd"]);
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
  return text.replace(/\s+/g, " ").slice(0, 600);
}
if (!startServer && urls.some((u) => u.startsWith("/"))) { console.error("A path like /invoices needs --start (to run the dev server) or a full URL like http://localhost:3000/invoices."); process.exit(2); }
const widths = opt("--widths", "1440,768,375").split(",").map(Number);
const schemes = opt("--schemes", "light,dark").split(",");
const outDir = resolve(opt("--out", ".fluent-kit/out"));
const waitFor = opt("--wait", null);
const useAxe = !args.includes("--no-axe");

const req = createRequire(join(process.cwd(), "package.json"));
let pw = null;
for (const name of ["playwright", "@playwright/test", "playwright-core"]) { try { pw = req(name); break; } catch { /* next */ } }
if (!pw?.chromium) {
  console.error("Playwright is not installed in this project, so the page could not be checked.\nInstall it:  npm i -D playwright  &&  npx playwright install chromium\nThen run this script again. Until then say clearly that visual verification was NOT done.");
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
  }
  console.log(`Starting dev server: ${cmd}`);
  let log = "";
  server = spawn(cmd, { shell: true, cwd, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, BROWSER: "none", FORCE_COLOR: "0", NO_COLOR: "1" } });
  const ready = new Promise((resolveUrl) => {
    const onData = (d) => { log = (log + d.toString()).slice(-4000); const m = log.replace(/\x1b\[[0-9;]*m/g, "").match(/https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]):\d+/); if (m) resolveUrl(m[0]); };
    server.stdout.on("data", onData); server.stderr.on("data", onData);
    server.on("exit", (code) => resolveUrl(null, code));
    setTimeout(() => resolveUrl(null), 90000);
  });
  const base = await ready;
  if (!base) { console.error(`The dev server did not report a URL within 90 seconds.\nLast output:\n${log.slice(-800)}\nIf another dev server is already running (the log may say "port in use" or "already running"), pass its full URL instead, for example http://localhost:3000/your-page. Otherwise fix the server error. If you cannot verify, say that verification was NOT done.`); process.exit(2); }
  for (let i = 0; i < 60; i++) { try { await fetch(base); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
  urls = urls.map((u) => (u.startsWith("/") ? base + u : u));
  console.log(`Dev server ready at ${base}`);
}
let axeSource = null;
if (useAxe) { try { axeSource = readFileSync(req.resolve("axe-core/axe.min.js"), "utf8"); } catch { /* optional */ } }

mkdirSync(outDir, { recursive: true });
try { writeFileSync(join(outDir, ".gitignore"), "*\n"); } catch { /* ignore */ }

const problems = [];
const note = (level, where, msg) => problems.push({ level, where, msg });
const slug = (u) => u.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) || "page";

// Try the bundled Chromium, then Edge, then Chrome already installed on the machine.
let browser = null;
const launchErrors = [];
for (const o of [{}, { channel: "msedge" }, { channel: "chrome" }]) {
  try { browser = await pw.chromium.launch(o); break; } catch (e) { launchErrors.push(String(e).split("\n")[0]); }
}
if (!browser) {
  console.error("No browser could be started for the check.\n" + launchErrors.join("\n") + "\nInstall one:  npx playwright install chromium   (Microsoft Edge or Chrome on this machine also works).\nUntil then say clearly that visual verification was NOT done.");
  process.exit(2);
}
let loaded = 0;
for (const url of urls) {
  for (const scheme of schemes) {
    for (const width of widths) {
      const where = `${url} [${scheme}, ${width}px]`;
      const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme });
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
      loaded++;

      const info = await page.evaluate(() => {
        const prov = document.querySelector(".fui-FluentProvider");
        const cs = prov ? getComputedStyle(prov) : null;
        const lum = (rgb) => { const m = (rgb || "").match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
        const stray = [...document.querySelectorAll("button, input, select, textarea, a[href], table, dialog")].filter((el) => !el.closest("[class*='fui-']") && !(el.className && String(el.className).includes("fui-")));
        const tiny = [...document.querySelectorAll(".fui-Button, .fui-Link, .fui-Checkbox, .fui-Switch, .fui-Radio")].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 24 || r.width < 24); }).length;
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
          // Controls or headings cut off by a container with overflow hidden (content you cannot reach).
          clipped: [...document.querySelectorAll(".fui-Button, .fui-Link, .fui-Input, h1, h2, h3, .fui-Text")].filter((el) => {
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) return false;
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
      if (info.clipped.length) note("error", where, `Content is cut off by its container: ${info.clipped.join("; ")}. Let it wrap or move it into an overflow menu at this width.`);
      if (info.hscroll) note("warn", where, `${info.hscroll} container(s) scroll sideways at this width. Check that the identifying column and the status stay on screen (hide or move less important columns, or use a list).`);
      if (info.emptyBody) note("error", where, "The page is empty.");
      if (info.strayCount) note("warn", where, `${info.strayCount} control(s) are not Fluent components: ${info.stray.join("; ")}`);
      if (info.tiny) note("warn", where, `${info.tiny} Fluent control(s) smaller than 24px. Check touch targets.`);
      if (scheme === "dark" && info.bgLum !== null && info.bgLum > 0.5) note("warn", where, "The browser asks for dark mode but the app stayed light. Fine if the app has a manual theme switch; otherwise follow the system scheme.");
      // Fluent's focus helper (tabster) can insert hidden <i data-tabster-dummy> elements before React hydrates a
      // page chunk. React then reports a mismatch whose only server-side difference is those helpers. It is a known
      // Fluent + Next.js timing issue, not a mistake in the page, so it is a warning, not an error.
      const isTabsterOnly = tabsterOnly;
      const real = errors.filter((e) => !isTabsterOnly(e));
      const tab = errors.filter(isTabsterOnly);
      if (real.length) note("error", where, `Console errors: ${[...new Set(real)].slice(0, 3).join(" | ")}`);
      if (tab.length) note("warn", where, "Hydration warning caused only by Fluent's tabster focus helpers (<i data-tabster-dummy>) inserted before React hydrated. Known Fluent + Next.js timing issue, not caused by this page; do not rewrite the page for it. Confirm it also appears (or not) in a production build before spending time on it.");

      if (axeSource) {
        try {
          await page.evaluate(axeSource);
          const res = await page.evaluate(async () => { const r = await window.axe.run({ exclude: [["[data-tabster-dummy]"]] }, { resultTypes: ["violations"] }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, target: v.nodes[0]?.target?.join(" "), html: (v.nodes[0]?.html || "").replace(/\s+/g, " ").slice(0, 160) })); });
          for (const v of res) note(v.impact === "critical" || v.impact === "serious" ? "error" : "warn", where, `Accessibility [${v.id}] ${v.help} (${v.nodes} element(s), e.g. ${v.target}${v.html ? ` , html: ${v.html}` : ""})`);
        } catch (e) { note("warn", where, `axe could not run: ${String(e).split("\n")[0]}`); }
      }

      const file = join(outDir, `${slug(url)}-${scheme}-${width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      await ctx.close();
    }
  }
}
await browser.close();

if (!axeSource && useAxe) problems.push({ level: "warn", where: "setup", msg: "axe-core is not installed, so accessibility was not checked automatically. npm i -D axe-core" });
// Same problem at several widths or schemes is reported once, with the list of places.
const groups = new Map();
for (const p of problems) {
  const k = p.level + "|" + p.msg;
  if (!groups.has(k)) groups.set(k, { level: p.level, msg: p.msg, where: [] });
  groups.get(k).where.push(p.where);
}
const uniq = [...groups.values()];
for (const g of uniq) {
  const w = g.where.length > 3 ? `${g.where.length} of ${loaded} renders` : g.where.join(", ");
  console.log(`${g.level === "error" ? "ERROR" : "warn "}  ${g.msg}\n       at: ${w}`);
}
const errs = uniq.filter((p) => p.level === "error").length;
console.log(`\nfluent-kit verify: ${loaded} renders, ${errs} error(s), ${uniq.length - errs} warning(s). Screenshots: ${outDir}`);
console.log("Open the screenshots and review them against .fluent-kit/DESIGNER.md section 8 before reporting.");
if (rawErrors.length) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "console-errors.txt"), [...new Set(rawErrors)].join("\n\n----\n\n"));
  console.log(`Full console errors (unshortened): ${join(outDir, "console-errors.txt")}`);
}
process.exit(errs ? 1 : 0);
