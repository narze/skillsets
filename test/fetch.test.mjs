import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const script = readFileSync(new URL("../fetch.sh", import.meta.url), "utf8");
// Keep the function definitions, drop the real provider lines.
const functions = script.slice(0, script.search(/^fetch_skills /m));

// Fake `npx skills add`: makes one skill in ./.agents/skills, like the real CLI.
const FAKE_NPX = `#!/usr/bin/env bash
mkdir -p .agents/skills/demo
printf -- '---\\nname: demo\\ndescription: Demo.\\n---\\n' > .agents/skills/demo/SKILL.md
`;

function runFetch(lines, setup = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), "fetch-test-"));
  mkdirSync(join(dir, "bin"));
  writeFileSync(join(dir, "bin", "npx"), FAKE_NPX);
  chmodSync(join(dir, "bin", "npx"), 0o755);
  writeFileSync(join(dir, "fetch.sh"), `${functions}${lines.join("\n")}\nwrite_marketplace\n`);
  setup(dir);
  const result = spawnSync("bash", [join(dir, "fetch.sh")], {
    encoding: "utf8",
    env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH}` },
  });
  return { dir, ...result };
}

test("fetches a new provider folder", () => {
  const { dir, status, stderr } = runFetch(["fetch_skills owner/repo newset"]);
  assert.equal(status, 0, stderr);
  assert.ok(existsSync(join(dir, "newset", ".claude", "skills", "demo", "SKILL.md")));
  assert.ok(existsSync(join(dir, "newset", ".claude-plugin", "plugin.json")));
});

test("replaces a provider folder that fetch.sh made before", () => {
  const { dir, status, stderr } = runFetch(["fetch_skills owner/repo again", "fetch_skills owner/repo again"]);
  assert.equal(status, 0, stderr);
  assert.ok(existsSync(join(dir, "again", ".claude", "skills", "demo", "SKILL.md")));
});

test("does not delete a folder that fetch.sh did not make", () => {
  const { dir, status, stderr } = runFetch(["fetch_skills owner/repo lib"], (d) => {
    mkdirSync(join(d, "lib"));
    writeFileSync(join(d, "lib", "keep.mjs"), "export {};\n");
  });
  assert.notEqual(status, 0);
  assert.match(stderr, /did not make it/);
  assert.ok(existsSync(join(dir, "lib", "keep.mjs")));
});

for (const name of [".", "..", "a/b", "/tmp", ".github", "Upper", ""]) {
  test(`rejects the folder name ${JSON.stringify(name)}`, () => {
    const { dir, status, stderr } = runFetch([`fetch_skills owner/repo ${JSON.stringify(name)}`]);
    assert.notEqual(status, 0);
    assert.match(stderr, /invalid folder name/);
    assert.ok(existsSync(join(dir, "fetch.sh")), "the test folder must still exist");
  });
}
