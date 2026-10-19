// Build the command or settings that load the chosen providers in each agent.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const AGENTS = [
  { value: "claude", label: "Claude Code" },
  { value: "opencode", label: "OpenCode" },
  { value: "codex", label: "Codex CLI", hint: "run ./codex-install.sh first" },
  { value: "pi", label: "Pi" },
  { value: "cursor", label: "Cursor CLI" },
  { value: "t3code", label: "T3 Code", hint: "prints settings, not a command" },
];

// Provider folders are the ones that fetch.sh gave a plugin manifest.
export function listProviders(root) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(root, entry.name, ".claude-plugin", "plugin.json")))
    .map((entry) => entry.name)
    .sort();
}

export function shellQuote(value) {
  return /^[\w@%+=:,./-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`;
}

const pluginDirs = (providers, root) => providers.map((name) => join(root, name));
const skillDirs = (providers, root) => providers.map((name) => join(root, name, ".claude", "skills"));

const claudeValue = (providers, root) => pluginDirs(providers, root).join(":");
const opencodeValue = (providers, root) => JSON.stringify({ skills: { paths: skillDirs(providers, root) } });
const codexArgs = (providers) =>
  `-c ${shellQuote(`plugins={${providers.map((name) => `"${name}@skillsets"={enabled=true}`).join(",")}}`)}`;
const piArgs = (providers, root) => skillDirs(providers, root).map((dir) => `--skill ${shellQuote(dir)}`).join(" ");
const cursorArgs = (providers, root) =>
  pluginDirs(providers, root).map((dir) => `--plugin-dir ${shellQuote(dir)}`).join(" ");

const BUILDERS = {
  claude: (providers, root) => `CLAUDE_CODE_PLUGIN_DIRS=${shellQuote(claudeValue(providers, root))} claude`,
  opencode: (providers, root) => `OPENCODE_CONFIG_CONTENT=${shellQuote(opencodeValue(providers, root))} opencode`,
  codex: (providers) => `codex ${codexArgs(providers)}`,
  pi: (providers, root) => `pi ${piArgs(providers, root)}`,
  cursor: (providers, root) => `cursor-agent ${cursorArgs(providers, root)}`,
  t3code: (providers, root) =>
    [
      `Claude   - Variables: CLAUDE_CODE_PLUGIN_DIRS = ${claudeValue(providers, root)}`,
      `OpenCode - Variables: OPENCODE_CONFIG_CONTENT = ${opencodeValue(providers, root)}`,
      `Codex    - Launch arguments: ${codexArgs(providers)}`,
      `Pi       - Launch arguments: ${piArgs(providers, root)}`,
      "Cursor   - Not supported in T3 Code",
    ].join("\n"),
};

export function buildOutput(agent, providers, root) {
  const build = BUILDERS[agent];
  if (!build) throw new Error(`Unknown agent: ${agent}`);
  return build(providers, root);
}
