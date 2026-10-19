# Load in agent

The command that the picker prints makes the agent load exactly the chosen providers' skills, for that session only. This is the real goal of the repo: the printed text is useless if the agent does not load the skills.

## Sub-features

- `load-claude` with `CLAUDE_CODE_PLUGIN_DIRS`: each provider is an inline plugin named after its folder, with its skills (names get the `<provider>:` prefix).
- `load-codex` with `-c 'plugins={...}'`: the chosen plugins are enabled, the others stay disabled (needs `codex-install.sh` first, see `codex-install.md`).
- `load-opencode`, `load-pi`, `load-cursor`: the skills are visible in a session.
- `load-scope`: without the printed value, the providers do not load.

## How to get to it (user POV)

- Copy the command from `pick-and-print` and run it in a terminal.
- Paste the T3 Code values into T3 Code settings (not drivable here).

## Driving it with verify.sh

Preconditions:

- A capture from `pick-and-print` for the agent, in `$SKILLSETS_VERIFY_OUT`.
- The agent CLI is on `PATH` (`command -v claude codex opencode pi cursor-agent`).

- **Claude, printed value.** Take the `CLAUDE_CODE_PLUGIN_DIRS=...` value from the capture `print-claude`. Run `CLAUDE_CODE_PLUGIN_DIRS=<value> claude plugin details <provider> | tee "$SKILLSETS_VERIFY_OUT/load-claude-<provider>.txt"` for each chosen provider. The output has `<provider> 1.0.0`, `Source: <provider>@inline`, and `Skills (N)` with the skill folder names from `<provider>/.claude/skills/`. This check is offline and costs no tokens.
- **Claude, negative control.** Run `claude plugin details <provider> 2>&1 | tee "$SKILLSETS_VERIFY_OUT/load-scope-claude.txt"` without the variable. It prints `Plugin "<provider>" not found` and exits `1`.
- **Codex.** With a scratch `CODEX_HOME` that `codex-install.md` made, run `CODEX_HOME=<scratch> codex plugin list <printed -c argument> | grep skillsets`. The chosen plugins show `installed, enabled`, the others `installed, disabled`.
- **OpenCode, Pi, Cursor.** There is no offline list command. Run the printed command with a one-turn prompt, for example `pi --skill <dir> -p "List the names of the skills you can use. Only the names."`. This sends a model request and costs tokens. Ask the user before you do it, and record the agent output.

## Gotchas

- `claude plugin list` shows only installed plugins, not `CLAUDE_CODE_PLUGIN_DIRS` plugins. Use `claude plugin details <name>`.
- `opencode debug` has no skill list command. A real OpenCode check needs a model turn.
- The Codex proof is only valid against the scratch `CODEX_HOME`. The real `~/.codex` can have other `skillsets` state from earlier installs.
- Skill names that appear in two providers (`tdd`, `teach`, `test-driven-development`) are only safe with prefixes. `--add-dir` has no prefix, so do not use it to prove `load-scope`.
