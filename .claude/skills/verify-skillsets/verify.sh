#!/usr/bin/env bash
# Drive the skillsets CLI (`npx .`) in a private tmux server and save evidence.
# Usage: verify.sh <command> [args]   (run `verify.sh help` for the list)
set -euo pipefail

repo="$(cd "$(dirname "$0")/../../.." && pwd)"
socket="skillsets-verify"
out="${SKILLSETS_VERIFY_OUT:-${TMPDIR:-/tmp}/skillsets-verify}"
tm() { tmux -L "$socket" "$@"; }

usage() {
  cat <<EOF
verify.sh doctor                     Read-only health check. Run it first.
verify.sh start <session> [cmd...]   Start <cmd> (default: node cli.mjs) in tmux, wait for the first prompt.
verify.sh keys <session> <key>...    Send tmux keys, e.g. Space Down Enter C-c Escape, or literal text with -l.
verify.sh wait <session> <regex> [s] Wait up to s seconds (default 10) until the pane matches <regex>.
verify.sh capture <session> <name>   Save the pane text to \$OUT/<name>.txt and print it.
verify.sh exit-code <session>        Print the exit code of the command, after it ends.
verify.sh stop [session]             Kill one session, or the whole private tmux server.
OUT=$out  (set SKILLSETS_VERIFY_OUT to change it; stop never deletes it)
EOF
}

pane() { tm capture-pane -p -J -t "$1"; }

cmd_doctor() {
  local ok=1
  echo "repo:      $repo"
  echo "revision:  $(git -C "$repo" rev-parse --short HEAD)$(git -C "$repo" diff --quiet HEAD -- || echo ' (dirty)')"
  echo "node:      $(node -v)  (need >=20)"
  if [ -f "$repo/node_modules/@clack/prompts/package.json" ]; then
    echo "deps:      @clack/prompts $(node -p "require('$repo/node_modules/@clack/prompts/package.json').version")"
  else
    echo "deps:      MISSING - run: npm ci"; ok=0
  fi
  echo "providers: $(cd "$repo" && node -e 'import("./lib/commands.mjs").then(m => console.log(m.listProviders(".").join(" ")))')"
  command -v tmux >/dev/null && echo "tmux:      $(tmux -V)" || { echo "tmux:      MISSING - brew install tmux"; ok=0; }
  echo "sessions:  $(tm list-sessions -F '#S' 2>/dev/null | tr '\n' ' ' || true)"
  echo "evidence:  $out"
  [ "$ok" = 1 ] && echo "doctor: OK" || { echo "doctor: FAIL"; exit 1; }
}

cmd_start() {
  local s="$1"; shift
  local cmd="${*:-node cli.mjs}"
  if tm has-session -t "=$s" 2>/dev/null; then echo "session $s already exists - stop it or pick a new name" >&2; exit 1; fi
  mkdir -p "$out"
  # Keep the pane open after the command ends, so the output and exit code stay readable.
  tm new-session -d -s "$s" -x 200 -y 50 -c "$repo" "$cmd; echo \"[exit \$?]\"; sleep 86400"
  cmd_wait "$s" 'Choose skillsets|\[exit [0-9]+\]' 15
}

cmd_keys() { local s="$1"; shift; tm send-keys -t "$s" "$@"; }

cmd_wait() {
  local s="$1" re="$2" t="${3:-10}" i
  for ((i = 0; i < t * 5; i++)); do
    pane "$s" | grep -Eq "$re" && return 0
    sleep 0.2
  done
  echo "timeout: /$re/ not seen in $s after ${t}s. Pane:" >&2
  pane "$s" >&2
  exit 1
}

cmd_capture() {
  mkdir -p "$out"
  pane "$1" | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}' > "$out/$2.txt"
  echo "saved $out/$2.txt"
  cat "$out/$2.txt"
}

cmd_exit_code() { pane "$1" | sed -nE 's/^\[exit ([0-9]+)\]$/\1/p' | tail -1; }

cmd_stop() {
  if [ -n "${1-}" ]; then tm kill-session -t "=$1" 2>/dev/null || true
  else tm kill-server 2>/dev/null || true; fi
  echo "stopped ${1:-all sessions on tmux socket $socket}; evidence kept in $out"
}

c="${1:-help}"; shift || true
case "$c" in
  doctor) cmd_doctor ;;
  start) cmd_start "$@" ;;
  keys) cmd_keys "$@" ;;
  wait) cmd_wait "$@" ;;
  capture) cmd_capture "$@" ;;
  exit-code) cmd_exit_code "$@" ;;
  stop) cmd_stop "$@" ;;
  *) usage ;;
esac
