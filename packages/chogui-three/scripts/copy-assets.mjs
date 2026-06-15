#!/usr/bin/env node
// Vendors chogui-three's runtime assets (dice/board textures + hit/surface
// sounds) into a host's static dir so the engine can fetch them at runtime
// from `resolveAssetPath()` (default `/assets/chogui-three/`):
//   `assetPath + "textures/<name>.webp"`, `assetPath + "sounds/..."`.
//
// Usage (from the host project root):
//   node node_modules/chogui-three/scripts/copy-assets.mjs [--dest <dir>]
//
// `--dest` defaults to `public/assets/chogui-three/` under the CWD — the path
// the engine's DEFAULT_ASSET_PATH expects a Vite/Astro host to serve. The
// source is resolved relative to THIS script, so the same command works from
// the workspace and from an installed node_modules copy. Hosts that skip the
// copy entirely can pass `preferCdn` to `resolveAssetPath()` instead.
//
// The copied output is a build artifact — keep it out of git.

import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const destFlag = process.argv.indexOf("--dest");
const dest =
  destFlag !== -1 && process.argv[destFlag + 1]
    ? resolve(process.cwd(), process.argv[destFlag + 1])
    : join(process.cwd(), "public", "assets", "chogui-three");

const src = join(__dirname, "..", "assets");

if (!existsSync(src)) {
  console.warn(`[chogui-three copy-assets] source not found, skipping: ${src}`);
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`[chogui-three copy-assets] ${src} → ${dest}`);
