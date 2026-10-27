#!/usr/bin/env node
// Fluent kit visual verification. Opens a running page in a real browser and checks it.
// Usage: node .fluent-kit/scripts/verify.mjs <url> [<url> ...] [--widths 1440,768,375] [--schemes light,dark]
//                                            [--out .fluent-kit/out] [--wait <css selector>] [--no-axe]
// Needs the dev server to be running, and Playwright in the project (npm i -D playwright; npx playwright install chromium).
// For accessibility checks also: npm i -D axe-core
// Writes one screenshot per url x scheme x width, then LOOK AT THEM (open the PNG files) before reporting.
// Exit codes: 0 ok (warnings allowed), 1 problems found, 2 could not run (no Playwright, page did not load).
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const valueFlags = new Set(["--widths", "--schemes", "--out", "--wait"]);
const urls = args.filter((a, i) => !a.startsWith("--") && !valueFlags.has(args[i - 1]));
if (!urls.length) { console.error("Usage: node .fluent-kit/scripts/verify.mjs <url> [--widths 1440,768,375] [--schemes light,dark]"); process.exit(2); }
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
      page.on("pageerror", (e) => errors.push(String(e).split("\n")[0]));
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().split("\n")[0]); });
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
      if (info.emptyBody) note("error", where, "The page is empty.");
      if (info.strayCount) note("warn", where, `${info.strayCount} control(s) are not Fluent components: ${info.stray.join("; ")}`);
      if (info.tiny) note("warn", where, `${info.tiny} Fluent control(s) smaller than 24px. Check touch targets.`);
      if (scheme === "dark" && info.bgLum !== null && info.bgLum > 0.5) note("warn", where, "The browser asks for dark mode but the app stayed light. Fine if the app has a manual theme switch; otherwise follow the system scheme.");
      if (errors.length) note("error", where, `Console errors: ${[...new Set(errors)].slice(0, 3).join(" | ")}`);

      if (axeSource) {
        try {
          await page.evaluate(axeSource);
          const res = await page.evaluate(async () => { const r = await window.axe.run({ exclude: [["[data-tabster-dummy]"]] }, { resultTypes: ["violations"] }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, target: v.nodes[0]?.target?.join(" ") })); });
          for (const v of res) note(v.impact === "critical" || v.impact === "serious" ? "error" : "warn", where, `Accessibility [${v.id}] ${v.help} (${v.nodes} element(s), e.g. ${v.target})`);
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
process.exit(errs ? 1 : 0);
