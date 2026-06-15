# chogui

An opinionated, host-agnostic **game-UI library for interactive fiction**: curated
inline + runtime story-tag packs, DaisyUI game components, a bracket-markup
renderer, and a 3D device engine (dice, spintop, board). Bundled at build time —
no runtime tag loading. Usable by any JavaScript game; the
[Wondo](https://wondo.app) reader is its first consumer.

## Packages

This is a pnpm-workspace monorepo holding two packages that **version and publish
together**:

| Package (npm) | What it is |
| --- | --- |
| [`chogui`](packages/chogui) | The library: inline/runtime tag packs, DaisyUI components, the `StoryMarkup` renderer, the tag manifest + prop schema, and the precompiled/re-themeable CSS. Subpath exports: `.` · `./markup` · `./ui` · `./manifest` · `./props` · `./css` · `./preset`. |
| [`chogui-three`](packages/chogui-three) | The framework-agnostic 3D device engine (three.js + cannon-es) that `chogui` lazy-loads for the `dice`/`spintop`/`board` tags. Ships its runtime `assets/` (textures, sounds, models) and a `copy-assets.mjs` host-vendoring script. |

> The npm package names are `chogui` / `chogui-three`; the repo directories stay `packages/chogui*`.

`chogui` depends on `chogui-three` (`workspace:*` in-repo). **Neither ships without
the other**: a published `chogui` always pins the just-published `chogui-three`
version, and a coordinated `changeset publish` releases both in one run
(`chogui-three` first, then `chogui`). See [`.changeset/README.md`](.changeset/README.md).

## Develop

```bash
pnpm install
pnpm -r build      # build chogui (tsup + Tailwind CSS); chogui-three is source-only
pnpm -r test       # run both packages' test suites
pnpm ladle:dev     # the component catalog (Ladle), against the package sources
```

## Catalog & docs

The [Ladle](https://ladle.dev) catalog (`.ladle/`, `stories/`) renders every tag
through the **real** `StoryMarkup` render path — the same code the reader runs —
so "renders in the catalog" means "renders in a host." It imports the `chogui`
workspace package directly. Dice/board assets are vendored into `public/` by
`scripts/copy-assets.mjs` (re-run on `ladle:dev`/`ladle:build`).

## Release

1. `pnpm changeset` — describe the change (include both packages when shared).
2. `pnpm version` (`changeset version`) — applies version bumps + rewrites the
   internal `workspace:*` to a pinned range.
3. `pnpm release` (`pnpm -r build && changeset publish`) — coordinated publish to
   npm.

## Consuming from a host

```bash
npm install chogui chogui-three
# Vendor the 3D engine's runtime assets into your static dir:
node node_modules/chogui-three/scripts/copy-assets.mjs   # → public/assets/chogui-three/
```

`chogui` ships precompiled CSS (`import "chogui/css"`) for zero-config hosts, and a
re-themeable Tailwind v4 preset (`@import "chogui/preset"`) for hosts that own
their Tailwind build. The `StoryMarkup` renderer takes a configurable
custom-element `prefix`, so a host can namespace the emitted tags (Wondo uses
`prefix: "wondo-"`).
