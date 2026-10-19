# Pick and print

The user runs `npx .`, selects one or more provider folders and one agent, and the picker prints the command that loads those providers in that agent (or, for T3 Code, the settings to paste).

## Sub-features

- `pick-providers` lists every provider folder that has `.claude-plugin/plugin.json`, sorted, and allows more than one selection.
- `pick-agent` lists Claude Code, OpenCode, Codex CLI, Pi, Cursor CLI and T3 Code, in that order.
- `print-claude` prints `CLAUDE_CODE_PLUGIN_DIRS=<dir>:<dir> claude`.
- `print-opencode` prints `OPENCODE_CONFIG_CONTENT='{"skills":{"paths":[".../.claude/skills"]}}' opencode`.
- `print-codex` prints `codex -c 'plugins={"<p>@skillsets"={enabled=true},...}'`.
- `print-pi` prints `pi --skill <dir>/.claude/skills ...`.
- `print-cursor` prints `cursor-agent --plugin-dir <dir> ...`.
- `print-t3code` prints `Set these in T3 Code settings:` and one line for each of Claude, OpenCode, Codex, Pi, and `Cursor   - Not supported in T3 Code`.

## How to get to it (user POV)

- `npx .` in the repo root (README "Usage").
- `npm start` (same file).
- `npx narze/skillsets` from the published package (not covered here, it downloads the package).

## Driving it with verify.sh

Preconditions:

- Baseline from `README.md`. `$V doctor` lists the providers, for example `9arm addyosmani humanlayer mattpocock pstack superpowers`.

- **Open the picker.** Run `$V start pick 'npx .'`. The pane shows `Choose skillsets` and one `◻ <provider>` line for each provider from `doctor`. Run `$V capture pick pick-providers-1`.
- **Select two providers.** Select the first and the fifth (`9arm`, `pstack` with the list above). Run `$V keys pick Space Down Down Down Down Space`, then `$V capture pick pick-providers-2`. Both lines show `◼`.
- **Confirm.** Run `$V keys pick Enter` and `$V wait pick 'Choose an agent'`. The provider step collapses to `9arm, pstack` and the agent list shows six agents with `● Claude Code`.
- **Choose an agent.** For agent number N (1 = Claude Code ... 6 = T3 Code), press `Down` N-1 times, then `Enter`. Example for Codex CLI: `$V keys pick Down Down Enter`. Run `$V wait pick '\[exit [0-9]+\]'`.
- **Proof.** Run `$V capture pick print-<agent>` and `$V exit-code pick`. The exit code is `0`, and the line after `Run this command:` matches the sub-feature format, with absolute paths under the repo root and the providers in the order of the list. Run `$V stop pick`.
- **T3 Code.** Repeat with agent 6. The capture shows `Set these in T3 Code settings:` and five lines.

## Gotchas

- Clack redraws the prompt in place. Capture after a `wait`, not right after `keys`, or you can get the earlier frame.
- The pane is 200 columns wide and `capture` joins wrapped lines, so long commands stay on one line. Do not copy the command from a narrow terminal.
- The order of the providers in the output is the order in the list, not the order you selected them.
- Paths are absolute to this checkout. A command printed in a worktree points at the worktree.
- `listProviders` lists only folders with `.claude-plugin/plugin.json`. A provider folder without it does not show. That is correct behavior, not a bug in the picker.
