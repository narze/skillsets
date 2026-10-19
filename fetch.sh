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
  )
}

fetch_skills mattpocock/skills mattpocock
fetch_skills cursor/plugins/pstack pstack
fetch_skills thananon/9arm-skills 9arm debug-mantra post-mortem scrutinize
