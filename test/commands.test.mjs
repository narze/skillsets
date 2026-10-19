import { test } from "node:test";
import assert from "node:assert/strict";
import { AGENTS, buildOutput, listProviders, shellQuote } from "../lib/commands.mjs";

const root = "/home/me/skillsets";
const providers = ["pstack", "9arm"];

test("shellQuote leaves safe strings and quotes the rest", () => {
  assert.equal(shellQuote("/a/b-c_d.e"), "/a/b-c_d.e");
  assert.equal(shellQuote("/a b"), "'/a b'");
  assert.equal(shellQuote("it's"), "'it'\\''s'");
});

test("claude uses CLAUDE_CODE_PLUGIN_DIRS with provider folders", () => {
  assert.equal(
    buildOutput("claude", providers, root),
    "CLAUDE_CODE_PLUGIN_DIRS=/home/me/skillsets/pstack:/home/me/skillsets/9arm claude",
  );
});

test("opencode uses OPENCODE_CONFIG_CONTENT with .claude/skills folders", () => {
  assert.equal(
    buildOutput("opencode", providers, root),
    `OPENCODE_CONFIG_CONTENT='{"skills":{"paths":["/home/me/skillsets/pstack/.claude/skills","/home/me/skillsets/9arm/.claude/skills"]}}' opencode`,
  );
});

test("codex turns on plugins with an inline table", () => {
  assert.equal(
    buildOutput("codex", providers, root),
    `codex -c 'plugins={"pstack@skillsets"={enabled=true},"9arm@skillsets"={enabled=true}}'`,
  );
});

test("pi uses one --skill for each .claude/skills folder", () => {
  assert.equal(
    buildOutput("pi", providers, root),
    "pi --skill /home/me/skillsets/pstack/.claude/skills --skill /home/me/skillsets/9arm/.claude/skills",
  );
});

test("cursor uses one --plugin-dir for each provider folder", () => {
  assert.equal(
    buildOutput("cursor", providers, root),
    "cursor-agent --plugin-dir /home/me/skillsets/pstack --plugin-dir /home/me/skillsets/9arm",
  );
});

test("t3code lists the field and value for each provider", () => {
  assert.equal(
    buildOutput("t3code", providers, root),
    [
      "Claude   - Variables: CLAUDE_CODE_PLUGIN_DIRS = /home/me/skillsets/pstack:/home/me/skillsets/9arm",
      `OpenCode - Variables: OPENCODE_CONFIG_CONTENT = {"skills":{"paths":["/home/me/skillsets/pstack/.claude/skills","/home/me/skillsets/9arm/.claude/skills"]}}`,
      `Codex    - Launch arguments: -c 'plugins={"pstack@skillsets"={enabled=true},"9arm@skillsets"={enabled=true}}'`,
      "Pi       - Launch arguments: --skill /home/me/skillsets/pstack/.claude/skills --skill /home/me/skillsets/9arm/.claude/skills",
      "Cursor   - Not supported in T3 Code",
    ].join("\n"),
  );
});

test("paths with spaces are quoted", () => {
  assert.equal(
    buildOutput("cursor", ["pstack"], "/my skills"),
    "cursor-agent --plugin-dir '/my skills/pstack'",
  );
});

test("every agent has a builder", () => {
  for (const agent of AGENTS) {
    assert.equal(typeof buildOutput(agent.value, ["pstack"], root), "string");
  }
});

test("listProviders finds provider folders in the repo", () => {
  const found = listProviders(new URL("..", import.meta.url).pathname);
  for (const name of ["mattpocock", "pstack", "9arm"]) {
    assert.ok(found.includes(name), `${name} missing from ${found}`);
  }
  assert.deepEqual(found, [...found].sort());
});
