# skillsets

Agent skills from other providers, in one folder for each provider.

| Folder        | Source                  | Skills                                    |
| ------------- | ----------------------- | ----------------------------------------- |
| `mattpocock/` | `mattpocock/skills`     | All                                       |
| `pstack/`     | `cursor/plugins/pstack` | All                                       |
| `9arm/`       | `thananon/9arm-skills`  | `debug-mantra`, `post-mortem`, `scrutinize` |
| `kunchen/`    | `kunchenguid/lavish-axi` | `lavish`                                 |

Each tool loads only the providers you choose, for one session. Use an environment variable when the tool has one, for example in an app such as T3 Code that cannot pass CLI options.

| Tool        | Environment variable       | CLI option                |
| ----------- | -------------------------- | ------------------------- |
| Claude Code | `CLAUDE_CODE_PLUGIN_DIRS`  | `--add-dir`               |
| OpenCode    | `OPENCODE_CONFIG_CONTENT`  | None                      |
| Codex CLI   | None                       | `-c 'plugins={...}'`      |
| Pi          | None                       | `--skill`                 |
| Cursor CLI  | None                       | `--plugin-dir`            |

## Use the skills in T3 Code

Set these in T3 Code settings, for each provider:

| Provider | Field              | Value |
| -------- | ------------------ | ----- |
| Claude   | Variables          | `CLAUDE_CODE_PLUGIN_DIRS` = `/path/to/skillsets/pstack:/path/to/skillsets/9arm` |
| OpenCode | Variables          | `OPENCODE_CONFIG_CONTENT` = `{"skills":{"paths":["/path/to/skillsets/pstack/.claude/skills"]}}` |
| Codex    | Launch arguments   | `-c 'plugins={"pstack@skillsets"={enabled=true}}'` (run `codex-install.sh` first) |
| Pi       | Launch arguments   | `--skill /path/to/skillsets/pstack/.claude/skills --skill /path/to/skillsets/9arm/.claude/skills` |
| Cursor   | None               | Not supported in T3 Code. See below. |

- Claude: do not use `--add-dir` in "Launch arguments". T3 Code keeps only one value for each flag.
- OpenCode: leave "Server URL" blank, so T3 Code starts the server with the variable.
- Cursor is not supported in T3 Code. T3 Code runs Cursor through the Cursor SDK in its own process. It has no "Launch arguments", and it reads only `CURSOR_API_KEY` from "Variables". Cursor loads skills only from your user folders (for example `~/.cursor/skills`, `~/.agents/skills`, `~/.claude/skills`), the project folders, and installed plugins. To use these skills with Cursor, use the Cursor CLI (see below).

## Use the skills in Claude Code

### Environment variable

Set `CLAUDE_CODE_PLUGIN_DIRS` to the provider folders, separated by `:`:

```bash
CLAUDE_CODE_PLUGIN_DIRS="/path/to/skillsets/pstack:/path/to/skillsets/9arm"
```

Each provider folder is a Claude Code plugin (`.claude-plugin/plugin.json`). So Claude Code adds the provider name to each skill name, for example `/pstack:poteto-help`, and names in different providers do not conflict.

### CLI option

Add the provider folders to a Claude Code session with `--add-dir`:

```bash
claude --add-dir "/path/to/skillsets/pstack" "/path/to/skillsets/mattpocock" "/path/to/skillsets/9arm" "/path/to/skillsets/kunchen"
```

The skills load only in that session. To load one provider, add only its folder.

- `--add-dir` accepts more than one path. If you give a prompt, put it before `--add-dir`, or Claude reads the prompt as a folder:
  `claude "your prompt" --add-dir "/path/to/skillsets/pstack"`
- Most `pstack` skills set `disable-model-invocation: true`. Claude does not use them by itself. Type the slash command, for example `/poteto-help`.
- `mattpocock` and `pstack` both have `tdd` and `teach`. If you add both folders, these names conflict, and you can get the skill from the other provider.

## Use the skills in OpenCode

Set `OPENCODE_CONFIG_CONTENT` to a config with the `.claude/skills` folder of each provider:

```bash
OPENCODE_CONFIG_CONTENT='{"skills":{"paths":["/path/to/skillsets/pstack/.claude/skills","/path/to/skillsets/9arm/.claude/skills"]}}'
```

- Give the `.claude/skills` folder, not the provider folder.
- OpenCode adds this config to your usual config, so your usual skills also load.
- OpenCode v2 uses a background service. The variable must be set for the process that starts the server. T3 Code starts the server itself when its "Server URL" is blank. If you connect to a server that is already running, start that server with the variable.

## Use the skills in Codex CLI

Codex has no flag or environment variable that adds a skills folder for one session. `--add-dir` gives write access only. This repo is a Codex plugin marketplace instead, with one plugin for each provider folder.

Install the plugins one time:

```bash
/path/to/skillsets/codex-install.sh
```

The script adds this repo as the `skillsets` marketplace, installs each provider as a plugin, and turns the plugins off in `~/.codex/config.toml`. So they do not load in a normal session.

Turn on the providers you want for one session with `-c`:

```bash
# One provider
codex -c 'plugins={"pstack@skillsets"={enabled=true}}'

# Some providers
codex -c 'plugins={"pstack@skillsets"={enabled=true},"9arm@skillsets"={enabled=true}}'

# All providers
codex -c 'plugins={"pstack@skillsets"={enabled=true},"mattpocock@skillsets"={enabled=true},"9arm@skillsets"={enabled=true},"kunchen@skillsets"={enabled=true}}'
```

- Use the inline table form above. The dotted form `-c 'plugins."pstack@skillsets".enabled=true'` does not turn the plugin on.
- Codex merges this table with `config.toml`, so your other plugins do not change.

- Codex adds the plugin name to each skill name, for example `$pstack:poteto-help`. So names in different providers do not conflict.
- Codex does not read `disable-model-invocation`, so it can use all `pstack` skills by itself.
- Codex uses a copy of each plugin. After `./fetch.sh`, run `codex-install.sh` again to update the copies.
- The script uses `$CODEX_HOME` if it is set.

## Use the skills in Pi

Give each provider's `.claude/skills` folder to `--skill`. You can use `--skill` more than one time:

```bash
pi --skill "/path/to/skillsets/pstack/.claude/skills" --skill "/path/to/skillsets/9arm/.claude/skills"
```

- Give the `.claude/skills` folder, not the provider folder. Pi does not look in the hidden `.claude` folder.
- Pi reads `disable-model-invocation`, so it does not use most `pstack` skills by itself. Type `/skill:<name>`, for example `/skill:poteto-help`.
- Pi also loads your usual skills. To load only the skills you give with `--skill`, add `--no-skills`.

## Use the skills in Cursor CLI

Give each provider folder to `--plugin-dir`. You can use `--plugin-dir` more than one time:

```bash
cursor-agent --plugin-dir "/path/to/skillsets/pstack" --plugin-dir "/path/to/skillsets/9arm"
```

- Cursor reads the `.claude-plugin/plugin.json` in each provider folder.
- The Cursor CLI has no environment variable for this. `CURSOR_CONFIG_DIR` does not change where Cursor looks for user skills.
- This does not work in T3 Code. See "Use the skills in T3 Code".

## Layout

```
<provider>/
├── skills-lock.json          # source and hash of each skill
├── .claude-plugin/plugin.json # Claude Code plugin, made by fetch.sh
├── .codex-plugin/plugin.json # Codex plugin, made by fetch.sh
└── .claude/skills/<skill>/SKILL.md
.claude-plugin/marketplace.json  # Codex marketplace, made by fetch.sh
```

Claude Code loads skills only from `<dir>/.claude/skills/` in a folder added with `--add-dir`.

## Update the skills

```bash
./fetch.sh
```

The script deletes each provider folder and downloads it again, so it also removes skills that the provider removed. Use `git status` to see the changes.

The `Fetch skills` GitHub Actions workflow runs `fetch.sh` every day. If the skills changed, it opens a PR from the `fetch-skills` branch, or updates the PR if it is already open.

## Add a provider

Add one line to `fetch.sh`, before `write_marketplace`:

```bash
fetch_skills <owner>/<repo>[/<path>] <folder> [skill...]
```

Without skill names, the script downloads all skills of the provider.

Then run `./fetch.sh`, add the folder to the table above, and commit. To use the new provider in Codex, run `codex-install.sh` again.
