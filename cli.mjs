#!/usr/bin/env node
// Choose providers and an agent, then print the command that loads them.
import * as p from "@clack/prompts";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AGENTS, buildOutput, listProviders } from "./lib/commands.mjs";

const root = dirname(fileURLToPath(import.meta.url));

function exitIfCancelled(value) {
  if (p.isCancel(value)) {
    p.cancel("Cancelled.");
    process.exit(1);
  }
  return value;
}

p.intro("skillsets");

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
