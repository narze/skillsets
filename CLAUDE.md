# skillsets

This repo stores agent skills from other providers, one folder for each provider. Read `README.md` for the full description.

## Load the skills

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
claude --add-dir "/path/to/skillsets/pstack" "/path/to/skillsets/mattpocock" "/path/to/skillsets/9arm" "/path/to/skillsets/kunchen"
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

## Rules

- Do not edit the files in a provider folder. `fetch.sh` deletes and downloads them again. It also makes `<provider>/.claude-plugin/plugin.json`, `<provider>/.codex-plugin/plugin.json` and `.claude-plugin/marketplace.json`, so do not edit those files.
- To add a provider, add a `fetch_skills <source> <folder> [skill...]` line to `fetch.sh` before `write_marketplace`, run `./fetch.sh`, and update the table in `README.md`.
- The `skills` CLI stages its files in git. Run `git reset` after `./fetch.sh` and stage only the files you want to commit.
