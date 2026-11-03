# Fluent kit

Makes GitHub Copilot (and Claude Code, Codex, Cursor) build screens that look and feel like a Microsoft app, using Fluent UI React v9. It gives the agent a short set of design rules, ready-made page patterns, and one command it runs to check its own work, so every screen comes out the same way. Your app keeps its own brand colour.

## Install

You need [Node](https://nodejs.org) 18 or newer. In your project folder:

```
npx github:JavierGoodall99/fluent-kit
```

1. When it asks to set up the browser check, answer **Y**. It installs into `.fluent-kit/deps` (your `package.json` is not touched) and uses the Edge or Chrome already on your computer.
2. Commit the files it added (`.github/` and `.fluent-kit/`).

Run the same command again any time to update.

## Use it

Ask for UI the way you normally would:

- "Add an invoices page with a table of invoices"
- "Make the dashboard easier to understand"
- "Migrate the settings screen from Fluent v8 to v9"

The agent reads only the rules for that kind of task, builds, then runs one command that checks the rules, type-checks, and opens the page in a browser when the change could have moved or recoloured something. You can run it yourself:

```
node .fluent-kit/scripts/check.mjs --finish --page /invoices
```

## Apps that need a sign-in

The first time the check reaches a sign-in page, an Edge window opens. Sign in until your app shows (answer **Yes** to "Stay signed in?"), pick a tenant or customer with real data if asked, and close the window. The check carries on and remembers the sign-in in `.verify-profile/`, which is kept out of git. Never commit or share it.

## Something not working?

```
node .fluent-kit/scripts/doctor.mjs
```

It lists what is wrong and the command that fixes each thing. The usual ones:

- **The browser check says NOT RUN:** `node .fluent-kit/scripts/verify.mjs --setup`
- **Edge says the profile is in use:** close the Edge window the check opened (on a Mac, quit Edge with Cmd+Q) and try again.
- **A known problem in your app's header or menu fails every check:** list it in `.fluent-kit/verify-ignore.json`, for example `["color-contrast"]`.

Include the doctor's output when you report a problem.

## More

[docs/REFERENCE.md](docs/REFERENCE.md): install options, how a task runs, what the checks do, CI and pre-commit enforcement, organisation profiles, lint setup and known limits.

Fluent UI is MIT-licensed. This kit is not affiliated with or endorsed by Microsoft. The kit is released under the [MIT License](LICENSE).
