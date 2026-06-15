# Changelog

All notable changes to `choui-three` are documented here. The package is the
framework-agnostic 3D engine behind choui's game-device tags, reached only through
a lazy dynamic `import()`. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the package adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- `scripts/copy-assets.mjs` — package-owned vendoring of the served runtime
  assets (`--dest <dir>`, default `public/assets/choui-three/` under the CWD;
  source resolved relative to the script so it works from a workspace or from
  `node_modules`). Hosts call this instead of reaching into the package
  directory themselves.

### Fixed

- `DiceDevice` now resolves its asset base through the engine's
  `resolveAssetPath()` (default `/assets/choui-three/`) instead of a
  hard-coded legacy host path (`/assets/dice-box-threejs/`) — one canonical
  asset contract across the engine, the copy script, and the docs.

### Changed

- `package.json` declares `license: MIT`, `files`, and `sideEffects: false`
  ahead of the coordinated publish.

## [0.1.0] — engine + first devices: `spintop`, `board`

First cut of the shared engine and its first two devices, consumed by
`choui` 0.11.0.

### Added

- `Stage` — one `three` scene/camera/lights/renderer + rAF loop, an on-demand
  `cannon-es` physics world, a device registry, `IntersectionObserver`
  pause/resume, raycast picking, and settle detection. `settle()` runs to rest;
  `showImmediately()` is the reduced-motion / sandbox path.
- `Device` contract + an opt-in string registry (`registerDevice` / `createDevice`
  / `hasDevice` / `listDeviceKinds`). The barrel has no import side effects
  (`sideEffects: false`): a host instantiates a device class directly or registers
  it explicitly, so the package stays tree-shakeable.
- `spintop` device — an N-sided spinning top (teetotum) on `cannon-es` that spins
  upright, topples, and settles. The tumble is **decorative**; `resolveSegmentIndex`
  maps the resolved value to a face index and the story conveys the result. Faces
  show author-supplied labels (or face numbers).
- `board` device — a grid of clickable cells with a piece that tweens to a target
  cell (no physics); `cardinal` / `track` / `ring` layouts with a count-based
  default; `onSelect(i)` for choice routing.
- Engine helpers: `tween` (easing + `animate`), `assets` (`DEFAULT_ASSET_PATH`,
  `CDN_ASSET_PATH`, `resolveAssetPath`), `face-texture` (canvas label rasterizer).

### Vendored

- The MIT `dice-box-threejs` source under `src/dice-box/` (not re-exported) plus
  its textures/sounds and a CC0 `coin.glb` piece — see `THIRD_PARTY_NOTICES.md`.
  It will be normalized onto the `Stage` + `Device` contract so `[dice]` can move
  off the unmaintained `@3d-dice/dice-box-threejs` dependency.

### Dependencies

- `three` + `cannon-es`, owned by this package, externalized and reached only via
  the host's dynamic `import()` so they stay out of the host's SSR + main bundle.
