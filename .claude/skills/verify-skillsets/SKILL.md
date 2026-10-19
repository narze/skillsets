---
name: verify-skillsets
description: Drive the skillsets repo the way a user does and capture proof - the interactive `npx .` picker (a @clack/prompts TUI, driven in a private tmux server), the agent commands it prints (proved offline with `claude plugin details` and `codex plugin list`), `codex-install.sh` and `fetch.sh` in scratch copies. Use it to prove a change to cli.mjs, lib/commands.mjs, fetch.sh, codex-install.sh or a provider folder works for a real user, not only in `npm test`.
---

# Verify skillsets

The repo has no server. Its user surfaces are:

1. **Primary:** the interactive picker `npx .` (`cli.mjs`). The user selects providers and an agent, and the picker prints a command.
2. The printed command, run in the agent (Claude Code, OpenCode, Codex CLI, Pi, Cursor CLI, T3 Code settings).
3. `./codex-install.sh` (writes to `$CODEX_HOME`) and `./fetch.sh` (deletes and downloads provider folders, needs network).

The helper `verify.sh` in this folder drives the picker in a private tmux server (socket `skillsets-verify`), so it never touches the user's own tmux sessions. Read `features/README.md` before you drive, then the feature file for what you verify.

## Launch

The picker is a short-lived TUI. There is nothing to keep running. Launch means: install the deps one time, then start each drive in its own tmux session.

```bash
cd <repo root>
npm ci                                   # one time, or after package-lock.json changes
V=.claude/skills/verify-skillsets/verify.sh
export SKILLSETS_VERIFY_OUT="$TMPDIR/skillsets-verify/$(date +%Y%m%d-%H%M%S)"   # evidence folder for this run
$V start pick 'npx .'                    # waits until "Choose skillsets" shows
```

Ready means the pane shows `◆  Choose skillsets (space to select, enter to confirm)` and the provider list. `start` waits for that line (or for `[exit N]` if the command ended early) and fails after 15 s with the pane text.

The default command is `node cli.mjs`. Pass `'npx .'` to use the documented user path. Both run the same file.

## Doctor

Run this first, and again whenever something looks wrong. It is read-only.

```bash
.claude/skills/verify-skillsets/verify.sh doctor
```

It prints the repo path, the git revision (with `(dirty)` if the tree has changes, so you know which code you drive), the Node version (need >= 20), the `@clack/prompts` version, the provider folders that the picker will list, the tmux version, the open sessions on the private socket, and the evidence folder. The last line is `doctor: OK` or `doctor: FAIL`. If deps are missing, run `npm ci`.

## Drive

```bash
V=.claude/skills/verify-skillsets/verify.sh
$V start <session> ['<cmd>']      # new tmux session, one per drive
$V keys <session> Space           # tmux key names: Space Enter Down Up C-c Escape
$V wait <session> '<regex>' [sec] # wait for text, never use a fixed sleep
$V capture <session> <name>       # save the pane to $SKILLSETS_VERIFY_OUT/<name>.txt
$V exit-code <session>            # exit code after the command ended
$V stop [<session>]               # kill one session, or all on the private socket
```

Stable handles in the pane (from `cli.mjs` and @clack/prompts):

| State | Text to wait for |
| --- | --- |
| Provider prompt active | `Choose skillsets` with `◻ <provider>` lines; `◼` is selected |
| Agent prompt active | `◆  Choose an agent`; `●` marks the highlighted agent |
| Command printed | `Run this command:` then the command, then `[exit 0]` |
| T3 Code printed | `Set these in T3 Code settings:` |
| Cancelled | `Cancelled.` then `[exit 1]` |
| Empty provider selection | `Please select at least one option.` (prompt stays open) |

Keys: `Space` toggles the highlighted provider, `Down`/`Up` move, `Enter` confirms, `C-c` or `Escape` cancels. Providers are sorted by name, and the agent order is Claude Code, OpenCode, Codex CLI, Pi, Cursor CLI, T3 Code. Get the provider order from `doctor`, do not guess it.

Example, select `9arm` and Claude Code:

```bash
$V start pick 'npx .'
$V keys pick Space && $V keys pick Enter && $V wait pick 'Choose an agent'
$V keys pick Enter && $V wait pick '\[exit [0-9]+\]'
$V capture pick claude-9arm
```

Then prove the printed command in the agent. See `features/load-in-agent.md`.

## Evidence

All proof goes to `$SKILLSETS_VERIFY_OUT` (default `$TMPDIR/skillsets-verify`). Set it to a new folder for each run. `stop` never deletes it.

Proof standards:

- Drive the real user path: keys in the `npx .` TUI, not calls to `buildOutput()`. `npm test` covers the functions; this skill covers what the user sees.
- Capture each step, not only the end: the provider prompt with the selection, the agent prompt, the printed output, and the exit code.
- Prove the side effect too. The picker output is only text. Run the printed value in the agent (`claude plugin details <provider>` with the printed `CLAUDE_CODE_PLUGIN_DIRS`) and save that output. Add a negative control (the same check without the variable fails).
- `codex-install.sh` and `fetch.sh` change files. Run them only against scratch copies (`CODEX_HOME=<scratch>`, a `git clone` of the repo), then prove the files they wrote and that the real `~/.codex/config.toml` and the real checkout did not change (`stat`, `git status`).
- Never mock. There is no production boundary to mock here, except the network in `fetch.sh`, and `test/fetch.test.mjs` already covers the fake path.

## Cleanup

```bash
.claude/skills/verify-skillsets/verify.sh stop      # kills only the private tmux server it started
rm -rf /literal/path/to/scratch-folder           # only scratch folders this run made; use the literal path, Claude Code blocks rm -rf "$VAR"
```

Never `pkill node` or kill tmux by name: the user can have other agents and tmux sessions open. The evidence folder stays. After cleanup, `ls "$SKILLSETS_VERIFY_OUT"` must still list the `.txt` files.

## Helpers

- `verify.sh` (executable, in this folder). Run `verify.sh help` for usage. It needs `tmux` (`brew install tmux`). macOS has no `timeout` command, so do not use one in recipes.

## Isolation

Many drives can run at the same time: each one has its own tmux session name, and the picker is read-only. `codex-install.sh` and `fetch.sh` are not safe to run against the real `~/.codex` or the real checkout during a verification. Use the scratch copies in their feature files.
