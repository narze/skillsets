# skillsets

This repo stores agent skills from other providers, one folder for each provider. Read `README.md` for the full description.

## Load the skills

`npx .` (or `npm start`) runs an interactive CLI (`cli.mjs`) that prints the command for the chosen skillsets and agent. The commands come from `lib/commands.mjs`. If you change how an agent loads skills, update that file, its tests in `test/`, and this file. Run `npm test`.

When the package runs from a `node_modules` folder (`npx narze/skillsets`), `cli.mjs` first puts the skills in `~/.skillsets` (`SKILLSETS_HOME` overrides it) with `lib/install.mjs`, and prints paths in that folder. It runs `git clone --depth 1` of the repository that npm installed from (read from `node_modules/.package-lock.json`, so a fork clones itself), else the `repository` in `package.json`, and copies the package if that fails. In a terminal it shows the clone URL for the user to confirm or edit (empty copies), and asks before replacing the folder, and refuses a folder without `.claude-plugin/marketplace.json`. `--repo <owner/repo|url>` or `SKILLSETS_REPO` chooses the repository: no URL prompt, and a failed clone is an error, not a copy. `npx .` in a checkout uses the checkout.

Prefer environment variables, because apps such as T3 Code cannot pass CLI options.

Claude Code: set `CLAUDE_CODE_PLUGIN_DIRS` to provider folders, separated by `:`. Skill names get the provider prefix, for example `/pstack:poteto-help`.

```bash
CLAUDE_CODE_PLUGIN_DIRS="/path/to/skillsets/pstack:/path/to/skillsets/9arm"
```

OpenCode: set `OPENCODE_CONFIG_CONTENT` with the `.claude/skills` folder of each provider. The variable must be set for the process that starts the OpenCode server.

```bash
OPENCODE_CONFIG_CONTENT='{"skills":{"paths":["/path/to/skillsets/pstack/.claude/skills","/path/to/skillsets/9arm/.claude/skills"]}}'
```

Claude Code CLI option, if you start it yourself:

```bash
claude --add-dir "/path/to/skillsets/pstack" "/path/to/skillsets/mattpocock" "/path/to/skillsets/9arm"
```

- Put a prompt before `--add-dir`, because `--add-dir` accepts more than one path.
- Each skill must be at `<provider>/.claude/skills/<skill>/SKILL.md`. Claude Code does not load skills from other paths in an added folder.

For Codex CLI, run `./codex-install.sh` one time. Then turn on the providers you want for one session:

```bash
codex -c 'plugins={"pstack@skillsets"={enabled=true},"9arm@skillsets"={enabled=true}}'
```

Codex has no flag or environment variable that adds a skills folder, so each provider folder is a Codex plugin. Use the inline table form. The dotted form `plugins."<name>@skillsets".enabled=true` does not work.

For Pi, give each provider's `.claude/skills` folder with `--skill`:

```bash
pi --skill "/path/to/skillsets/pstack/.claude/skills" --skill "/path/to/skillsets/9arm/.claude/skills"
```

For Cursor CLI, give each provider folder with `--plugin-dir`. There is no environment variable for this, and Cursor in T3 Code is not supported.

```bash
cursor-agent --plugin-dir "/path/to/skillsets/pstack" --plugin-dir "/path/to/skillsets/9arm"
```

## Rules

- Do not edit the files in a provider folder. `fetch.sh` deletes and downloads them again. It also makes `<provider>/.claude-plugin/plugin.json`, `<provider>/.codex-plugin/plugin.json` and `.claude-plugin/marketplace.json`, so do not edit those files.
- To add a provider, add a `fetch_skills <source> <folder> [skill...] [-skill...]` line (`-skill` leaves a skill out) to `fetch.sh` before `write_marketplace`, run `./fetch.sh`, and update the table in `README.md`. The folder name must be new and use only lowercase letters, numbers and `-`. `fetch.sh` refuses other names, and refuses to delete a folder that it did not make. Do not remove this check.
- The `skills` CLI stages its files in git. Run `git reset` after `./fetch.sh` and stage only the files you want to commit.

## Verify a change

To prove a change works for a user (not only in `npm test`), use the project skill `.claude/skills/verify-skillsets/SKILL.md`. It drives `npx .` in a private tmux server and checks the printed commands in the agents.
