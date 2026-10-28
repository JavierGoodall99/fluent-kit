// Link check for everything the installer ships. Fails when an agent-facing file points at a kit file that does not
// exist, at the human-only docs/ folder, or at a reference file that moved there; and when an example and its card
// do not point at each other.
// Run: node tests/links.mjs
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const K = ".github/skills/fluent-ui/";
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const shipped = [".github/copilot-instructions.md", ...walk(K), ...walk(".fluent-kit")].filter((f) => /\.(md|tsx|mjs|cjs|js)$/.test(f));

// detect-theme looks for the user's own design docs by name; that list is not a link.
const ALLOWED = [/^\s*for \(const f of \["design\.md", "DESIGN\.md"/];
const FORBIDDEN = /\bdocs\/|\bDESIGNER?\.md\b|measurements\.md|fluent2-component-guidance|\breferences\/|checklist\.md|new-project-setup|theme-and-brand|migrating\.md/;

const problems = [];
for (const f of shipped) {
  text(f).split("\n").forEach((line, i) => {
    if (ALLOWED.some((r) => r.test(line))) return;
    if (FORBIDDEN.test(line)) problems.push(`${f}:${i + 1}  points at a human-only or removed file: ${line.trim().slice(0, 100)}`);
    for (const m of line.matchAll(/(?<![\w./-])((?:tasks|patterns|examples)\/[\w-]+\.(?:md|tsx)|deviations\.md|SKILL\.md)/g)) {
      if (!existsSync(K + m[1])) problems.push(`${f}:${i + 1}  missing file: ${m[1]}`);
    }
    for (const m of line.matchAll(/\.github\/skills\/fluent-ui\/([\w/-]+\.(?:md|tsx))/g)) {
      if (!existsSync(K + m[1])) problems.push(`${f}:${i + 1}  missing file: .github/skills/fluent-ui/${m[1]}`);
    }
    for (const m of line.matchAll(/\.fluent-kit\/scripts\/([\w-]+\.mjs)/g)) {
      if (!existsSync(".fluent-kit/scripts/" + m[1])) problems.push(`${f}:${i + 1}  missing script: ${m[1]}`);
    }
  });
}

// Every example names its card in its header, and some card names the example.
const cardText = readdirSync(K + "patterns").map((c) => text(K + "patterns/" + c)).join("\n") + text(K + "tasks/new-app.md");
for (const e of readdirSync(K + "examples").filter((n) => n.endsWith(".tsx"))) {
  const header = text(K + "examples/" + e).split("\n").filter((l) => l.startsWith("//")).join(" ");
  if (!/(patterns|tasks)\/[\w-]+\.md/.test(header)) problems.push(`examples/${e}: header does not name its pattern or task card`);
  if (!cardText.includes(`examples/${e}`) && e !== "theme.tsx") problems.push(`examples/${e}: no pattern card names this example`);
}

function text(f) { return readFileSync(f, "utf8"); }
for (const p of problems) console.log("ERROR  " + p);
console.log(problems.length ? `\n${problems.length} link problem(s).` : `Links OK: ${shipped.length} shipped files checked.`);
process.exit(problems.length ? 1 : 0);
