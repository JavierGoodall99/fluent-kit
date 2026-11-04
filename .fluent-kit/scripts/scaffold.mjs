#!/usr/bin/env node
// Creates a React + TypeScript app in this folder, next to the kit's own files, ready for the first Fluent screen:
// the framework's starter (Vite, or Next.js App Router with --next), its dependencies plus Fluent, the theme from the
// brand decision, the app wrapped in AppProvider, and none of the starter's demo styling.
// Usage: node .fluent-kit/scripts/scaffold.mjs --brand <#hex|stock> [--lang en] [--title "App name"] [--next]
// The folder must not have a package.json yet. Starters refuse a folder that is not empty (and --overwrite would
// delete the kit), so this one builds in a subfolder and moves the files up without replacing any.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const root = process.cwd();
const here = dirname(fileURLToPath(import.meta.url));
const next = args.includes("--next");
const lang = (opt("--lang") || "en").trim();
let brand = opt("--brand");
const fail = (m, code = 1) => { console.error(`fluent-kit scaffold: ${m}`); process.exit(code); };

if (existsSync(join(root, "package.json"))) fail("this folder already has a package.json: it is not a new app. Use tasks/new-app.md from step 3 instead.");
if (!brand) {
  try { const d = JSON.parse(readFileSync(join(root, ".fluent-kit", "brand.json"), "utf8")); brand = d.mode === "stock" ? "stock" : d.hex; } catch { /* none */ }
}
if (!brand || (brand !== "stock" && !/^#?[0-9a-fA-F]{6}$/.test(brand))) fail('pass the person\'s answer: --brand <#hex> or --brand stock (never invent a colour).');
if (brand !== "stock" && !brand.startsWith("#")) brand = "#" + brand;
if (!/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(lang)) fail(`--lang must be a language code such as en or nl-NL, not "${lang}".`);

const folder = basename(root);
const name = folder.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "app";
const title = (opt("--title") || folder.replace(/[-_]+/g, " ").replace(/^\w/, (c) => c.toUpperCase())).replace(/[<>"]/g, "").trim(); // the product name; the folder name is a fallback
const shell = process.platform === "win32";
const run = (cmd, a, cwd = root) => {
  const r = spawnSync(cmd, a, { cwd, encoding: "utf8", shell, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, CI: "1", npm_config_yes: "true" } });
  if (r.status !== 0) fail(`${cmd} ${a.join(" ")} failed:\n${`${r.stdout || ""}${r.stderr || ""}`.trim().split("\n").slice(-15).join("\n")}`, 2);
};

// 1. The starter, in a subfolder.
const tmp = join(root, "fluent-kit-scaffold");
rmSync(tmp, { recursive: true, force: true });
console.log(`Creating a ${next ? "Next.js" : "Vite"} + React + TypeScript app...`);
if (next) run("npx", ["-y", "create-next-app@latest", "fluent-kit-scaffold", "--ts", "--app", "--eslint", "--no-tailwind", "--no-src-dir", "--import-alias", "@/*", "--use-npm", "--skip-install", "--yes"]);
else run("npm", ["create", "vite@latest", "fluent-kit-scaffold", "--", "--template", "react-ts", "--no-interactive", "--no-immediate"]);

// 2. Move it up without replacing anything already here (the kit's files, a README, a .gitignore).
function merge(from, to) {
  for (const n of readdirSync(from)) {
    const a = join(from, n), b = join(to, n);
    if (n === ".gitignore" && existsSync(b)) {
      const have = new Set(readFileSync(b, "utf8").split(/\r?\n/));
      const add = readFileSync(a, "utf8").split(/\r?\n/).filter((l) => l.trim() && !have.has(l));
      if (add.length) writeFileSync(b, readFileSync(b, "utf8").replace(/\s*$/, "\n") + add.join("\n") + "\n");
    } else if (statSync(a).isDirectory()) { mkdirSync(b, { recursive: true }); merge(a, b); }
    else if (!existsSync(b)) cpSync(a, b);
  }
}
merge(tmp, root);
rmSync(tmp, { recursive: true, force: true });

// 3. Name, title and language; the starter's demo styling out.
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.name = name;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
const firstScreen = "// The first screen: build it from the fluent-ui skill's tasks/new-page.md (step 2 onwards).\n";
if (next) {
  for (const f of ["app/page.module.css", "app/globals.css"]) rmSync(join(root, f), { force: true });
  writeFileSync(join(root, "app/layout.tsx"), `import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "./theme";

export const metadata: Metadata = { title: ${JSON.stringify(title)} };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="${lang}">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
`);
  writeFileSync(join(root, "app/page.tsx"), `${firstScreen}export default function Home() {\n  return <main />;\n}\n`);
} else {
  for (const f of ["src/index.css", "src/App.css", "src/assets"]) rmSync(join(root, f), { recursive: true, force: true });
  const html = join(root, "index.html");
  writeFileSync(html, readFileSync(html, "utf8").replace(/<html lang="[^"]*">/, `<html lang="${lang}">`).replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`));
  writeFileSync(join(root, "src/main.tsx"), `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./theme";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
`);
  writeFileSync(join(root, "src/App.tsx"), `${firstScreen}export default function App() {\n  return <main />;\n}\n`);
}

// 4. The starter's dependencies and Fluent in one install (two installs in a row doubled the wait, long enough for an
// agent's terminal to give up and end its turn).
console.log("Installing dependencies and Fluent UI (1 to 3 minutes; wait for the Done line)...");
run("npm", ["install", "--no-audit", "--no-fund", "--loglevel=error", "@fluentui/react-components", "@fluentui/react-icons"]);

// 5. The brand decision and the theme.
mkdirSync(join(root, ".fluent-kit"), { recursive: true });
const brandFile = join(root, ".fluent-kit", "brand.json");
if (!existsSync(brandFile)) writeFileSync(brandFile, JSON.stringify(brand === "stock" ? { mode: "stock" } : { hex: brand.toLowerCase() }, null, 2) + "\n");
const themeOut = next ? "app/theme.tsx" : "src/theme.tsx";
const t = spawnSync(process.execPath, [join(here, "make-theme.mjs"), brand, ...(next ? ["--next"] : []), "--out", themeOut], { cwd: root, encoding: "utf8" });
if (t.status !== 0) fail(`the app is created, but the theme is not:\n${(t.stderr || t.stdout).trim()}\nOffer the person the darker shade, then run: node .fluent-kit/scripts/make-theme.mjs <#hex> ${next ? "--next " : ""}--out ${themeOut}`, 2);

console.log(`Done: ${next ? "Next.js" : "Vite"} app "${name}" (lang ${lang}, ${brand === "stock" ? "stock theme" : `brand ${brand}`}), Fluent installed, ${themeOut} written and the app wrapped in AppProvider.
Next: the first screen, from tasks/new-page.md step 2. ${next ? "app/page.tsx" : "src/App.tsx"} already exists: edit it. Finish with: node .fluent-kit/scripts/check.mjs --finish --page /`);
