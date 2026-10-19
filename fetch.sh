#!/usr/bin/env bash
# Fetch skills from providers into ./<provider> folders.
set -euo pipefail

cd "$(dirname "$0")"

# fetch_skills <source> <dest> [skill...]  (all skills when none are given)
fetch_skills() {
  local source="$1" dest="$2"
  local skills=("${@:3}")
  [ ${#skills[@]} -eq 0 ] && skills=("*")

  echo "==> Fetching $source into ./$dest"
  rm -rf "$dest"
  mkdir -p "$dest"
  (
    cd "$dest"
    npx -y skills add "$source" -p --skill "${skills[@]}" --agent "universal" -y
    mkdir -p .claude/skills
    mv .agents/skills/* .claude/skills/
    rm -rf .agents

    # Plugin manifests, so Claude Code (CLAUDE_CODE_PLUGIN_DIRS) and Codex (codex-install.sh)
    # can load the same skills
    mkdir -p .codex-plugin .claude-plugin
    printf '{\n  "name": "%s",\n  "version": "1.0.0",\n  "description": "Skills from %s",\n  "skills": "./.claude/skills/"\n}\n' \
      "$dest" "$source" > .codex-plugin/plugin.json
    cp .codex-plugin/plugin.json .claude-plugin/plugin.json
  )
}

# Codex marketplace with one plugin for each provider folder
write_marketplace() {
  local dir sep=""
  mkdir -p .claude-plugin
  {
    printf '{\n  "name": "skillsets",\n  "owner": { "name": "narze" },\n  "plugins": ['
    for dir in */.codex-plugin; do
      dir="${dir%/.codex-plugin}"
      printf '%s\n    { "name": "%s", "description": "Skills in ./%s", "source": "./%s" }' "$sep" "$dir" "$dir" "$dir"
      sep=","
    done
    printf '\n  ]\n}\n'
  } > .claude-plugin/marketplace.json
}

fetch_skills mattpocock/skills mattpocock
fetch_skills cursor/plugins/pstack pstack
fetch_skills thananon/9arm-skills 9arm debug-mantra post-mortem scrutinize
fetch_skills kunchenguid/lavish-axi kunchen lavish

write_marketplace
