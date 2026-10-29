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

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
};

// The git URL from the repository field of package.json, if there is one.
export function repositoryUrl(root) {
  const repository = readJson(join(root, "package.json"))?.repository;
  return typeof repository === "string" ? repository : repository?.url;
}

// The git URL that npm installed the package from (npx user/repo), as https, without the commit.
// npm records it in the .package-lock.json of the node_modules folder. A fork gets its own URL.
export function installedFromUrl(root) {
  const name = readJson(join(root, "package.json"))?.name;
  const resolved = readJson(join(root, "..", ".package-lock.json"))?.packages?.[`node_modules/${name}`]?.resolved;
  if (typeof resolved !== "string" || !resolved.startsWith("git+")) return undefined;
  return resolved
    .slice("git+".length)
    .replace(/#.*$/, "")
    .replace(/^ssh:\/\/git@/, "https://");
}

// Where to clone from: where npm installed the package from, else the repository in package.json.
export const cloneSource = (root) => installedFromUrl(root) ?? repositoryUrl(root);

// owner/repo (or github:owner/repo) becomes a GitHub https URL. Anything else (a URL, a path) is kept.
export function repoUrl(spec) {
  const name = spec.trim().replace(/^github:/, "");
  return /^[\w.-]+\/[\w.-]+$/.test(name) ? `https://github.com/${name.replace(/\.git$/, "")}.git` : spec.trim();
}

// True when the clone worked. False when git is missing or the clone fails (no network, no access).
export function gitClone(url, dest) {
  const result = spawnSync("git", ["clone", "--depth", "1", "--quiet", url, dest], {
    stdio: "ignore",
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  return result.status === 0;
}

// Replace dest with a git clone of the repository that npm installed from (else the one in package.json), or a copy of root if the clone is not possible.
// Builds the new folder next to dest first, so a failure leaves the old dest as it was.
// Returns "git" or "copy".
// url is where to clone from. An empty url copies root.
// With copyFallback false, a failed clone throws instead of copying root (for a repo the user chose).
export function installTo(root, dest, { clone = gitClone, url = cloneSource(root), copyFallback = true } = {}) {
  if (destState(dest) === "foreign") throw new Error(`${dest} exists and is not a skillsets folder`);
  const staging = `${dest}.new`;
  rmSync(staging, { recursive: true, force: true });
  mkdirSync(dirname(dest), { recursive: true });

  let method = "git";
  if (!url || !clone(url, staging)) {
    rmSync(staging, { recursive: true, force: true });
    if (url && !copyFallback) throw new Error(`Could not clone ${url}`);
    method = "copy";
    cpSync(root, staging, { recursive: true, filter: (src) => basename(src) !== "node_modules" });
  }

  rmSync(dest, { recursive: true, force: true });
  renameSync(staging, dest);
  return method;
}
