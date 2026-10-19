#!/usr/bin/env bash
# Fetch skills from providers into ./<provider> folders.
set -euo pipefail

cd "$(dirname "$0")"

# fetch_skills <source> <dest>
fetch_skills() {
  local source="$1" dest="$2"

  echo "==> Fetching $source into ./$dest"
  rm -rf .agents/skills
  npx -y skills add "$source" -p --skill "*" --agent "universal" -y

  rm -rf "$dest"
  mkdir -p "$dest"
  mv .agents/skills/* "$dest"/
  rm -rf .agents/skills
  rmdir .agents 2>/dev/null || true
}

fetch_skills mattpocock/skills mattpocock
