#!/usr/bin/env node
// Fluent kit checker. No dependencies, no ESLint needed.
// Usage: node .fluent-kit/scripts/check.mjs [dir] [--changed] [--json] [--baseline] [--allow pkg,pkg] [--no-next]
//        node .fluent-kit/scripts/check.mjs --finish --page /path [--full] [--click "role=button[name='...']"] [--no-verify]
//   --finish    the one command to end a task: the rules on changed files, then tsc, then verify only if something
//               visible changed (and Playwright is installed). Stops at the first step that fails.
//               --page is the page you changed; --full and --click are passed to verify; --no-verify when the person
//               asked to skip checks (the rules and tsc still run).
//   --changed   only files changed in git (staged, unstaged, untracked). Use this while working.
//   --baseline  record today's findings in .fluent-kit/baseline.json; later runs fail only on NEW findings.
//               Use it once when adopting the kit in a repo that already has old violations.
//   --allow     packages that are allowed even though they look like another UI/icon library
//               (also read from "allow" in .fluent-kit/config.json: the project's own shared UI package goes there)
//   --json      machine-readable output
// Exit code 1 if there are errors, 0 otherwise. Warnings never fail the run.
// Silence one line with a comment: // fluent-kit-ignore -- reason   (on the same line or the line above)
import { existsSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative, resolve, sep, extname, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
// The real path, so it matches what git reports (macOS /var -> /private/var, Windows short 8.3 names, junctions).
const root = (() => { const p = resolve(args.find((a, i) => !a.startsWith("--") && !["--allow", "--page", "--click"].includes(args[i - 1])) || "."); try { return realpathSync.native(p); } catch { return p; } })();
const json = flag("--json");

let config = {};
try { config = JSON.parse(readFileSync(join(root, ".fluent-kit", "config.json"), "utf8")); } catch { /* optional */ }
const allow = new Set([...(config.allow || []), ...(opt("--allow") || "").split(",").filter(Boolean)]);

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", ".nuxt", "dist", "build", "out", "coverage", ".turbo", ".vercel", ".github", ".fluent-kit", ".agents", ".claude", ".vscode", "storybook-static"]);
const CODE = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".css", ".scss", ".less"]);
const JSX_EXT = new Set([".tsx", ".jsx"]);

// Banned packages and native elements come from .fluent-kit/rules.json, shared with detect-theme and the ESLint config.
const RULES = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "rules.json"), "utf8"));
const matcher = (patterns) => (pkg) => patterns.some((p) => (p.endsWith("*") ? pkg.startsWith(p.slice(0, -1)) : pkg === p));
const isIcon = matcher(RULES.iconLibraries), isUi = matcher([...RULES.uiLibraries, ...RULES.fluentV8]), isStyleLib = matcher(RULES.styleLibrariesWarn);
const NATIVE = new RegExp(`<(${Object.keys(RULES.native).join("|")})(?=[\\s>/])`, "g");
const COLOR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\s*\(/i;
const HEX = /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![0-9a-z_-])/gi;
const SPACING = "padding|paddingTop|paddingRight|paddingBottom|paddingLeft|paddingBlock|paddingInline|margin|marginTop|marginRight|marginBottom|marginLeft|marginBlock|marginInline|gap|rowGap|columnGap|borderRadius|borderTopLeftRadius|borderTopRightRadius|borderBottomLeftRadius|borderBottomRightRadius";
const SPACING_JS = new RegExp(`(?:^|[\\s{,])(?:${SPACING})\\s*:\\s*(?:["'\`]\\s*)?-?\\d*\\.?\\d+(?:px|rem|em)\\b|(?:^|[\\s{,])(?:${SPACING})\\s*:\\s*-?[1-9]\\d*(?:\\.\\d+)?\\s*(?:,|}|$)`);
const SPACING_CSS = new RegExp(`(?:^|[;{\\s])(?:${SPACING.replace(/([A-Z])/g, "-$1").toLowerCase()})\\s*:\\s*[^;]*?-?\\d*\\.?\\d+(?:px|rem|em)\\b`);
const FONT_FAMILY = /(?:fontFamily|font-family)\s*:\s*["'`]?[^"'`;,}]+/i;
const TW_COLOR = /\b(?:bg|text|border|ring|from|to|via|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;
const INLINE_STYLE_PROP = /style=\{\{[^}]*\b(?:color|background|backgroundColor|border|borderColor|fontSize|fontFamily|fontWeight|padding|margin|gap|borderRadius)\s*:/;
const GRADIENT = /(?:linear|radial|conic)-gradient\s*\(/;

function walk(dir, out) {
  for (const n of readdirSync(dir)) {
    if (SKIP_DIRS.has(n)) continue;
    const p = join(dir, n);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, out);
    else if (CODE.has(extname(n)) && !/\.(test|spec|stories)\.[jt]sx?$/.test(n) && !/\.d\.ts$/.test(n)) out.push(p);
  }
}

function changedFiles() {
  const run = (a) => spawnSync("git", a, { cwd: root, encoding: "utf8" });
  if (run(["rev-parse", "--is-inside-work-tree"]).status !== 0) return null;
  const top = run(["rev-parse", "--show-toplevel"]).stdout.trim();
  const names = new Set();
  for (const a of [["diff", "--name-only", "HEAD"], ["diff", "--name-only", "--cached"], ["ls-files", "--others", "--exclude-standard"]]) {
    for (const l of run(a).stdout.split("\n").filter(Boolean)) names.add(resolve(top, l));
  }
  return [...names].filter((f) => existsSync(f) && CODE.has(extname(f)) && f.startsWith(root + sep) && !f.split(sep).some((s) => SKIP_DIRS.has(s)));
}

let files = [];
if (flag("--changed") || flag("--finish")) {
  const c = changedFiles();
  if (c === null) { console.error("--changed needs a git repository. Checking all files."); walk(root, files); }
  else files = c.filter((f) => !/\.(test|spec|stories)\.[jt]sx?$/.test(f) && !/\.d\.ts$/.test(f));
} else walk(root, files);

// A file that defines the brand ramp or the theme is allowed to hold hex values.
const isBrandFile = (text, file) => /BrandVariants|createLightTheme|createDarkTheme/.test(text) || /[\\/]brands?[\\/]/.test(file) || /theme/i.test(basename(file)) && /createLightTheme|BrandVariants/.test(text);

const findings = [];
function add(file, line, rule, severity, message) { findings.push({ file: relative(root, file).split(sep).join("/"), line, rule, severity, message }); }

for (const file of files) {
  let text; try { text = readFileSync(file, "utf8"); } catch { continue; }
  const ext = extname(file);
  const lines = text.split("\n");
  const brandFile = isBrandFile(text, file);
  let inBlock = false;
  lines.forEach((raw, i) => {
    const n = i + 1;
    let line = raw;
    // strip comments (simple, line based)
    if (inBlock) { const e = line.indexOf("*/"); if (e < 0) return; line = line.slice(e + 2); inBlock = false; }
    for (;;) { const s = line.indexOf("/*"); if (s < 0) break; const e = line.indexOf("*/", s + 2); if (e < 0) { line = line.slice(0, s); inBlock = true; break; } line = line.slice(0, s) + line.slice(e + 2); }
    const ignored = /fluent-kit-ignore/.test(raw) || (i > 0 && /fluent-kit-ignore/.test(lines[i - 1]));
    if (ignored) return;
    const code = ext === ".css" || ext === ".scss" || ext === ".less" ? line : line.replace(/(^|[^:"'`])\/\/.*$/, "$1");
    if (!code.trim()) return;

    // imports
    const imp = code.match(/(?:import\s+(?:[^'"]*?\s+from\s+)?|require\(\s*|import\(\s*|from\s+)["']([^"']+)["']/);
    if (imp && !(ext === ".css")) {
      const pkg = imp[1];
      if (!pkg.startsWith(".") && !allow.has(pkg) && ![...allow].some((a) => pkg.startsWith(a + "/"))) {
        if (isIcon(pkg)) add(file, n, "icon-library", "error", `Icon library '${pkg}'. Use @fluentui/react-icons only.`);
        else if (isUi(pkg)) add(file, n, "ui-library", "error", `'${pkg}' is not allowed. Use Fluent UI React v9 (@fluentui/react-components). @fluentui/react is v8.`);
        else if (isStyleLib(pkg)) add(file, n, "style-library", "warn", `'${pkg}': style with makeStyles and tokens instead, unless the project already standardises on it.`);
      }
      return;
    }

    if (!brandFile) {
      const hex = code.match(HEX);
      const inString = /["'`][^"'`]*#[0-9a-f]{3,8}/i.test(code) || ext === ".css" || ext === ".scss" || ext === ".less";
      if ((hex && inString && !/href\s*=|\bid\s*=|url\(\s*#|["']#[\w-]+["']\s*[),]?\s*$/.test(code) && !/^\s*(?:import|export)\b[^=]*\bfrom\b/.test(code)) || COLOR_FN.test(code)) {
        add(file, n, "hardcoded-color", "error", `Hard-coded colour '${(hex?.[0] || code.match(COLOR_FN)?.[0] || "").trim()}'. Use tokens.color* (brand colour comes from the theme).`);
      }
    }
    if (GRADIENT.test(code) && !brandFile) add(file, n, "gradient", "error", "Gradients are not part of the Microsoft look. Use a flat Fluent surface (the standard outranks the prompt; only an approved exception in PROFILE.md allows this).");
    if (/\btokens\.colorPalette[A-Z]\w*/.test(code) && !brandFile) add(file, n, "palette-token", "error", "tokens.colorPalette* carries status and data meaning, not decoration. Use neutral and brand tokens (or tokens.colorStatus* for status).");

    const sp = ext === ".css" || ext === ".scss" || ext === ".less" ? SPACING_CSS : SPACING_JS;
    if (sp.test(code)) add(file, n, "hardcoded-spacing", "error", "Hard-coded spacing or radius. Use tokens.spacingHorizontal*/spacingVertical* and tokens.borderRadius*.");
    if (FONT_FAMILY.test(code) && !/tokens\.fontFamily|inherit|var\(/.test(code)) add(file, n, "hardcoded-font", "error", "Hard-coded font family. Use tokens.fontFamilyBase (Segoe UI) via the theme.");
    if (JSX_EXT.has(ext)) {
      NATIVE.lastIndex = 0;
      let m;
      while ((m = NATIVE.exec(code))) {
        add(file, n, "native-control", "error", `Native <${m[1]}>. Use Fluent ${RULES.native[m[1]]}. (Real exception: add '// fluent-kit-ignore -- reason'.)`);
      }
      if (INLINE_STYLE_PROP.test(code)) add(file, n, "inline-style", "error", "Inline style sets colour, type or spacing. Use makeStyles with tokens.");
      if (TW_COLOR.test(code)) add(file, n, "tailwind-color", "warn", "Tailwind colour utility. Colours come from Fluent tokens (makeStyles), unless the repo's own guidance says otherwise.");
    }
  });

  if (JSX_EXT.has(ext)) {
    // Icon-only Button without an accessible name (multi-line aware).
    const re = /<(Button|ToolbarButton|MenuButton)\b([^<>]*?(?:\{[^}]*(?:\{[^}]*\}[^}]*)*\}[^<>]*?)*)\/>/g;
    let m;
    while ((m = re.exec(text))) {
      const attrs = m[2];
      if (/\bicon\s*=/.test(attrs) && !/aria-label|aria-labelledby|\btitle\s*=/.test(attrs)) {
        const line = text.slice(0, m.index).split("\n").length;
        if (!/fluent-kit-ignore/.test(lines[line - 1] || "") && !/fluent-kit-ignore/.test(lines[line - 2] || "")) add(file, line, "icon-button-name", "error", `Icon-only <${m[1]}> needs aria-label (and a Tooltip).`);
      }
    }
    // Fluent's Input with a native date, time or range type renders the browser's own picker: unthemed, different in
    // every browser, and it ignores the app's locale. Date and time come from Fluent's pickers; range from Slider.
    for (const mm of text.matchAll(/<Input\b(?:(?!<Input\b)[\s\S]){0,400}?\btype=["'](date|time|datetime-local|month|week|range)["']/g)) {
      const t = mm[1];
      const use = t === "range" ? "Slider" : t === "time" ? "TimePicker (@fluentui/react-timepicker-compat)" : "DatePicker (@fluentui/react-datepicker-compat)";
      const line = text.slice(0, mm.index).split("\n").length;
      if (!/fluent-kit-ignore/.test(lines[line - 1] || "") && !/fluent-kit-ignore/.test(lines[line - 2] || "")) add(file, line, "native-picker", "error", `<Input type="${t}"> opens the browser's own control. Use Fluent ${use}; add the package and name it in the design note.`);
    }
    // Fluent's Select wraps the browser's <select>: its open list is the operating system's menu, not a Fluent one.
    for (const mm of text.matchAll(/<Select\b/g)) {
      const line = text.slice(0, mm.index).split("\n").length;
      if (!/fluent-kit-ignore/.test(lines[line - 1] || "") && !/fluent-kit-ignore/.test(lines[line - 2] || "")) add(file, line, "native-select", "error", "<Select> opens the operating system's own option list, which is not themed. Use Dropdown (with Option) or Combobox; for 2 to 5 visible choices use RadioGroup.");
    }
    // <img> without alt
    for (const mm of text.matchAll(/<img\b(?![^>]*\balt\s*=)[^>]*>/g)) add(file, text.slice(0, mm.index).split("\n").length, "img-alt", "error", "<img> without alt.");
  }
}

// Baseline: tolerate findings that already existed.
const baselinePath = join(root, ".fluent-kit", "baseline.json");
const key = (f) => `${f.file}::${f.rule}`;
if (flag("--baseline")) {
  const counts = {};
  for (const f of findings.filter((x) => x.severity === "error")) counts[key(f)] = (counts[key(f)] || 0) + 1;
  mkdirSync(join(root, ".fluent-kit"), { recursive: true });
  writeFileSync(baselinePath, JSON.stringify({ note: "Existing findings tolerated by check.mjs. Fix them over time; new ones fail.", counts }, null, 2) + "\n");
  console.log(`Baseline written: ${Object.keys(counts).length} file/rule pairs, ${findings.filter((x) => x.severity === "error").length} findings tolerated.`);
  process.exit(0);
}
let tolerated = 0;
let reported = findings;
if (existsSync(baselinePath)) {
  let base = {}; try { base = JSON.parse(readFileSync(baselinePath, "utf8")).counts || {}; } catch { /* ignore */ }
  const seen = {};
  reported = findings.filter((f) => {
    if (f.severity !== "error") return true;
    const k = key(f); seen[k] = (seen[k] || 0) + 1;
    if (seen[k] <= (base[k] || 0)) { tolerated++; return false; }
    return true;
  });
}

const errors = reported.filter((f) => f.severity === "error");
const warns = reported.filter((f) => f.severity === "warn");
if (json) {
  console.log(JSON.stringify({ filesChecked: files.length, errors: errors.length, warnings: warns.length, tolerated, findings: reported }, null, 2));
} else {
  for (const f of reported) console.log(`${f.severity === "error" ? "ERROR" : "warn "}  ${f.file}:${f.line}  [${f.rule}]  ${f.message}`);
  console.log(`\nfluent-kit check: ${files.length} files, ${errors.length} error(s), ${warns.length} warning(s)${tolerated ? `, ${tolerated} tolerated by baseline` : ""}.`);
  if (errors.length) console.log("Fix the errors before presenting the work. Use tokens and Fluent components; details in .github/skills/fluent-ui/deviations.md.");
  // This check passing is not the end of the job. Say what is still missing, sized to the change.
  if (flag("--changed") && !flag("--finish") && !flag("--no-next") && files.length) {
    const c = assessChange(files);
    console.log(c.visible.length
      ? "\nNot finished yet. End with: node .fluent-kit/scripts/check.mjs --finish --page /page   (runs tsc, then verify)"
      : "\nNothing visible changed (only comments, types, formatting or non-UI files). End with: node .fluent-kit/scripts/check.mjs --finish   (runs tsc; no verify needed)");
  }
}
if (flag("--finish")) process.exit(finish(errors.length));

// Which changed files change what a person sees. A file counts only if its code differs once comments, types,
// imports that are only types, and formatting are removed: TypeScript's own transpiler does that when the project
// has TypeScript; otherwise comments and whitespace are stripped. New and deleted UI files always count.
function assessChange(changed) {
  const git = (a) => spawnSync("git", a, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const top = git(["rev-parse", "--show-toplevel"]).stdout.trim();
  const ui = changed.filter((f) => /\.(tsx|jsx|css|scss|less)$/.test(f) || (/\.[cm]?[jt]s$/.test(f) && (() => { try { return /\bmakeStyles\b|\bmakeResetStyles\b/.test(readFileSync(f, "utf8")); } catch { return false; } })()));
  let ts = null; try { ts = createRequire(join(root, "package.json"))("typescript"); } catch { /* fallback below */ }
  const shape = (code, file) => {
    if (/\.(css|scss|less)$/.test(file)) return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, "");
    if (ts) { try { return ts.transpileModule(code, { fileName: basename(file), compilerOptions: { jsx: ts.JsxEmit.Preserve, removeComments: true, target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText.replace(/\s+/g, ""); } catch { /* fallback */ } }
    return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1").replace(/\s+/g, "");
  };
  const visible = ui.filter((f) => {
    const before = git(["show", `HEAD:${relative(top, f).split(sep).join("/")}`]);
    if (before.status !== 0) return true; // new file
    let after; try { after = readFileSync(f, "utf8"); } catch { return true; } // deleted
    return shape(before.stdout, f) !== shape(after, f);
  });
  const untracked = new Set(git(["ls-files", "--others", "--exclude-standard"]).stdout.split("\n").filter(Boolean).map((l) => resolve(top, l)));
  let lines = 0;
  if (visible.length) for (const l of git(["diff", "--numstat", "HEAD", "--", ...visible]).stdout.split("\n")) { const [a, d] = l.split("\t"); lines += (Number(a) || 0) + (Number(d) || 0); }
  const newFiles = visible.filter((f) => untracked.has(f)).length;
  const OVERLAY = /\b(OverlayDrawer|InlineDrawer|Dialog|DialogSurface|Popover|MenuPopover|DatePicker|TimePicker|Combobox|Dropdown|Toast|Tooltip)\b/;
  const overlays = visible.filter((f) => /\.(tsx|jsx)$/.test(f)).filter((f) => { try { return OVERLAY.test(readFileSync(f, "utf8")); } catch { return false; } });
  return { visible, lines, newFiles, small: !newFiles && lines <= 20, overlays };
}
process.exit(errors.length ? 1 : 0);

// --finish: rules (already reported above), then tsc, then verify sized to the change. One command, one summary line.
function finish(ruleErrors) {
  const shown = (f) => relative(root, f).split(sep).join("/"); // forward slashes on every system, so the message reads the same
  const done = (steps, code) => { console.log(`\nfluent-kit finish: ${steps.join(", ").replace(/\.+$/, "")}.`); return code; };
  if (ruleErrors) return done([`stopped at the rules (${ruleErrors} error(s) above): fix them, then run --finish again`], 1);
  const steps = ["rules ok"];
  const change = assessChange(files);

  const tc = typecheck();
  if (tc.ran && tc.code !== 0) { console.log(`\n$ ${tc.cmd}\n${tc.output}`); return done([...steps, "stopped at tsc (errors above): fix them, then run --finish again"], 1); }
  steps.push(tc.ran ? "tsc ok" : `tsc skipped (${tc.why})`);

  if (flag("--no-verify")) return done([...steps, "verify skipped at the person's request: say in your reply that the UI was not verified"], 0);
  if (!change.visible.length) return done([...steps, "verify not needed (nothing visible changed)"], 0);
  const req = createRequire(join(root, "package.json"));
  const hasPlaywright = ["playwright", "@playwright/test", "playwright-core"].some((n) => { try { req.resolve(n); return true; } catch { return false; } });
  if (!hasPlaywright) return done([...steps, "verify not available (Playwright is not installed): say in your reply that the UI was not verified. To enable it once: npm i -D playwright axe-core && npx playwright install chromium"], 0);
  const page = opt("--page") || inferPage(change.visible);
  if (!page) return done([...steps, `verify needed (${change.visible.slice(0, 3).map((f) => shown(f)).join(", ")} changed visibly): run again with --page /path-of-that-page (with its #hash if the app routes by hash)`], 2);

  const vArgs = ["--start", page, ...(flag("--full") ? ["--full"] : []), ...(opt("--click") ? ["--click", opt("--click")] : [])];
  console.log(`\n$ node .fluent-kit/scripts/verify.mjs ${vArgs.map((a) => (/\s|\[/.test(a) ? JSON.stringify(a) : a)).join(" ")}`);
  const v = spawnSync(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), "verify.mjs"), ...vArgs], { cwd: root, stdio: "inherit" });
  const hint = change.overlays.length && !opt("--click") ? ` Something in ${change.overlays.slice(0, 3).map((f) => shown(f)).join(", ")} opens on a click: add --click "role=button[name='<the button that opens it>']".` : "";
  if (v.status === 0) return done([...steps, `verify ok${hint ? "." + hint : ""}`], 0);
  if (v.status === 1) return done([...steps, `verify found problems (above): fix them, then run --finish again${hint ? "." + hint : ""}`], 1);
  return done([...steps, "verify could not run (see above): fix that, or say in your reply that the UI was not verified"], 2);
}

// tsc the way the project does it: its "typecheck" script, else tsc -b for project references (Vite), else tsc --noEmit.
function typecheck() {
  if (!files.some((f) => /\.(tsx?|mts|cts)$/.test(f))) return { ran: false, why: "no TypeScript changed" };
  let pkg = {}; try { pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")); } catch { /* none */ }
  const run = (cmd, argv, shown) => { const r = spawnSync(cmd, argv, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, shell: process.platform === "win32" && cmd !== process.execPath }); return { ran: true, code: r.status ?? 1, cmd: shown, output: `${r.stdout || ""}${r.stderr || ""}`.trim().split("\n").slice(0, 40).join("\n") }; };
  if (pkg.scripts?.typecheck) {
    const pm = existsSync(join(root, "pnpm-lock.yaml")) ? "pnpm" : existsSync(join(root, "yarn.lock")) ? "yarn" : (existsSync(join(root, "bun.lockb")) || existsSync(join(root, "bun.lock"))) ? "bun" : "npm";
    return run(pm, ["run", "typecheck"], `${pm} run typecheck`);
  }
  if (!existsSync(join(root, "tsconfig.json"))) return { ran: false, why: "no tsconfig.json" };
  let tsc; try { tsc = createRequire(join(root, "package.json")).resolve("typescript/bin/tsc"); } catch { return { ran: false, why: "TypeScript is not installed" }; }
  const refs = /"references"\s*:/.test(readFileSync(join(root, "tsconfig.json"), "utf8"));
  return refs ? run(process.execPath, [tsc, "-b"], "tsc -b") : run(process.execPath, [tsc, "--noEmit", "-p", "tsconfig.json"], "tsc --noEmit");
}

// Next.js routes can be read from the file path; anything else needs --page.
function inferPage(changedFiles) {
  const routes = new Set();
  for (const f of changedFiles) {
    const r = relative(root, f).split(sep).join("/");
    let m = r.match(/(?:^|\/)app\/(.*?)\/?page\.[jt]sx?$/) || (/(?:^|\/)app\/page\.[jt]sx?$/.test(r) ? ["", ""] : null);
    if (m) { const segs = m[1].split("/").filter((s) => s && !/^\(.*\)$/.test(s)); if (segs.some((s) => s.startsWith("["))) return null; routes.add("/" + segs.join("/")); continue; }
    m = r.match(/(?:^|\/)pages\/(.*)\.[jt]sx?$/);
    if (m && !m[1].startsWith("_") && !m[1].startsWith("api/")) { const p = m[1].replace(/(^|\/)index$/, ""); if (p.includes("[")) return null; routes.add("/" + p); continue; }
    return null; // a component file: the page that uses it is unknown
  }
  return routes.size === 1 ? [...routes][0] : null;
}
