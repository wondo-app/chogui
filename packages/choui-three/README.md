# choui-three

The three.js companion to **choui** — a framework-agnostic, vanilla-TS 3D
game-device engine that settles physics/tween animations onto a **predetermined
outcome**. The value is decided first (in the host's story engine); the 3D only
animates toward it, so the displayed result is correct by construction and every
device degrades gracefully when WebGL is unavailable.

## Consumed lazily

The engine is reached only through a dynamic `import()` (in choui's `use3DDevice`
hook), so the heavier scene/physics modules — and their `three` / `cannon-es`
deps — stay out of any host's SSR and main bundle. The pure tween + asset-path
helpers carry no 3D dependency.

```ts
const { containerRef, failed } = use3DDevice((mod, container) => {
  const stage = new mod.Stage(container, /* … */);
  const device = mod.createDevice("spintop", { value, actions /* … */ });
  stage.add(device);
  stage.settle();
  return stage; // a Disposable — disposed on unmount / fallback
}, [value]);
// `failed` flips on load/render error → render a non-3D fallback that still
// performs the device's function (show the label / select the choice).
```

## Stage

`Stage` owns one `three` scene/camera/lights/renderer + an rAF loop, an on-demand
`cannon-es` physics world, a device registry, `IntersectionObserver` pause/resume,
raycast picking for interactive devices, and settle detection. Mount devices with
`add(device)`; `settle(cb)` runs to rest, `showImmediately()` skips the animation
(the `prefers-reduced-motion` / sandbox path); `dispose()` tears everything down.

## Device contract

A device implements `Device` (`mount`/`update`/`settle`/`orientToOutcome`/`dispose`,
optional `onSelect`). Use it one of two ways:

- **Directly** — `new SpinTopDevice(props)` / `new BoardDevice(props)`, then
  `stage.add(device)`. This is what choui's tags do.
- **Through the string registry** (opt-in) — `registerDevice(kind, factory)` then
  `createDevice(kind, props)`; also `hasDevice(kind)` / `listDeviceKinds()`.

The barrel has **no side effects on import** — devices are *not* auto-registered, so
the package stays tree-shakeable (`sideEffects: false`) and a consumer pulls in only
the devices it uses. (This mirrors `choui`, which also composes packs
explicitly rather than registering on import.)

Built-in devices:

- **`spintop`** — an N-sided spinning top (teetotum) on `cannon-es`. Spins
  upright, topples on a random axis, and settles. The tumble is **decorative**;
  `resolveSegmentIndex` maps the resolved value to a face index and the story
  conveys the result. Faces show author-supplied labels (or face numbers).
- **`board`** — a grid of clickable cells with a piece that tweens to a target
  cell (no physics). Layouts: `ring` / `half` / `track` (`defaultLayout`
  picks `ring`). `onSelect(i)` reports the chosen cell for choice
  routing.

## Assets

Devices load most assets (surface `.webp` textures, hit `.mp3` sounds, the
pawn piece) via bundler `?url` imports, so a Vite host resolves and serves
them automatically. The dice device additionally fetches its theme textures
and sounds at runtime from a served directory, resolved by
`resolveAssetPath()`: an explicit `assetPath` prop → `DEFAULT_ASSET_PATH`
(`/assets/choui-three/`) → `CDN_ASSET_PATH` (jsDelivr) with `preferCdn`.

Vendor the served assets into a host with the package-owned script (postinstall
is a good home):

```sh
node node_modules/@wondo-app/choui-three/scripts/copy-assets.mjs            # → public/assets/choui-three/
node node_modules/@wondo-app/choui-three/scripts/copy-assets.mjs --dest static/choui  # custom dest
```

Hosts that skip the copy can rely on the CDN fallback instead.

## Dice (vendored engine)

The MIT `dice-box-threejs` source is vendored under `src/dice-box/` (TypeScript
now), wrapped by `DiceDevice` on the `Device` contract — the `[dice]` tag runs
on this engine; the upstream `@3d-dice/dice-box-threejs` dependency is gone.
Remaining roadmap: a 2-faced coin riding the die as a d2 face.

## License & attribution

This package vendors and adapts `dice-box-threejs` (MIT) and bundles a CC0 coin
model — see [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md). `package.json`
declares `license: MIT` and `files`; the formal top-level `LICENSE` text and the
`private` flag flip land with the coordinated publish (the
`publishable-story-tag-library` change), where choui and choui-three ship
together on a publish-together version policy.
