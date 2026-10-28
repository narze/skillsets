# skillsets

Agent skills from other providers, in one folder for each provider.

https://github.com/user-attachments/assets/a3b53fa4-422b-4e6b-93a7-f748b89cdad4

## Why?

- **Load skills only when you need them.** If you install every skill globally, each agent session loads all of them. That fills the context and makes name conflicts. Here you choose the providers for each session.
- **Use one copy with many agents.** The same folders work in Claude Code, Codex, OpenCode, Pi, Cursor CLI and T3 Code.
- **Review changes before you use them.** Skills run with the full permissions of your agent. The skills are in git, and a daily workflow opens a PR when a provider changes, so you can read the diff before you merge it.
- **Take only the skills you want.** You can take all skills from a provider, or only some of them.

## Providers

| Folder        | Source                  | Skills                                    |
| ------------- | ----------------------- | ----------------------------------------- |
| `mattpocock/` | `mattpocock/skills`     | All                                       |
| `pstack/`     | `cursor/plugins/pstack` | All                                       |
| `9arm/`       | `thananon/9arm-skills`  | `debug-mantra`, `post-mortem`, `scrutinize` |
| `superpowers/` | `obra/superpowers`     | All                                       |
| `humanlayer/` | `humanlayer/skills`     | All                                       |
| `addyosmani/` | `addyosmani/agent-skills` | All                                     |

## Usage

The fastest way: choose skillsets and an agent, and the CLI prints the command (or the T3 Code settings) for you.

```bash
npm install   # one time
npx .
```

`npm start` does the same.

Each tool loads only the providers you choose, for one session. Use an environment variable when the tool has one, for example in an app such as T3 Code that cannot pass CLI options.

| Tool        | Environment variable       | CLI option                |
| ----------- | -------------------------- | ------------------------- |
| Claude Code | `CLAUDE_CODE_PLUGIN_DIRS`  | `--add-dir`               |
| OpenCode    | `OPENCODE_CONFIG_CONTENT`  | None                      |
| Codex CLI   | None                       | `-c 'plugins={...}'`      |
| Pi          | None                       | `--skill`                 |
| Cursor CLI  | None                       | `--plugin-dir`            |

Open the section for your tool.

<details>
<summary><strong>T3 Code</strong></summary>

Set these in T3 Code settings, for each provider:

| Provider | Field              | Value |
| -------- | ------------------ | ----- |
| Claude   | Variables          | `CLAUDE_CODE_PLUGIN_DIRS` = `/path/to/skillsets/pstack:/path/to/skillsets/9arm` |
| OpenCode | Variables          | `OPENCODE_CONFIG_CONTENT` = `{"skills":{"paths":["/path/to/skillsets/pstack/.claude/skills"]}}` |
| Codex    | Launch arguments   | `-c 'plugins={"pstack@skillsets"={enabled=true}}'` (run `codex-install.sh` first) |
| Pi       | Launch arguments   | `--skill /path/to/skillsets/pstack/.claude/skills --skill /path/to/skillsets/9arm/.claude/skills` |
| Cursor   | None               | Not supported in T3 Code. See the "Cursor CLI" section. |

- Claude: do not use `--add-dir` in "Launch arguments". T3 Code keeps only one value for each flag.
- OpenCode: leave "Server URL" blank, so T3 Code starts the server with the variable.
- Cursor is not supported in T3 Code. T3 Code runs Cursor through the Cursor SDK in its own process. It has no "Launch arguments", and it reads only `CURSOR_API_KEY` from "Variables". Cursor loads skills only from your user folders (for example `~/.cursor/skills`, `~/.agents/skills`, `~/.claude/skills`), the project folders, and installed plugins. To use these skills with Cursor, use the Cursor CLI (see the "Cursor CLI" section).

</details>

<details>
<summary><strong>Claude Code</strong></summary>

**Environment variable**

Set `CLAUDE_CODE_PLUGIN_DIRS` to the provider folders, separated by `:`:

```bash
CLAUDE_CODE_PLUGIN_DIRS="/path/to/skillsets/pstack:/path/to/skillsets/9arm"
```

Each provider folder is a Claude Code plugin (`.claude-plugin/plugin.json`). So Claude Code adds the provider name to each skill name, for example `/pstack:poteto-help`, and names in different providers do not conflict.

**CLI option**

Add the provider folders to a Claude Code session with `--add-dir`:

```bash
claude --add-dir "/path/to/skillsets/pstack" "/path/to/skillsets/mattpocock" "/path/to/skillsets/9arm"
```

The skills load only in that session. To load one provider, add only its folder.

- `--add-dir` accepts more than one path. If you give a prompt, put it before `--add-dir`, or Claude reads the prompt as a folder:
  `claude "your prompt" --add-dir "/path/to/skillsets/pstack"`
- Most `pstack` skills set `disable-model-invocation: true`. Claude does not use them by itself. Type the slash command, for example `/poteto-help`.
- `mattpocock` and `pstack` both have `tdd` and `teach`, and `superpowers` and `addyosmani` both have `test-driven-development`. With `--add-dir`, these names conflict, and you can get the skill from the other provider. `CLAUDE_CODE_PLUGIN_DIRS` adds the provider name, so it has no conflicts.

</details>

<details>
<summary><strong>OpenCode</strong></summary>

Set `OPENCODE_CONFIG_CONTENT` to a config with the `.claude/skills` folder of each provider:

```bash
OPENCODE_CONFIG_CONTENT='{"skills":{"paths":["/path/to/skillsets/pstack/.claude/skills","/path/to/skillsets/9arm/.claude/skills"]}}'
```

- Give the `.claude/skills` folder, not the provider folder.
- OpenCode adds this config to your usual config, so your usual skills also load.
- OpenCode v2 uses a background service. The variable must be set for the process that starts the server. T3 Code starts the server itself when its "Server URL" is blank. If you connect to a server that is already running, start that server with the variable.

</details>

<details>
<summary><strong>Codex CLI</strong></summary>

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
codex -c 'plugins={"pstack@skillsets"={enabled=true},"mattpocock@skillsets"={enabled=true},"9arm@skillsets"={enabled=true}}'
```

- Use the inline table form above. The dotted form `-c 'plugins."pstack@skillsets".enabled=true'` does not turn the plugin on.
- Codex merges this table with `config.toml`, so your other plugins do not change.
- Codex adds the plugin name to each skill name, for example `$pstack:poteto-help`. So names in different providers do not conflict.
- Codex does not read `disable-model-invocation`, so it can use all `pstack` skills by itself.
- Codex uses a copy of each plugin. After `./fetch.sh`, run `codex-install.sh` again to update the copies.
- The script uses `$CODEX_HOME` if it is set.

</details>

<details>
<summary><strong>Pi</strong></summary>

Give each provider's `.claude/skills` folder to `--skill`. You can use `--skill` more than one time:

```bash
pi --skill "/path/to/skillsets/pstack/.claude/skills" --skill "/path/to/skillsets/9arm/.claude/skills"
```

- Give the `.claude/skills` folder, not the provider folder. Pi does not look in the hidden `.claude` folder.
- Pi reads `disable-model-invocation`, so it does not use most `pstack` skills by itself. Type `/skill:<name>`, for example `/skill:poteto-help`.
- Pi also loads your usual skills. To load only the skills you give with `--skill`, add `--no-skills`.

</details>

<details>
<summary><strong>Cursor CLI</strong></summary>

Give each provider folder to `--plugin-dir`. You can use `--plugin-dir` more than one time:

```bash
cursor-agent --plugin-dir "/path/to/skillsets/pstack" --plugin-dir "/path/to/skillsets/9arm"
```

- Cursor reads the `.claude-plugin/plugin.json` in each provider folder.
- The Cursor CLI has no environment variable for this. `CURSOR_CONFIG_DIR` does not change where Cursor looks for user skills.
- This does not work in T3 Code. See the "T3 Code" section.

</details>

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
fetch_skills <owner>/<repo>[/<path>] <folder> [skill...] [!skill...]
```

Without skill names, the script downloads all skills of the provider. Put `!` before a skill name to leave that skill out, for example `fetch_skills cursor/plugins/pstack pstack !statechart`. The script stops with an error if the provider has no skill with that name.

Use a new folder name with only lowercase letters, numbers and `-`. `fetch.sh` deletes and downloads each provider folder again, so it stops with an error if the name is not valid, or if the folder exists and `fetch.sh` did not make it (for example `lib` or `test`).

Then run `./fetch.sh`, add the folder to the "Providers" table, and commit. To use the new provider in Codex, run `codex-install.sh` again.

### Ask an agent to add it

Open an agent (for example Claude Code or Codex) in this repo and send this prompt. Replace the source, folder and skill names:

```text
Add a skills provider to this repo. Follow the rules in CLAUDE.md.
- Source: <owner>/<repo>[/<path>]   (the value for `npx skills add`)
- Folder: <folder>
- Skills: all   (or a list, for example: debug-mantra, post-mortem)
Run ./fetch.sh, check that only the new folder changed, update the provider table in README.md, and commit.
```

## Make your own skillsets

1. Click **Use this template** at the top of this repo on GitHub, then **Create a new repository**.
2. Clone your new repo.
3. In `fetch.sh`, delete the `fetch_skills` lines that you do not want, and add your providers (see "Add a provider"). Change the owner name `narze` in `write_marketplace` to your name.
4. Run `./fetch.sh`. It deletes and downloads each provider folder again. Delete the folders of providers that you removed from `fetch.sh`.
5. Update the "Providers" table in this README, and commit.
6. To let the daily workflow open PRs, go to **Settings → Actions → General** and select **Allow GitHub Actions to create and approve pull requests**.

You can also ask an agent to do steps 3 to 5:

```text
Make this repo my own skillsets. Follow the rules in CLAUDE.md.
- Keep these providers: <folders to keep, or none>
- Add these providers: <source, folder and skills for each>
- Marketplace owner name: <your name>
Remove the other providers from fetch.sh and delete their folders, run ./fetch.sh, update the provider table in README.md, and commit.
```
