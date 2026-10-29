import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { destState, installTo, isPackageInstall, installedFromUrl, repositoryUrl, skillsetsHome } from "../lib/install.mjs";

const NO_GIT = { clone: () => false };
const scratch = () => mkdtempSync(join(tmpdir(), "install-test-"));

function makePackage(dir) {
  mkdirSync(join(dir, ".claude-plugin"), { recursive: true });
  writeFileSync(join(dir, ".claude-plugin", "marketplace.json"), "{}");
  mkdirSync(join(dir, "pstack", ".claude", "skills", "demo"), { recursive: true });
  writeFileSync(join(dir, "pstack", ".claude", "skills", "demo", "SKILL.md"), "new");
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "skillsets", repository: { url: "https://example.com/me/skillsets.git" } }));
  mkdirSync(join(dir, "node_modules", "dep"), { recursive: true });
  writeFileSync(join(dir, "node_modules", "dep", "index.js"), "");
  return dir;
}

test("skillsetsHome is ~/.skillsets unless SKILLSETS_HOME is set", () => {
  assert.match(skillsetsHome({}), /\.skillsets$/);
  assert.equal(skillsetsHome({ SKILLSETS_HOME: "/x/y" }), "/x/y");
});

test("isPackageInstall is true only inside a node_modules folder", () => {
  assert.equal(isPackageInstall("/home/me/.npm/_npx/abc/node_modules/skillsets"), true);
  assert.equal(isPackageInstall("/home/me/Code/skillsets"), false);
});

test("destState tells missing, ours and foreign folders apart", () => {
  const dir = scratch();
  assert.equal(destState(join(dir, "nope")), "missing");
  mkdirSync(join(dir, "empty"));
  assert.equal(destState(join(dir, "empty")), "missing");
  mkdirSync(join(dir, "other"));
  writeFileSync(join(dir, "other", "file"), "");
  assert.equal(destState(join(dir, "other")), "foreign");
  assert.equal(destState(makePackage(join(dir, "pkg"))), "ours");
});

test("installTo copies the package without node_modules", () => {
  const dir = scratch();
  const dest = join(dir, "home", ".skillsets");
  installTo(makePackage(join(dir, "pkg")), dest, NO_GIT);
  assert.equal(readFileSync(join(dest, "pstack", ".claude", "skills", "demo", "SKILL.md"), "utf8"), "new");
  assert.equal(existsSync(join(dest, ".claude-plugin", "marketplace.json")), true);
  assert.equal(existsSync(join(dest, "node_modules")), false);
});

test("installTo replaces an old copy, so removed skills are gone", () => {
  const dir = scratch();
  const dest = makePackage(join(dir, "old"));
  writeFileSync(join(dest, "pstack", ".claude", "skills", "demo", "SKILL.md"), "old");
  mkdirSync(join(dest, "removed"));
  installTo(makePackage(join(dir, "pkg")), dest, NO_GIT);
  assert.equal(readFileSync(join(dest, "pstack", ".claude", "skills", "demo", "SKILL.md"), "utf8"), "new");
  assert.equal(existsSync(join(dest, "removed")), false);
});

test("installTo refuses a folder that it did not make", () => {
  const dir = scratch();
  const dest = join(dir, "mine");
  mkdirSync(dest);
  writeFileSync(join(dest, "important.txt"), "keep");
  assert.throws(() => installTo(makePackage(join(dir, "pkg")), dest, NO_GIT), /not a skillsets folder/);
  assert.equal(readFileSync(join(dest, "important.txt"), "utf8"), "keep");
});

test("repositoryUrl reads a string or an object, and is undefined without one", () => {
  const dir = scratch();
  writeFileSync(join(dir, "package.json"), JSON.stringify({ repository: "https://x/y.git" }));
  assert.equal(repositoryUrl(dir), "https://x/y.git");
  writeFileSync(join(dir, "package.json"), JSON.stringify({ repository: { url: "https://a/b.git" } }));
  assert.equal(repositoryUrl(dir), "https://a/b.git");
  writeFileSync(join(dir, "package.json"), "{}");
  assert.equal(repositoryUrl(dir), undefined);
  assert.equal(repositoryUrl(join(dir, "nope")), undefined);
});

test("installTo clones the repository URL when git works", () => {
  const dir = scratch();
  const dest = join(dir, "home", ".skillsets");
  const calls = [];
  const clone = (url, to) => {
    calls.push(url);
    makePackage(to);
    writeFileSync(join(to, "cloned"), "");
    return true;
  };
  assert.equal(installTo(makePackage(join(dir, "pkg")), dest, { clone }), "git");
  assert.deepEqual(calls, ["https://example.com/me/skillsets.git"]);
  assert.equal(existsSync(join(dest, "cloned")), true);
  assert.equal(existsSync(`${dest}.new`), false);
});

test("installTo copies the package when the clone fails, and keeps the old folder if both fail", () => {
  const dir = scratch();
  const dest = join(dir, "home");
  assert.equal(installTo(makePackage(join(dir, "pkg")), dest, NO_GIT), "copy");
  assert.equal(existsSync(join(dest, "pstack")), true);

  const badPkg = join(dir, "missing-pkg");
  assert.throws(() => installTo(badPkg, dest, NO_GIT));
  assert.equal(existsSync(join(dest, "pstack")), true);
});

// Like npx: <cache>/node_modules/skillsets plus <cache>/node_modules/.package-lock.json
function makeNpxPackage(dir, resolved) {
  const pkg = makePackage(join(dir, "node_modules", "skillsets"));
  writeFileSync(
    join(dir, "node_modules", ".package-lock.json"),
    JSON.stringify({ packages: { "node_modules/skillsets": { resolved } } }),
  );
  return pkg;
}

test("installedFromUrl gives the https URL that npm installed from, without the commit", () => {
  const url = (resolved) => installedFromUrl(makeNpxPackage(scratch(), resolved));
  assert.equal(url("git+ssh://git@github.com/someone/fork.git#abc123"), "https://github.com/someone/fork.git");
  assert.equal(url("git+https://github.com/someone/fork.git#abc123"), "https://github.com/someone/fork.git");
  assert.equal(url("file:../x/skillsets-1.0.0.tgz"), undefined);
  assert.equal(installedFromUrl(makePackage(join(scratch(), "pkg"))), undefined);
});

test("installTo clones the repository that npm installed from, not the package.json one", () => {
  const dir = scratch();
  const pkg = makeNpxPackage(dir, "git+ssh://git@github.com/someone/fork.git#abc123");
  const calls = [];
  const clone = (url, to) => {
    calls.push(url);
    makePackage(to);
    return true;
  };
  installTo(pkg, join(dir, "home"), { clone });
  assert.deepEqual(calls, ["https://github.com/someone/fork.git"]);
});
