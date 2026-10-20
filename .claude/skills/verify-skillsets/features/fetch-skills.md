# Fetch skills

`./fetch.sh` deletes each provider folder, downloads it again with `npx skills add`, makes the Claude and Codex plugin manifests, and writes `.claude-plugin/marketplace.json`. It refuses folder names that are not valid and folders it did not make.

## Sub-features

- `fetch-download` gives `<provider>/.claude/skills/<skill>/SKILL.md` for each skill in the source (or only the named skills).
- `fetch-manifests` writes `<provider>/.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` with `"skills": "./.claude/skills/"`.
- `fetch-marketplace` writes `.claude-plugin/marketplace.json` with one plugin for each provider.
- `fetch-guard` refuses an invalid folder name and an existing folder without a fetch.sh manifest (covered by `npm test`, `test/fetch.test.mjs`).

## How to get to it (user POV)

- `./fetch.sh` in the repo root (README "Update the skills", "Add a provider").
- The daily `Fetch skills` GitHub Actions workflow (not drivable locally).

## Driving it with verify.sh

Preconditions:

- Network access to GitHub and npm. Without network, report the feature as not verified.
- A scratch clone, so the real checkout stays as it is: `SC="$TMPDIR/skillsets-verify-fetch-$$"; git clone -q --local . "$SC"`.

- **Fetch.** Run `(cd "$SC" && ./fetch.sh) 2>&1 | tee "$SKILLSETS_VERIFY_OUT/fetch.txt"`. Exit code `0` and one `==> Fetching <source> into ./<provider>` line for each `fetch_skills` line.
- **Result.** Run `git -C "$SC" status --short | tee "$SKILLSETS_VERIFY_OUT/fetch-status.txt"` and `git -C "$SC" diff --stat`. Only provider folders and `.claude-plugin/marketplace.json` change. Upstream updates are normal, so changes in provider folders are expected.
- **Manifests.** Run `cat "$SC"/9arm/.claude-plugin/plugin.json "$SC"/.claude-plugin/marketplace.json`. The provider manifest has `"name": "9arm"` and the marketplace lists every provider.
- **Picker on the result.** Run `$V start f 'node '"$SC"'/cli.mjs'` and capture the provider list. It matches the folders in the clone. (The helper runs from the real repo root, so give the clone path to node.)
- **Real checkout unchanged.** `git status --short` in the real repo shows no new changes.
- **Cleanup.** Run `$V stop f`, then remove the clone by its literal path (Claude Code blocks `rm -rf "$SC"` with a variable).

## Gotchas

- The `skills` CLI stages files in git. In the clone this does not matter. In the real repo, run `git reset` after `./fetch.sh`.
- The clone has no `node_modules`. `cli.mjs` imports `@clack/prompts` relative to the clone, so run `(cd "$SC" && npm ci)` before the picker step.
- `fetch.sh` takes minutes and downloads from many repos. A failure in one source stops the script (`set -e`). Report which source failed.
