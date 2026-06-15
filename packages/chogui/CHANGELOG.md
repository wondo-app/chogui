# Changelog

## 0.12.1

### Patch Changes

- Republish fix: `0.12.0` was published with `npm publish`, which does not rewrite
  the `workspace:*` protocol, so its `chogui-three` dependency shipped as the
  unresolvable `workspace:*` instead of the pinned `0.2.0`. No code change — this
  republish (via `pnpm publish`) pins `chogui-three@0.2.0`. `0.12.0` is deprecated.

## 0.12.0

### Minor Changes

- Complete the `chogui` rebrand: rename the package directories to `packages/chogui*`
  and rename the runtime/public identifiers off the old `choui` brand.

  **Breaking (pre-1.0, hence minor):**

  - `chogui-three`: the runtime asset path moves `/assets/choui-three/` →
    `/assets/chogui-three/` (`DEFAULT_ASSET_PATH` + the `copy-assets.mjs` default
    dest). Hosts re-run the copy step (it writes to the new path) and the engine
    reads from it; the two stay in lockstep within a version.
  - `chogui`: the package-shipped CSS selector prefix (public API) moves `choui-*`
    → `chogui-*` (`chogui-fx-*`, `chogui-timeline`, `chogui-hover-gallery`), and the
    injected style attribute is `data-chogui-tag-styles`.

### Patch Changes

- Updated dependencies
  - chogui-three@0.2.0

All notable changes to `chogui` are documented here. This package
is bundled at build time by the Wondo reader; there is no runtime tag loading.
The manifest (`src/manifest.ts`) is the authoritative inventory — every entry
below corresponds to a manifest entry's `addedIn`.

The format follows [Keep a Changelog](https://keepachangelog.com/), and the
package adheres to [Semantic Versioning](https://semver.org/). A version bump
accompanies any tag addition or removal.

## [Unreleased]

### Changed

- **BREAKING for operator CSS**: package-shipped class prefixes renamed from
  `wondo-*` to `chogui-*` ahead of the public publish — `chogui-fx-<slug>`,
  `chogui-timeline`, `chogui-hover-gallery`. The prefix is public API for
  operator stylesheets; it is settled now so the published package never
  breaks it. Console warnings are prefixed `[chogui]` for the same reason.
- **BREAKING for packs**: the inline render context's runtime fields
  (`observedVars`, `onSelectChoice`, `onSetVariable`) moved into a single
  optional `runtime` bag (`InlineTagRuntime`), which also adds `choices` —
  the pending branch choices (empty array ≡ absent; tags fall back to
  authored props).
- `[board]` Phase B: cells are the live branch choices (passed as an array so
  labels survive commas); selecting routes through `onSelectChoice`; a
  visible button legend renders below the canvas (also the keyboard /
  screen-reader path); a board with no labels and no live choices renders
  nothing.
- `[spintop]` self-roll writes once per mount (host callback identities may
  churn) and captions the landed face in HTML below the canvas.
- `[dice]` multi-value notation derives the die count from the value list
  (`value="3,5"` → two dice).
- Pack-CSS guidance in `contract.ts`/`styles.ts` now matches `fx.css`:
  `@reference "tailwindcss"`, never an app-relative stylesheet.
- `package.json` declares `license: MIT`, `files`, and `sideEffects: false`
  ahead of the coordinated publish (as `chogui`, versioned and published
  together with `chogui-three`).

## [0.10.0] — dice as a read-only visualizer: `[dice]` (replaces `[roll]`)

The interactive write-die `[roll]` is **removed** and replaced by `[dice]`, a
read-only dice-box visualizer of a value **decided in Ink**. `[roll]` generated
its value client-side (crypto) and bound it via `onSetVariable` — which can't
drive a branch through replay (the `vars` snapshot is re-applied only after the
re-walk, so a mid-walk branch reproduces the wrong knot). Ink's seeded `RANDOM()`
recomputes in place, branches included, so randomness that drives the plot belongs
to Ink; the die only shows it.

### Added

- `dice` (void) — `[dice notation="d20" value="{check}"]`. Reads `value` (a literal
  or observed `{var}`, resolved at the render boundary like `[progress]`) and
  tumbles a die of the `notation` geometry to that face. Multiple dice read a
  comma-list of per-die values (`value="{a},{b}"`); the die count comes from the
  number of values; out-of-range values are clamped. `reveal="auto"` (default)
  tumbles on mount, `reveal="click"` defers it to a reader gesture. Props:
  `notation`, `value`, `size`, `color`, `texture`, `pips`, `sound`, `reveal`.
  `pips` (`auto`/`light`/`dark`) overrides the numeral color for legibility on
  busy textures. Generates no randomness and writes no variable.
- `DiceRoller` gains a **controlled** mode (`values` prop) used by `[dice]`; the
  self-roll mode is retained only for the Ladle theme-tuning story.
- `predeterminedNotationFor(notation, values)` and `resolveValues(expr, observed)`
  exported as building blocks (predetermined `@`-notation from explicit faces; a
  comma-list value resolver).

### Removed

- `roll` — the client-RNG write-die and its `onSetVariable` value binding. The
  host `onSetVariable` channel remains for true external input (e.g. a typed name)
  that Ink cannot generate; it MUST NOT gate a divert.

### Determinism

- Branch-driving randomness MUST come from Ink (`RANDOM` / the `random.ink`
  stdlib, e.g. `pick*`/`bucket_random*` for flavor), reproduced by the seeded
  re-walk. See `docs/custom-tags.md` for the source-selection table.

## [0.9.0] — interactive dice: `[roll]` (replaces `[dice]`)

The display `[dice]` (CSS cube) is **removed** and replaced by `[roll]`, the
interactive dice _function_: click to throw, the dice-box-threejs (WebGL) dice
land on the rolled values, and the total is assigned to a story variable that
Ink reads to drive mechanics.

### Added

- `roll` (void) — `[roll dice="2d6+3" var="atk"]`. Composes the `random` source
  (decides the values), the `dice` view (dice-box-threejs, visualizes them as a
  _predetermined_ roll via `@`-notation), and variable assignment via the host
  `onSetVariable` channel. Robust: the total is computed up front, so the
  assignment still happens if the 3D fails to load. The target `var` MUST be
  `# observe:`d so the value persists across replay.
- `logic/random` (`parseNotation` / `rollNotation` / `predeterminedNotation`) and
  `markup/DiceRoller` are exported as composable building blocks for future
  meta-tags (e.g. `[attack]`).
- `roll` props: `size` (`sm`/`md`/`lg`), `color` (Wondo palette), and `sound`
  (boolean, default `false`). The standalone `DiceRoller` view additionally takes
  `texture`. Sound is off by default (restrained); dice-box scales hit volume by
  impact velocity, so it is intentionally faint under gentle physics.
- dice-box-threejs runtime assets (dice textures + hit/surface sounds) are
  vendored into `public/assets/dice-box-threejs/` at install/build time by
  `scripts/copy-dice-assets.mjs` and served via `assetPath`. The Ladle sandbox
  serves them through its `publicDir`.

### Removed

- `dice` — the CSS-cube display tag and its cube CSS.

### Dependencies

- `@3d-dice/dice-box-threejs` (three.js + Cannon-ES), lazy-loaded in a client
  island so it stays out of the main reader bundle.

## [0.8.0] — branch-review refinements

Usability + correctness fixes from a branch review (no new tags):

- `group` — now **margin-free** (like `[block]`); spacing is compositional, so a
  `[group]` nested in a card / carousel-item / another group adds no surprise
  margin.
- `window-mockup` — gains an optional `title` prop, rendered as a caption in the
  window chrome.
- `icon` — adds a small UI-affordance subset to the curated set: `check`,
  `close`, `plus`, `minus`, `arrow-right`, `arrow-left`.
- `countdown` — simplified the `max` clamp (`Math.min(max, n)`); `0` already
  displayed, but the prior `Math.max(1, max)` was a smell.

## [0.7.0] — game-fiction tags: `icon` + `dice`

First slice of gamebook-style tags. Both are display-only void tags rendered
with the small-press restraint the brand requires (no neon/reward-loop UI).

### Added

- `icon` (void) — a curated lucide glyph (≈20 game-fiction icons) with
  `name`/`size`/`variant`. The name resolves against an explicit allowlist
  (`markup/Icon.tsx`); an unknown name renders nothing. Defaults to
  `currentColor` so it inherits the prose ink.
- `dice` (void) — displays an **Ink-rolled** value (`value`, `sides`, `variant`,
  cosmetic `tumble`). The value is decided in Ink (`random.ink`, surfaced via
  `# observe:`) and read from observed vars like `[progress]`; the component
  **never** rolls client-side, preserving deterministic replay. A d6 shows the
  pip glyph; with `tumble` it renders a 3D CSS cube (six faces on a `preserve-3d`
  transform, technique adapted from alexerlandsson/dice) that spins once on mount
  and settles on the rolled face — the spin is cosmetic; the face is fixed to the
  value, and `prefers-reduced-motion` is honored. The cube CSS ships via the
  tag's `styles` (namespaced `wondo-dice`). Other `sides` show a numbered chip.

### Dependencies

- Peer `lucide-react` (icons for `icon`/`dice`).

## [0.6.0] — `group` layout primitive replaces carousel `slide`

Refactor the carousel's slide model into a reusable layout primitive.

### Added

- `group` (paired) — a flex layout primitive with full control: `direction`
  (`vertical`/`horizontal`), `gap`, `align`, `justify`. Reusable anywhere (stack
  an image over a caption, lay elements side by side), and the way to compose a
  multi-element carousel slide. Sibling to the `block` width primitive.

### Changed

- `carousel` now **auto-wraps** each top-level child as a slide — an element
  becomes a `carousel-item`, bare text splits into one slide per non-empty line —
  so authors no longer wrap each item in a tag. A multi-element slide is a single
  `[group]` child.

### Removed

- `slide` — the carousel-only wrapper is gone (never released); `[group]` covers
  composite slides and is reusable beyond carousels.

## [0.5.0] — DaisyUI motion components (catalog Wave 3)

Final catalog wave: motion/interactive primitives.

### Inline tags (React)

- `text-rotate` (paired) — DaisyUI `text-rotate`; its rotating phrases are the
  newline-separated lines of its content (a flat plain-text list — no per-item
  tag). CSS-only animation; degrades to a single static phrase if no newlines
  survive the prose pipeline.
- `hover-gallery` (paired) — DaisyUI `hover-gallery`; wraps reused `[img]`
  children (≤10). Ships a small co-located style (namespaced under
  `wondo-hover-gallery`) resetting `[img]`'s margins for the stacked layout.
- `countdown` (void) — DaisyUI `countdown`, dual-mode: static `--value` display
  by default (literal/`{var}` like `progress`, with `max`/`digits`/`variant`), or
  `tick="true" from="N"` for a client island that counts down once from `N` to 0.

## [0.4.0] — DaisyUI sequence components (catalog Wave 2)

Second catalog wave: ordered/sequential structures. `breadcrumbs` is a flat
plain-text list (comma-delimited `items`, no per-item tag); the rest are matched
parent+child tag-sets whose items carry per-item config or rich content. Color
enums stay on semantic roles.

### Inline tags (React)

- `breadcrumbs` (void) — DaisyUI `breadcrumbs`; one crumb per comma-split label
  in `items`.
- `steps` (paired; `direction`) + `step` (paired; `variant`) — DaisyUI
  `steps`/`step`.
- `timeline` (paired; `direction`) + `event` (paired; `time`, `icon`) — DaisyUI
  `timeline`. `timeline` ships a small co-located CSS (via `styles`, namespaced
  under `wondo-timeline`) hiding the outer `<hr>` connectors on the first/last
  event, so each `event` can render position-agnostically.
- `carousel` (paired; `snap`) + `slide` (paired) — DaisyUI `carousel`; slides
  hold reused `[img]`/`[picture]` or prose.

## [0.3.0] — DaisyUI display components (catalog Wave 1)

First wave of the DaisyUI-backed component catalog
(`extend-story-tag-component-library`): card, data-display, and mockup
primitives. Nested content — especially images — is authored as child tags
inside the body, never as a prop; props carry scalar config only. Color enums
stay on DaisyUI's semantic roles (`primary` / `info` / `success` / `warning` /
`error` / `neutral`); `secondary` / `accent` are omitted.

### Inline tags (React)

- `card` (paired) — DaisyUI `card`; heading via `title`, layout via `variant`
  (`default` / `border` / `side`), `size` (`xs`–`xl`). Image and body are nested
  children (e.g. `[card title="…"][img src="…"]body[/card]`).
- `tooltip` (paired) — DaisyUI `tooltip`; `tip` text, `placement`
  (`top` / `bottom` / `left` / `right`), optional `variant` color.
- `radial-progress` (void) — circular sibling of `progress`; same literal/`{var}`
  `value` contract, `max`, `variant`, and optional `size` (ring diameter).
- `stats` (paired) + `stat` (void) — DaisyUI `stats`/`stat`; `stats` flows
  `horizontal` / `vertical`, each `stat` carries `title` / `value` / `desc`.
- `window-mockup` (paired) — DaisyUI `mockup-window` framing its children.

## [0.2.1] — tags adopt DaisyUI components

Presentational refactor: tags now render through their genuine DaisyUI
component (inheriting the `wondo` theme) instead of hand-rolled Tailwind, so
the reader and the Ladle sandbox match and no pack CSS is shipped. Author
syntax and tag names are unchanged; the DaisyUI tags additionally expose their
component's modifier surface as optional, defaulted `props` (each default
reproduces the prior render, so existing stories are unchanged).

### Changed (rendering only)

- `chat` / `bubble` — message bubbles now use DaisyUI `chat` (`chat-start` /
  `chat-end`, `chat-header`, `chat-bubble` + `chat-bubble-primary` for self);
  the chat header avatar uses DaisyUI `avatar`.
- `info` — DaisyUI `alert alert-soft alert-info` (dropped manual fill/text
  overrides).
- `banner` — DaisyUI `alert alert-soft`.
- `link` — DaisyUI `link link-primary`.
- `kbd` — DaisyUI `kbd kbd-sm`.

### Added (props — DaisyUI modifier surface, semantic colors only)

Colors are limited to DaisyUI's semantic roles
(`info` / `success` / `warning` / `error` / `neutral`, plus `primary` where it is
already the tag's default); `secondary` / `accent` are deliberately omitted.

- `info` — `variant` (`info` default), `style` (`soft` default).
- `banner` — `variant` (`none` default — no color), `style` (`soft` default).
- `progress` — `variant` (`primary` default).
- `link` — `variant` (`primary` default), `hover` (boolean, `link-hover`).
- `kbd` — `size` (`sm` default).
- `bubble` — `tone` (`auto` default — keeps the sent/received color).

## [0.2.0] — phone-chat coordinating sample

Adds the reference _coordinating_ tag-set (contrast the child-agnostic core
built-ins): two inline tags that cooperate across slots via React context.

### Inline tags (React)

- `chat` (paired) — phone-chat frame + header; provides `self` via context
  (`self`, `title`).
- `bubble` (paired) — message bubble; reads `self` from the surrounding `chat`
  to align sent (right) vs received (left) and degrades gracefully when used
  alone (`from`).

## [0.1.0] — initial extracted set

First release, extracted from the app's in-tree `src/lib/story/tags/` into a
standalone workspace package (`extensible-story-tags` Phase 5).

### Inline tags (React)

- `divider` (void) — horizontal-rule flourish (`[---]`).
- `highlight` (paired) — inline emphasis.
- `info` (paired) — inline info note.
- `banner` (paired) — call-out banner.
- `spoiler` (paired) — click-to-reveal spoiler.
- `block` (paired) — width-constrained block (`width`).
- `link` (paired) — choice-driving link (`choice`).
- `progress` (void) — observed-variable progress bar (`value`, `max`).
- `picture` (void) — captioned figure (`src`, `alt`, `caption`, `variation`).
- `img` (void) — bare image (`src`, `alt`).
- `kbd` (paired) — sample community pack: keyboard-key glyph.

### Runtime tags (scene processors)

- `fx` — sample community pack: sets the `className` bridge directive
  (`# fx: <name>` → `wondo-fx-<slug>`), ships its own `?inline` CSS.
