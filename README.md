# skillsets

Agent skills from other providers, in one folder for each provider.

| Folder        | Source                  | Skills                                    |
| ------------- | ----------------------- | ----------------------------------------- |
| `mattpocock/` | `mattpocock/skills`     | All                                       |
| `pstack/`     | `cursor/plugins/pstack` | All                                       |
| `9arm/`       | `thananon/9arm-skills`  | `debug-mantra`, `post-mortem`, `scrutinize` |

## Use the skills

Add the provider folders to a Claude Code session with `--add-dir`:

```bash
claude --add-dir "/path/to/skillsets/pstack" "/path/to/skillsets/mattpocock" "/path/to/skillsets/9arm"
```

The skills load only in that session. To load one provider, add only its folder.

- `--add-dir` accepts more than one path. If you give a prompt, put it before `--add-dir`, or Claude reads the prompt as a folder:
  `claude "your prompt" --add-dir "/path/to/skillsets/pstack"`
- Most `pstack` skills set `disable-model-invocation: true`. Claude does not use them by itself. Type the slash command, for example `/poteto-help`.
- `mattpocock` and `pstack` both have `tdd` and `teach`. If you add both folders, these names conflict, and you can get the skill from the other provider.

## Layout

```
<provider>/
├── skills-lock.json          # source and hash of each skill
└── .claude/skills/<skill>/SKILL.md
```

Claude Code loads skills only from `<dir>/.claude/skills/` in a folder added with `--add-dir`.

## Update the skills

```bash
./fetch.sh
```

The script deletes each provider folder and downloads it again, so it also removes skills that the provider removed. Use `git status` to see the changes.

The `Fetch skills` GitHub Actions workflow runs `fetch.sh` every day. If the skills changed, it opens a PR from the `fetch-skills` branch, or updates the PR if it is already open.

## Add a provider

Add one line to the end of `fetch.sh`:

```bash
fetch_skills <owner>/<repo>[/<path>] <folder> [skill...]
```

Without skill names, the script downloads all skills of the provider.

Then run `./fetch.sh`, add the folder to the table above, and commit.
