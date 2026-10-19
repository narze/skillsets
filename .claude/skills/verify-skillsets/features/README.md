# skillsets verification map

This folder is the maintained source for verifying what a skillsets user can do. Read this index first, then use the matching feature file as the recipe.

## Baseline preconditions

- Work from the repo root. `npm ci` has run.
- `V=.claude/skills/verify-skillsets/verify.sh` and `$V doctor` prints `doctor: OK`.
- `SKILLSETS_VERIFY_OUT` is set to a new folder for this run.
- The provider folders are as committed (`git status` clean in provider folders), unless the change under test is a provider update.
- Never run `codex-install.sh` against the real `~/.codex`, or `fetch.sh` in the real checkout. Use the scratch copies in their feature files.

## Driving conventions

- One tmux session for each drive, started with `$V start`. Wait for text with `$V wait`, never with a fixed sleep.
- Get the provider order from `$V doctor`. Count `Down` presses from it.
- Treat every command as literal. Keep the quotes.
- Stop your own sessions with `$V stop`. Delete only the scratch folders that this run made.

## Proof and skip reporting

- TUI proof: a capture of each prompt state and of the output, plus the exit code.
- Agent proof: the output of the agent's own check run with the printed value, and a negative control without it.
- File proof: the written file, and a read-only check that the real home folder or checkout did not change.
- Name the feature ID with each artifact (use it in the capture name).
- If a precondition is missing (no network, agent CLI not installed, no API key), report the feature as not verified, with the command and the reason. Do not report it as verified through another path.

## Feature entry contract

Each feature file has an H1 title, one paragraph, and four H2 sections in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with verify.sh`, `Gotchas`.

## Features

- [Pick and print](./pick-and-print.md) - choose providers and an agent in `npx .`, get the command or T3 Code settings.
- [Cancel and validation](./cancel-and-validation.md) - cancel the picker, and the empty-selection error.
- [Load in agent](./load-in-agent.md) - the printed command makes the agent load the chosen skills.
- [Codex install](./codex-install.md) - `codex-install.sh` adds the marketplace and installs the plugins, turned off.
- [Fetch skills](./fetch-skills.md) - `fetch.sh` downloads providers and writes the plugin manifests.
