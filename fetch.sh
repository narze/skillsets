#!/usr/bin/env bash
# Fetch skills from providers into ./<provider> folders.
set -euo pipefail

cd "$(dirname "$0")"

# Stop unless <dest> is a plain folder name, and is new or a folder that fetch.sh made,
# so `rm -rf "$dest"` can only replace a provider folder.
check_dest() {
  local dest="$1"
  if [[ ! "$dest" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
    echo "fetch.sh: invalid folder name '$dest' (use lowercase letters, numbers and -)" >&2
    exit 1
  fi
  if [ -e "$dest" ] && ! grep -qsF '"skills": "./.claude/skills/"' "$dest/.claude-plugin/plugin.json"; then
    echo "fetch.sh: ./$dest exists and fetch.sh did not make it, so it will not be deleted" >&2
    exit 1
  fi
}

# fetch_skills <source> <dest> [skill...] [-skill...]
# All skills when no skill is given. A skill that starts with - is left out.
fetch_skills() {
  local source="$1" dest="${2-}"
  local skills=() excludes=() arg name
  for arg in "${@:3}"; do
    if [[ "$arg" == -* ]]; then excludes+=("${arg#-}"); else skills+=("$arg"); fi
  done
  [ ${#skills[@]} -eq 0 ] && skills=("*")
  check_dest "$dest"

  echo "==> Fetching $source into ./$dest"
  rm -rf "$dest"
  mkdir -p "$dest"
  (
    cd "$dest"
    npx -y skills add "$source" -p --skill "${skills[@]}" --agent "universal" -y
    mkdir -p .claude/skills
    mv .agents/skills/* .claude/skills/
    rm -rf .agents

    for name in ${excludes[@]+"${excludes[@]}"}; do
      if [ ! -d ".claude/skills/$name" ]; then
        echo "fetch.sh: $source has no skill '$name' to leave out" >&2
        exit 1
      fi
      rm -rf ".claude/skills/$name"
      node -e 'const fs = require("fs"), [f, n] = process.argv.slice(1);
        const lock = JSON.parse(fs.readFileSync(f, "utf8")); delete lock.skills[n];
        fs.writeFileSync(f, JSON.stringify(lock, null, 2) + "\n")' skills-lock.json "$name"
    done

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
fetch_skills cursor/plugins/pstack pstack -statechart
fetch_skills thananon/9arm-skills 9arm debug-mantra post-mortem scrutinize
fetch_skills obra/superpowers superpowers
fetch_skills humanlayer/skills humanlayer
fetch_skills addyosmani/agent-skills addyosmani
fetch_skills t3dotgg/tstack/skills tstack

write_marketplace
