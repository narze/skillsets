# skillsets

This repo stores agent skills from other providers, one folder for each provider. Read `README.md` for the full description.

## Load the skills

Start Claude Code with the provider folders:

```bash
claude --add-dir "/path/to/skillsets/pstack" "/path/to/skillsets/mattpocock" "/path/to/skillsets/9arm" "/path/to/skillsets/kunchen"
```

- Put a prompt before `--add-dir`, because `--add-dir` accepts more than one path.
- Each skill must be at `<provider>/.claude/skills/<skill>/SKILL.md`. Claude Code does not load skills from other paths in an added folder.

## Rules

- Do not edit the files in a provider folder. `fetch.sh` deletes and downloads them again.
- To add a provider, add a `fetch_skills <source> <folder> [skill...]` line to `fetch.sh`, run `./fetch.sh`, and update the table in `README.md`.
- The `skills` CLI stages its files in git. Run `git reset` after `./fetch.sh` and stage only the files you want to commit.
