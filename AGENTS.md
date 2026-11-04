# Working on the Fluent kit itself

This repo is the kit, not an app. `.github/copilot-instructions.md` (the block between the `fluent-kit` markers) and `.github/skills/fluent-ui/` are the payload `install.mjs` copies into other repos. They are not the rules for work here, except when you edit the skill's examples, which must follow them.

## Layout
- `.github/skills/fluent-ui/`: what agents read in an installed repo: `SKILL.md` (router), `tasks/`, `patterns/`, `deviations.md`, `examples/`.
- `.fluent-kit/`: the scripts and rules that ship with it. `scripts/lib.mjs` holds the shared helpers.
- `install.mjs`: the installer. `tests/`: CI checks. `docs/REFERENCE.md`: the human reference. `docs/history/`: old test rounds, not current guidance.

## Rules for changes
- Each rule lives in one file. Before adding a sentence to a card, check that no other agent-facing file says it (`node tests/audit.mjs`, AUD-03).
- Agent-facing wording lives in the cards and in `context.mjs` output; scripts like `detect-theme.mjs` return facts.
- A change an agent reads must stay within `tests/reading-cost.mjs`; a script must stay within its limit in `tests/audit.mjs` (AUD-04).
- Examples are what agents copy: they must render clean (`node tests/render-examples.mjs`).
- Plain English, no em dashes, short sentences. CHANGELOG entry for anything a user or agent will notice.

## Before a pull request
`npm test && npm run audit`. The audit checklist and the log of findings: `docs/AUDIT.md`.
