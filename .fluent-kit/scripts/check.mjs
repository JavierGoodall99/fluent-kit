#!/usr/bin/env node
// Fluent kit checker. No dependencies, no ESLint needed.
// Usage: node .fluent-kit/scripts/check.mjs [dir] [--changed] [--json] [--baseline] [--allow pkg,pkg] [--no-next]
//   --changed   only files changed in git (staged, unstaged, untracked). Use this while working.
//   --baseline  record today's findings in .fluent-kit/baseline.json; later runs fail only on NEW findings.
//               Use it once when adopting the kit in a repo that already has old violations.
//   --allow     packages that are allowed even though they look like another UI/icon library
//               (also read from "allow" in .fluent-kit/config.json: the project's own shared UI package goes there)
//   --json      machine-readable output
// Exit code 1 if there are errors, 0 otherwise. Warnings never fail the run.
// Silence one line with a comment: // fluent-kit-ignore -- reason   (on the same line or the line above)
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative, resolve, sep, extname, basename } from "node:path";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const root = resolve(args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--allow") || ".");
const json = flag("--json");

let config = {};
try { config = JSON.parse(readFileSync(join(root, ".fluent-kit", "config.json"), "utf8")); } catch { /* optional */ }
const allow = new Set([...(config.allow || []), ...(opt("--allow") || "").split(",").filter(Boolean)]);

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", ".nuxt", "dist", "build", "out", "coverage", ".turbo", ".vercel", ".github", ".fluent-kit", ".agents", ".claude", ".vscode", "storybook-static"]);
const CODE = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs", ".css", ".scss", ".less"]);
const JSX_EXT = new Set([".tsx", ".jsx"]);

const BANNED_UI = [
  /^@mui\//, /^@material-ui\//, /^antd$/, /^antd\//, /^@ant-design\/(?!icons)/, /^@chakra-ui\//, /^react-bootstrap$/, /^react-bootstrap\//, /^bootstrap$/,
  /^@radix-ui\//, /^@headlessui\//, /^@blueprintjs\//, /^semantic-ui-react$/, /^primereact/, /^@mantine\//, /^@nextui-org\//, /^@heroui\//,
  /^@fluentui\/react$/, /^@fluentui\/react\//, /^@fluentui\/react-northstar$/, /^@fluentui\/react-northstar\//, /^@fluentui\/react-compose$/,
];
const BANNED_ICONS = [
  /^lucide-react$/, /^react-icons(\/|$)/, /^@heroicons\//, /^@fortawesome\//, /^@mui\/icons-material/, /^@tabler\/icons/, /^phosphor-react$/, /^@phosphor-icons\//,
  /^bootstrap-icons/, /^react-feather$/, /^feather-icons/, /^@ant-design\/icons/, /^@iconify\//, /^@radix-ui\/react-icons$/, /^material-icons/, /^@material-ui\/icons/,
];
const STYLE_LIBS_WARN = [/^styled-components$/, /^@emotion\//, /^tailwind-merge$/];
const NATIVE = /<(button|input|select|option|optgroup|textarea|a|table|dialog)(?=[\s>/])/g;
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
if (flag("--changed")) {
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
        if (BANNED_ICONS.some((r) => r.test(pkg))) add(file, n, "icon-library", "error", `Icon library '${pkg}'. Use @fluentui/react-icons only.`);
        else if (BANNED_UI.some((r) => r.test(pkg))) add(file, n, "ui-library", "error", `'${pkg}' is not allowed. Use Fluent UI React v9 (@fluentui/react-components). @fluentui/react is v8.`);
        else if (STYLE_LIBS_WARN.some((r) => r.test(pkg))) add(file, n, "style-library", "warn", `'${pkg}': style with makeStyles and tokens instead, unless the project already standardises on it.`);
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
        const map = { button: "Button", input: "Input / Checkbox / Switch / Radio", select: "Dropdown / Combobox / RadioGroup", option: "Dropdown with Fluent Option", optgroup: "OptionGroup in a Dropdown", textarea: "Textarea", a: "Link", table: "Table / DataGrid", dialog: "Dialog" };
        add(file, n, "native-control", "error", `Native <${m[1]}>. Use Fluent ${map[m[1]]}. (Real exception: add '// fluent-kit-ignore -- reason'.)`);
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
  if (errors.length) console.log("Fix the errors before presenting the work. Use tokens and Fluent components; see .fluent-kit/DESIGN.md.");
  // This check passing is not the end of the job. Say what is still missing, at the moment the agent is reading this.
  const uiFiles = files.filter((f) => /\.(tsx|jsx)$/.test(f));
  if (flag("--changed") && !flag("--no-next") && uiFiles.length) {
    const OVERLAY = /\b(OverlayDrawer|InlineDrawer|Dialog|DialogSurface|Popover|MenuPopover|DatePicker|TimePicker|Combobox|Dropdown|Toast|Tooltip)\b/;
    const withOverlay = uiFiles.filter((f) => { try { return OVERLAY.test(readFileSync(f, "utf8")); } catch { return false; } });
    console.log("\nNot finished yet. Still to do: `tsc`, then `node .fluent-kit/scripts/verify.mjs --start /page` and look at the screenshots. \"I did not run verify\" is not an acceptable ending; the only reasons to skip are an explicit request from the user or an error you can quote.");
    if (withOverlay.length) console.log(`These changed files contain something that opens on a click (${withOverlay.slice(0, 4).join(", ")}). Open it with: verify.mjs --start /page --click "role=button[name='<the button that opens it>']" and look at the -open.png screenshot.`);
  }
}
process.exit(errors.length ? 1 : 0);
