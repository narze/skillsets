import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function runInstaller(t, failure = "", status = 1) {
  const root = mkdtempSync(join(tmpdir(), "skillsets-installer-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, "bin"));
  mkdirSync(join(root, "home"));
  mkdirSync(join(root, "sample/.codex-plugin"), { recursive: true });
  copyFileSync(new URL("../codex-install.sh", import.meta.url), join(root, "codex-install.sh"));
  writeFileSync(join(root, "home/config.toml"), '[plugins."sample@skillsets"]\nenabled = true\n');
  writeFileSync(join(root, "bin/codex"), `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$TEST_ROOT/calls"
if [[ "$*" == "plugin marketplace add "* && ! -f "$TEST_ROOT/attempted" ]]; then
  touch "$TEST_ROOT/attempted"
  if [[ -n "$TEST_FAILURE" ]]; then
    printf '%s\\n' "$TEST_FAILURE" >&2
    exit "$TEST_STATUS"
  fi
fi
`, { mode: 0o755 });
  const result = spawnSync("bash", [join(root, "codex-install.sh")], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${join(root, "bin")}:${process.env.PATH}`, CODEX_HOME: join(root, "home"), TEST_ROOT: root, TEST_FAILURE: failure, TEST_STATUS: String(status) },
  });
  return { ...result, root, calls: readFileSync(join(root, "calls"), "utf8").trim().split("\n") };
}

test("installer registers and installs plugins without removing a nonconflicting source", (t) => {
  const result = runInstaller(t);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.calls, [`plugin marketplace add ${result.root}`, "plugin add sample@skillsets"]);
  assert.match(readFileSync(join(result.root, "home/config.toml"), "utf8"), /enabled = false/);
});

test("installer replaces a conflicting marketplace before reinstalling plugins", (t) => {
  const result = runInstaller(t, "Error: marketplace 'skillsets' is already added from a different source; remove it before adding this source");
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.calls, [
    `plugin marketplace add ${result.root}`,
    "plugin marketplace remove skillsets",
    `plugin marketplace add ${result.root}`,
    "plugin add sample@skillsets",
  ]);
  assert.match(readFileSync(join(result.root, "home/config.toml"), "utf8"), /enabled = false/);
});

test("installer preserves unrelated errors without removing the marketplace", (t) => {
  const result = runInstaller(t, "Error: permission denied", 42);
  assert.equal(result.status, 42);
  assert.match(result.stderr, /permission denied/);
  assert.deepEqual(result.calls, [`plugin marketplace add ${result.root}`]);
});
