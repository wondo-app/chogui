#!/usr/bin/env node
// Export-surface gate for the published packages: publint + are-the-types-wrong.
//
// `publint` runs on both packages. `attw` runs only on `choui` — it is the built
// package that ships `.d.ts`, and it is ESM-only, so we use the `esm-only`
// profile (node10 + CJS expectations don't apply) and exclude the CSS-only
// entrypoints (which attw can't resolve to types/JS by design). `choui-three` is
// deliberately source-only (ships raw `.ts`, no build step; consumed through
// bundlers that compile it, e.g. Vite), so attw's compiled-output / Node ESM
// resolution checks don't apply to it — publint is its gate.
//
// attw runs against the REAL tarball produced by `pnpm pack` (not attw's built-in
// `--pack`, which shells out to npm and ignores `publishConfig` — so it would see
// the dev `./src/*.ts` exports instead of the published `./dist/*` map and report
// spurious resolution failures).

import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** @type {{ name: string, attw: false | string[] }[]} */
const PACKAGES = [
	{ name: "chogui", attw: ["--exclude-entrypoints", "css", "preset"] },
	{ name: "chogui-three", attw: false },
];

const run = (cmd, args) =>
	execFileSync(cmd, args, { stdio: "inherit", encoding: "utf8" });

for (const { name, attw } of PACKAGES) {
	console.log(`\n=== ${name}: publint ===`);
	run("pnpm", ["--filter", name, "exec", "publint", "--strict"]);

	if (!attw) {
		console.log(`\n=== ${name}: attw skipped (source-only package) ===`);
		continue;
	}

	console.log(`\n=== ${name}: attw (published tarball) ===`);
	const slug = name.replace(/[@/]/g, "-");
	const dest = mkdtempSync(join(tmpdir(), `attw-${slug}-`));
	run("pnpm", ["--filter", name, "pack", "--pack-destination", dest]);
	const tarball = readdirSync(dest).find((f) => f.endsWith(".tgz"));
	if (!tarball) throw new Error(`no tarball produced for ${name} in ${dest}`);
	run("pnpm", ["exec", "attw", join(dest, tarball), "--profile", "esm-only", ...attw]);
}

console.log("\n✓ publint + attw passed for all packages");
