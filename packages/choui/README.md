# choui

An opinionated DaisyUI **game-UI component library** for interactive fiction —
character-sheet cards, a phone-chat module, data-display primitives, sequence and
motion components, and game-fiction tags (dice, board, spintop) with a 3D engine.
Usable by any React game; the bracket-markup tag layer is an optional add-on for
engines that emit authored `[tag]…[/tag]` markup. Wondo is the first consumer.

> Publishes as **`choui`** (with **`choui-three`** as its 3D engine — the two
> version and publish together). The package name is `choui`
> until the standalone-repo extraction renames it.

Everything is **bundled at build time** — there is no runtime tag loading and no
marketplace. A contributor opens a PR against this package; a host enables a tag
by composing it into its bootstrap and adding the name to its validator's enabled
set. Enabling a tag is a build-time action, not an author or end-user one.

## Install

```sh
npm install choui choui-three
```

Peers: `react` ≥ 18, `react-dom` ≥ 18, `lucide-react` (the `[icon]` glyphs).
`tailwindcss` ≥ 4 and `daisyui` ≥ 5 are optional peers — needed only if you take
the re-themeable `./preset` path (below), not the precompiled `./css` path.

## Styling: `./css` **or** `./preset` — not both

The library ships its opinionated DaisyUI look two ways. Pick one:

- **`./css` — zero-config.** A precompiled stylesheet carrying DaisyUI, every
  utility/component class the components use, and a neutral default theme. Import
  it and the components look right with no Tailwind toolchain of your own:

  ```ts
  import "choui/css";
  ```

- **`./preset` — re-themeable.** A Tailwind v4 fragment for consumers who run
  their own Tailwind build and want to control the theme. Import it after
  `@import "tailwindcss"`, point Tailwind at the library so it emits the
  component classes, then layer your own theme (your tokens win):

  ```css
  @import "tailwindcss";
  @import "choui/preset";
  @source "../node_modules/choui/dist";
  @plugin "daisyui/theme" { name: "brand"; default: true; /* … */ }
  ```

Importing **both** double-registers DaisyUI and collides themes — use one.

## Subpaths

| Subpath | Contents |
| --- | --- |
| `.` | Components-first barrel: components, the markup renderer, registry, contracts, packs, manifest/props re-exports. |
| `./ui` | Components only — the universal layer for any React game (`Card`, `Stats`, `DiceRoller`, `Timeline`, …). |
| `./markup` | The bracket-markup layer: `createStoryMarkup` / `StoryMarkup`, the registry, the inline-tag contract, the `StoryStateAdapter` type, and the shipped packs. |
| `./manifest` | Pure-string tag inventory (`INLINE_TAG_NAMES`, `INLINE_TAG_PROPS`, …). React-free — a compiler/validator reads the vocabulary without pulling React in. |
| `./props` | Declarative prop schema + `coerceProps`. React-free. |
| `./css` | Precompiled zero-config stylesheet (see above). |
| `./preset` | Re-themeable Tailwind v4 preset (see above). |

## The markup layer (optional)

For engines that emit authored bracket markup, `./markup` rewrites
`[name attr]…[/name]` into the registered components. The custom-element prefix is
a parameter with a neutral default — supply your own so existing authored/persisted
markup renders unchanged:

```ts
import { createStoryMarkup } from "choui/markup";
const StoryMarkup = createStoryMarkup({ prefix: "mygame-" }); // default: "ui-"
```

### No side effects on import

Importing the package registers **nothing**. Compose packs explicitly in the
order you want (inline core → samples; runtime preview → pause → community).
Registration order is a host decision, not a module-evaluation accident.

```ts
import {
  coreInlineTags,
  kbdPack,
  registerInlineTags,
  registerSampleRuntimePacks,
} from "choui/markup";

registerInlineTags(coreInlineTags);
registerInlineTags(kbdPack);
registerSampleRuntimePacks(); // idempotent; after the host's own processors
```

### Driving interactive tags: the `StoryStateAdapter`

Tags like `[link]`, `[board]`, and `[progress value="{var}"]` need four operations
from your engine: read a variable, set a variable, select a choice, and observe
variable changes. Implement the `StoryStateAdapter` interface (exported from `.`
and `./markup`) and feed its outputs into the renderer's runtime context. See
[`docs/story-state-adapter.md`](./docs/story-state-adapter.md) for the guide and
Wondo's Ink bridge as the reference implementation.

## Pack CSS

A pack may ship its own CSS as a **plain string constant** (resolved CSS — no
`@apply`/`@reference`; theme values left as `var(--color-*)`), registered via the
`styles` field or `registerTagStyles` and injected once by the reader. The library
bundles with tsup, which does not process Tailwind `?inline` imports.
Package-shipped selectors are namespaced under the neutral `choui-` prefix
(`choui-fx-*`, `choui-timeline`, `choui-hover-gallery`) — that prefix is public
API for host CSS.

## 3D device assets

The dice/spintop devices fetch textures and sounds at runtime from
`choui-three`'s `resolveAssetPath()` (default `/assets/choui-three/`). Either
vendor the assets — `node node_modules/choui-three/scripts/copy-assets.mjs`, a
good `postinstall` step — or use the jsDelivr CDN fallback (`preferCdn`). The 3D
path degrades gracefully to each tag's non-3D fallback if the engine can't load.
