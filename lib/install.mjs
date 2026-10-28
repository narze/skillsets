// Put the skills in a fixed folder, so the printed paths do not point into a temporary npx folder.
// Prefer a git clone (it can be updated with git). Copy the package when git or the network is not there.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, sep } from "node:path";

// The marketplace file that fetch.sh makes. A folder without it is not ours to delete.
const MARKER = join(".claude-plugin", "marketplace.json");

// SKILLSETS_HOME changes the folder, for tests and for people who do not want ~/.skillsets.
export function skillsetsHome(env = process.env) {
  return env.SKILLSETS_HOME || join(homedir(), ".skillsets");
}

// npx and npm unpack a package into a cache folder, inside a node_modules folder.
// A git checkout is not, so `npx .` keeps using the checkout.
export function isPackageInstall(root) {
  return root.split(sep).includes("node_modules");
}

// "missing" (or empty), "ours" (made by installTo), or "foreign" (something else, never deleted).
export function destState(dest) {
  if (!existsSync(dest) || readdirSync(dest).length === 0) return "missing";
  return existsSync(join(dest, MARKER)) ? "ours" : "foreign";
}

// The git URL from the repository field of package.json, if there is one.
export function repositoryUrl(root) {
  try {
    const { repository } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    return typeof repository === "string" ? repository : repository?.url;
  } catch {
    return undefined;
  }
}

// True when the clone worked. False when git is missing or the clone fails (no network, no access).
export function gitClone(url, dest) {
  const result = spawnSync("git", ["clone", "--depth", "1", "--quiet", url, dest], {
    stdio: "ignore",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  return result.status === 0;
}

// Replace dest with a git clone of the repository, or a copy of root if the clone is not possible.
// Builds the new folder next to dest first, so a failure leaves the old dest as it was.
// Returns "git" or "copy".
export function installTo(root, dest, { clone = gitClone } = {}) {
  if (destState(dest) === "foreign") throw new Error(`${dest} exists and is not a skillsets folder`);
  const staging = `${dest}.new`;
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(dirname(dest), { recursive: true });

  const url = repositoryUrl(root);
  let method = "git";
  if (!url || !clone(url, staging)) {
    method = "copy";
    rmSync(staging, { recursive: true, force: true });
    cpSync(root, staging, { recursive: true, filter: (src) => basename(src) !== "node_modules" });
  }

  rmSync(dest, { recursive: true, force: true });
  renameSync(staging, dest);
  return method;
}
