#!/usr/bin/env node
// Choose providers and an agent, then print the command that loads them.
import * as p from "@clack/prompts";
import { homedir } from "node:os";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AGENTS, buildOutput, listProviders } from "./lib/commands.mjs";
import { cloneSource, destState, installTo, isPackageInstall, skillsetsHome } from "./lib/install.mjs";

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
  if (!isPackageInstall(packageRoot)) return packageRoot;

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
  let url = cloneSource(packageRoot);
  if (url && interactive) {
    url = exitIfCancelled(
      await p.text({
        message: `Clone the skills to ${tilde(dest)} from (empty to copy the package instead)`,
        initialValue: url,
      }),
    ).trim();
  }

  const method = installTo(packageRoot, dest, { url });
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
