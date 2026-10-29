#!/usr/bin/env node
// Choose providers and an agent, then print the command that loads them.
import * as p from "@clack/prompts";
import { homedir } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { AGENTS, buildOutput, listProviders } from "./lib/commands.mjs";
import { cloneSource, destState, installTo, isPackageInstall, repoUrl, skillsetsHome } from "./lib/install.mjs";

const USAGE = `Usage: skillsets [--repo <owner/repo | git URL>]

  --repo   Repository to clone into ~/.skillsets (or set SKILLSETS_REPO). Default: where npx got the package.
  Set SKILLSETS_HOME to use another folder than ~/.skillsets.`;

let flags;
try {
  ({ values: flags } = parseArgs({ options: { repo: { type: "string" }, help: { type: "boolean" } } }));
} catch (error) {
  console.error(`${error.message}\n\n${USAGE}`);
  process.exit(1);
}
if (flags.help) {
  console.log(USAGE);
  process.exit(0);
}
const chosenRepo = flags.repo ?? process.env.SKILLSETS_REPO;

const packageRoot = dirname(fileURLToPath(import.meta.url));

function exitIfCancelled(value) {
  if (p.isCancel(value)) {
    p.cancel("Cancelled.");
    process.exit(1);
  }
  return value;
}

const tilde = (path) => (path.startsWith(homedir()) ? path.replace(homedir(), "~") : path);

// Under npx the package is in a temporary folder, so copy it to ~/.skillsets and use that.
async function resolveRoot() {
  if (!isPackageInstall(packageRoot)) {
    if (chosenRepo) p.log.warn("--repo only applies to npx. Using this checkout.");
    return packageRoot;
  }

  const dest = skillsetsHome();
  const state = destState(dest);
  if (state === "foreign") {
    p.cancel(`${tilde(dest)} exists and is not a skillsets folder, so it was not changed.`);
    process.exit(1);
  }

  const interactive = process.stdin.isTTY && process.stdout.isTTY;
  if (state === "ours" && interactive) {
    const overwrite = exitIfCancelled(
      await p.confirm({ message: `${tilde(dest)} already exists. Overwrite it with the latest skills?` }),
    );
    if (!overwrite) {
      p.log.info(`Using the skills already in ${tilde(dest)}`);
      return dest;
    }
  }

  // Let the user check, or change, where the skills are cloned from. Empty means copy the package.
  // A repo chosen with --repo or SKILLSETS_REPO is used as is, and must clone.
  let url = chosenRepo ? repoUrl(chosenRepo) : cloneSource(packageRoot);
  if (url && interactive && !chosenRepo) {
    url = exitIfCancelled(
      await p.text({
        message: `Clone the skills to ${tilde(dest)} from (empty to copy the package instead)`,
        initialValue: url,
      }),
    ).trim();
  }

  let method;
  try {
    method = installTo(packageRoot, dest, { url, copyFallback: !chosenRepo });
  } catch (error) {
    p.cancel(`${error.message}. ${tilde(dest)} was not changed.`);
    process.exit(1);
  }
  p.log.success(`${method === "git" ? "Cloned" : "Copied"} the skills to ${tilde(dest)}`);
  return dest;
}

p.intro("skillsets");

const root = await resolveRoot();

const providers = exitIfCancelled(
  await p.multiselect({
    message: "Choose skillsets (space to select, enter to confirm)",
    options: listProviders(root).map((name) => ({ value: name, label: name })),
    required: true,
  }),
);

const agent = exitIfCancelled(
  await p.select({
    message: "Choose an agent",
    options: AGENTS,
  }),
);

p.outro(agent === "t3code" ? "Set these in T3 Code settings:" : "Run this command:");
console.log(`${buildOutput(agent, providers, root)}\n`);
