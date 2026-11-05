#!/usr/bin/env bash
# Install the provider folders as Codex plugins, turned off by default.
# Turn some on for one session with:
#   codex -c 'plugins={"pstack@skillsets"={enabled=true},"9arm@skillsets"={enabled=true}}'
# Run again after ./fetch.sh to update the installed copies.
set -euo pipefail

cd "$(dirname "$0")"
codex_home="${CODEX_HOME:-$HOME/.codex}"

if marketplace_output=$(codex plugin marketplace add "$PWD" 2>&1); then
  printf '%s\n' "$marketplace_output"
else
  marketplace_status=$?
  case "$marketplace_output" in
    *"marketplace 'skillsets' is already added from a different source;"*)
      echo "==> Replacing the existing skillsets marketplace source with $PWD"
      codex plugin marketplace remove skillsets
      codex plugin marketplace add "$PWD"
      ;;
    *)
      printf '%s\n' "$marketplace_output" >&2
      exit "$marketplace_status"
      ;;
  esac
fi

for dir in */.codex-plugin; do
  codex plugin add "${dir%/.codex-plugin}@skillsets"
done

# `codex plugin add` turns each plugin on in config.toml. Turn them off again.
perl -0pi -e 's/(\[plugins\."[^"]+\@skillsets"\]\nenabled = )true/${1}false/g' "$codex_home/config.toml"

echo "==> Done. See README.md to turn the plugins on for one session."
