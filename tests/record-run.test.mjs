// Tests tests/record-run.mjs end to end in a throwaway git repo. Run: node tests/record-run.test.mjs
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { parseTime, summarise } from "./record-run.mjs";

const script = resolve("tests/record-run.mjs");
const root = mkdtempSync(join(tmpdir(), "fk-bench-"));
const app = join(root, "app"), out = join(root, "bench-runs");
const sh = (cmd, a, cwd = app) => { const r = spawnSync(cmd, a, { cwd, encoding: "utf8" }); return { code: r.status, out: (r.stdout || "") + (r.stderr || "") }; };
const rec = (...a) => sh(process.execPath, [script, ...a]);

try {
  // A small app on a committed kit install.
  mkdirSync(join(app, "src"), { recursive: true });
  mkdirSync(join(app, ".github/skills/fluent-ui/tasks"), { recursive: true });
  writeFileSync(join(app, ".github/skills/fluent-ui/tasks/restyle.md"), "# Restyle\n");
  mkdirSync(join(app, ".fluent-kit"), { recursive: true });
  writeFileSync(join(app, ".fluent-kit/manifest.json"), JSON.stringify({ kit: { version: "9.9.9", commit: "abc1234", fingerprint: "x" }, files: [".github/skills/fluent-ui/tasks/restyle.md"] }));
  writeFileSync(join(app, "src/Home.tsx"), "line 1\nline 2\nline 3\n");
  sh("git", ["init", "-q"]); sh("git", ["-c", "user.email=t@t", "-c", "user.name=t", "add", "."]); sh("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "base"]);

  // What an agent run leaves behind: an edit, a new file, and verify output.
  writeFileSync(join(app, "src/Home.tsx"), "line 1\nline 2 changed\nline 3\nline 4\n");
  writeFileSync(join(app, "src/KpiCard.tsx"), "a\nb\n");
  mkdirSync(join(app, ".fluent-kit/out"), { recursive: true });
  writeFileSync(join(app, ".fluent-kit/out/.gitignore"), "*\n");
  writeFileSync(join(app, ".fluent-kit/out/contact-sheet.png"), "png");
  writeFileSync(join(app, ".fluent-kit/out/verify-runs.jsonl"), '{"exitCode":2}\n{"exitCode":0}\n');
  writeFileSync(join(root, "chat.md"), "Read SKILL.md, then tasks/restyle.md and patterns/dashboard.md. Edited src/Home.tsx.");

  let r = rec("--prompt", "4", "--run", "1", "--credits", "38.5", "--time", "3m40s", "--files-read", "3", "--transcript", join(root, "chat.md"));
  assert.equal(r.code, 0, r.out);
  const run = JSON.parse(readFileSync(join(out, "p4-run1/run.json"), "utf8"));
  assert.equal(run.kit.commit, "abc1234");
  assert.equal(run.stage, 1);
  assert.equal(run.seconds, 220);
  assert.deepEqual([run.diff.files, run.diff.insertions, run.diff.deletions], [2, 4, 1], "1 changed + 1 new file: +2 −1 tracked, +2 untracked, counted as git does");
  assert.deepEqual([run.verify.calls, run.verify.notRun], [2, 1]);
  assert.equal(run.routeHint.looksFollowed, true);
  assert.ok(existsSync(join(out, "p4-run1/verify/contact-sheet.png")), "verify output copied");
  assert.deepEqual(readdirSync(join(app, ".fluent-kit/out")), [".gitignore"], "verify output emptied for the next run");
  assert.match(readFileSync(join(out, "p4-run1/diff.patch"), "utf8"), /KpiCard\.tsx/);
  assert.match(r.out, /\| abc1234 \| 1 \| #4 \| 1 \| 38\.5 \| 3m 40s \| 3 \| \? \(looks Y\) \| 2 \(1 not run\) \|/);
  assert.match(r.out, /Still to fill in: route, quality/);

  // No silent overwrite; --update fills in the scores later.
  assert.notEqual(rec("--prompt", "4", "--run", "1").code, 0);
  r = rec("--prompt", "4", "--run", "1", "--update", "--route", "y", "--quality", "PPPPPP");
  assert.equal(r.code, 0, r.out);
  assert.match(readFileSync(join(out, "results.md"), "utf8"), /Stage 1 \(smoke test\): incomplete \(no run yet for #5, #6\)/);

  // A run folder inside the app that git does not ignore is refused.
  assert.match(rec("--prompt", "5", "--run", "1", "--out", join(app, "runs")).out, /not git-ignored/);

  // Time formats and the stage verdicts.
  assert.deepEqual(["3:05", "4m", "95s", "120"].map(parseTime), [185, 240, 95, 120]);
  const base = { route: "y", quality: "PPPPPP", diff: {}, verify: {}, kit: {} };
  const ok = [4, 5, 6].map((p) => ({ ...base, prompt: p, run: 1, stage: 1, credits: 40, seconds: 200 }));
  assert.match(summarise(ok), /Stage 1 \(smoke test\): PASS/);
  assert.match(summarise(ok.slice(0, 2)), /incomplete \(no run yet for #6\)/);
  assert.match(summarise([...ok.slice(0, 2), { ...ok[2], credits: 60 }]), /Stage 1 \(smoke test\): FAIL: #6 run 1/);
  const s2 = [...ok, ...[4, 5, 6].flatMap((p) => [2, 3].map((n) => ({ ...base, prompt: p, run: n, stage: 2, credits: 44, seconds: 230 })))];
  assert.match(summarise(s2), /Stage 2 \(consistency\): PASS/);
  assert.match(summarise([...s2.slice(0, -1), { ...s2.at(-1), credits: 95 }]), /Stage 2 \(consistency\): FAIL/);
  assert.match(summarise([...s2.slice(0, -1), { ...s2.at(-1), quality: "PPFPPP" }]), /Stage 2 \(consistency\): FAIL/);

  console.log("record-run: all tests passed");
} finally {
  rmSync(root, { recursive: true, force: true });
}
