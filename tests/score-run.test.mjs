// Tests tests/score-run.mjs on a throwaway copy of bench/app, without npm install or a browser (tsc and every state are "?").
// Run: node tests/score-run.test.mjs
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { addedText, scoreRun } from "./score-run.mjs";

const kit = resolve(".");
const app = mkdtempSync(join(tmpdir(), "fk-score-test-"));
const sh = (cmd, a) => spawnSync(cmd, a, { cwd: app, encoding: "utf8" });
const git = (...a) => sh("git", ["-c", "user.email=t@t", "-c", "user.name=t", ...a]);
const edit = (f, from, to) => { const p = join(app, f), s = readFileSync(p, "utf8"); assert.ok(s.includes(from), `${f} has ${from}`); writeFileSync(p, s.replace(from, to)); };
const reset = () => { git("reset", "-q", "--hard"); git("clean", "-qfd"); };
const score = (prompt) => scoreRun({ app, prompt, browser: false });
const why = (s, k) => s.checks[k].why.join(" | ");

try {
  cpSync(join(kit, "bench", "app"), app, { recursive: true });
  sh(process.execPath, [join(kit, ".fluent-kit/scripts/check.mjs"), ".", "--baseline"]); // as bench-setup.mjs does
  git("init", "-q"); git("add", "-A"); git("commit", "-qm", "base");

  // Nothing done: scope fails; no browser and no node_modules leave the rest open or passing.
  let s = score(4);
  assert.equal(s.quality, "F-P??-", JSON.stringify(s.checks));
  assert.match(why(s, "scope"), /nothing changed/);

  // #8 done right: the activity log's cards take home's style, every feature stays.
  edit("src/pages/ActivityLog.tsx", 'statCard: { borderRadius: tokens.borderRadiusMedium, borderLeft: `4px solid ${tokens.colorBrandStroke1}`, padding: "8px", width: "160px" }',
    'statCard: { borderRadius: tokens.borderRadiusXLarge, boxShadow: tokens.shadow4, padding: tokens.spacingHorizontalL, width: "160px" }');
  s = score(8);
  assert.equal(s.quality, "P-P??-", JSON.stringify(s.checks));
  reset();

  // #8 half done: a third card style, not home's.
  edit("src/pages/ActivityLog.tsx", "borderRadius: tokens.borderRadiusMedium, borderLeft: `4px solid ${tokens.colorBrandStroke1}`", "borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow8");
  s = score(8);
  assert.equal(s.checks.uniform.v, "F");
  assert.match(why(s, "uniform"), /ActivityLog\.tsx cards .* differ from src\/pages\/Home\.tsx/);
  reset();

  // #5 rebuilt: features gone, a new card style, English labels, another page touched.
  writeFileSync(join(app, "src/pages/ActivityLog.tsx"), `import { Card, SearchBox, Text, makeStyles, tokens } from "@fluentui/react-components";
import { useState } from "react";
import { events, filterEvents } from "../data";
const useStyles = makeStyles({ summaryCard: { borderRadius: tokens.borderRadiusLarge, boxShadow: tokens.shadow8 } });
export function ActivityLog() {
  const s = useStyles();
  const [q, setQ] = useState("");
  return (<div><Text as="h1">Recent activity</Text><SearchBox placeholder="Search events" value={q} onChange={(_, d) => setQ(d.value)} />
    {filterEvents(events, q, "ALL").map((e) => <Card key={e.id} className={s.summaryCard}><Text>{e.user}</Text></Card>)}</div>);
}
`);
  edit("src/pages/Billing.tsx", "<Text size={600}>Facturatie</Text>", "<Text size={500}>Facturatie</Text>");
  s = score(5);
  assert.equal(s.quality, "F-FF?-", JSON.stringify(s.checks));
  assert.match(why(s, "scope"), /changed src\/pages\/Billing\.tsx, which the prompt is not about/);
  assert.match(why(s, "scope"), /no longer uses exportActivityCsv/);
  assert.match(why(s, "uniform"), /new card style\(s\) the app did not have: radius=borderRadiusLarge/);
  assert.match(why(s, "correct"), /English in a Dutch app: "Recent activity", "Search events"/);
  reset();

  // #6: a restyle that keeps "Gekoppeld" for every tenant is wrong; showing each tenant's own status is right.
  edit("src/pages/Tenants.tsx", 'padding: "20px"', "padding: tokens.spacingHorizontalXL");
  s = score(6);
  assert.match(why(s, "correct"), /every tenant shown as Gekoppeld/);
  edit("src/pages/Tenants.tsx", "{tenantStatusLabel.gekoppeld}", "{tenantStatusLabel[t.status]}");
  s = score(6);
  assert.equal(s.checks.correct.v, "?", why(s, "correct")); // only tsc is left open: no node_modules here
  reset();

  // #9: a new page must use the teams data; one that does not is not the page asked for.
  writeFileSync(join(app, "src/pages/Teams.tsx"), 'import { Text } from "@fluentui/react-components";\nexport function Teams() { return <Text>Teams</Text>; }\n');
  assert.match(why(score(9), "correct"), /no new page uses the teams data/);
  writeFileSync(join(app, "src/pages/Teams.tsx"), 'import { Text } from "@fluentui/react-components";\nimport { teams } from "../data";\nexport function Teams() { return <Text>{teams.length} teams</Text>; }\n');
  s = score(9);
  assert.equal(s.newPage, "src/pages/Teams.tsx");
  assert.equal(s.checks.scope.v, "P");
  reset();

  // UI text a diff adds: JSX text and the props people read, not code.
  edit("src/pages/InvoiceForm.tsx", '<Field label="Uw referentie">', '<Field label="Your reference" hint="Optioneel">');
  assert.deepEqual(addedText(app), ["Your reference"]);
  reset();
  // A prop that holds an expression is code, not text: title={e.tenant} is not an English label.
  edit("src/pages/InvoiceForm.tsx", '<Field label="Uw referentie">', '<Field label="Uw referentie" title={e.tenant}>');
  assert.deepEqual(addedText(app), ["Uw referentie"]);
  reset();

  console.log("score-run: all tests passed");
} finally {
  rmSync(app, { recursive: true, force: true });
}
