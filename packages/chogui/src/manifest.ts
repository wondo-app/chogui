// Component manifest — the package's pure-data inventory of every tag it ships.
//
// This module is intentionally free of React and any runtime side effect so the
// compiler/validator (wondo-ink) can import it via the `./manifest` subpath
// without dragging the reader's markup components into its build graph. (The
// `InlineTagKind` import below is type-only, so it is erased at build time and
// pulls nothing from `./contract`.)
//
// The manifest is the single reviewable list of what the package ships and when
// each tag was added: the validator's enabled-tag set and the docs catalog both
// read from it rather than maintaining parallel lists, and `CHANGELOG.md`
// narrates additions across versions. A version bump accompanies any tag
// addition or removal (see `package.json`).
//
// The tag NAMES are hand-listed here (the definitions that own them carry JSX,
// which we must not import). `enabled-tags-consistency.test.ts` guards them
// against drift from the live registry, so a tag added to `builtins.tsx` /
// `packs/*` without a manifest entry fails CI.

import type { PropSchema } from "./props";
import type { InlineTagKind } from "./tag-kind";

/** A directive in the fixed bridge vocabulary that a runtime tag may set. */
export type RuntimeTagDirective = "paused" | "autoAdvanceMs" | "className";

/** One inline (React) tag the package ships. */
export interface InlineTagManifestEntry {
  /** Lowercased tag name, e.g. `highlight`. */
  name: string;
  /** Void (no children) vs paired (wraps children). */
  kind: InlineTagKind;
  /** Package semver this tag first shipped in. */
  addedIn: string;
  /**
   * The tag's declarative attribute schema, when it declares one. This is the
   * single source `builtins.tsx` attaches to the live definition, the validator
   * checks authored attribs against (React-free, via `./manifest`), and the docs
   * catalog renders as a prop table. Tags with no authored attributes omit it.
   */
  props?: PropSchema;
}

/** One runtime (scene-processor) tag the package ships. */
export interface RuntimeTagManifestEntry {
  /** Lowercased tag name, e.g. `fx`. */
  name: string;
  /** The bridge directive the processor sets. */
  directive: RuntimeTagDirective;
  /** Package semver this tag first shipped in. */
  addedIn: string;
}

// Per-tag prop schemas for the tags that take authored attributes. Declared
// here (React-free) so the live definitions in `builtins.tsx`, the React-free
// validator, and the docs catalog all read one object. Tags with no authored
// attributes (divider, highlight, spoiler) declare no schema.
//
// The DaisyUI-backed tags expose their component's modifier surface as enum
// props so authors (and the Ladle sandbox) can explore variants. We deliberately
// limit colors to DaisyUI's *semantic* roles (info/success/warning/error/neutral,
// plus `primary` where it's already the tag's default) and omit secondary/accent
// — a restrained palette reads as literary, not a SaaS rainbow.
export const blockProps: PropSchema = {
  width: {
    type: "string",
    description: "CSS length constraining the block's max-width, e.g. `50%` or `32rem`.",
  },
};

export const linkProps: PropSchema = {
  choice: {
    type: "number",
    description: "Zero-based id of the Atrament choice this link selects when clicked.",
  },
  variant: {
    type: "enum",
    enum: ["primary", "info", "success", "warning", "error", "neutral"],
    default: "primary",
    description: "DaisyUI link color (`link-*`). Defaults to the brand primary.",
  },
  hover: {
    type: "boolean",
    default: false,
    description: "When true, underline only on hover (`link-hover`).",
  },
};

export const progressProps: PropSchema = {
  value: {
    type: "string",
    description: "A numeric literal or a `{var}` reference to an observed Ink variable.",
  },
  max: {
    type: "number",
    default: 100,
    description: "Upper bound of the bar; the fill is `value / max`.",
  },
  variant: {
    type: "enum",
    enum: ["primary", "info", "success", "warning", "error", "neutral"],
    default: "primary",
    description: "DaisyUI fill color (`progress-*`). Defaults to the brand primary.",
  },
};

// Quiet in-prose aside, rendered as a soft DaisyUI alert.
export const infoProps: PropSchema = {
  variant: {
    type: "enum",
    enum: ["info", "success", "warning", "error"],
    default: "info",
    description: "DaisyUI alert color (`alert-*`).",
  },
  style: {
    type: "enum",
    enum: ["soft", "outline", "dash"],
    default: "soft",
    description: "DaisyUI alert style (`alert-*`).",
  },
};

// Louder full-width flourish, rendered as a DaisyUI alert. Defaults to no color
// (`variant: "none"`) so it reads as a neutral literary banner, not a notice.
export const bannerProps: PropSchema = {
  variant: {
    type: "enum",
    enum: ["none", "info", "success", "warning", "error"],
    default: "none",
    description: "DaisyUI alert color (`alert-*`); `none` omits the color for a neutral banner.",
  },
  style: {
    type: "enum",
    enum: ["soft", "outline", "dash"],
    default: "soft",
    description: "DaisyUI alert style (`alert-*`).",
  },
};

// Keyboard glyph, rendered as a DaisyUI `kbd`.
export const kbdProps: PropSchema = {
  size: {
    type: "enum",
    enum: ["xs", "sm", "md", "lg", "xl"],
    default: "sm",
    description: "DaisyUI keycap size (`kbd-*`).",
  },
};

export const pictureProps: PropSchema = {
  src: { type: "string", description: "Image URL." },
  alt: { type: "string", description: "Accessible alt text." },
  caption: { type: "string", description: "Caption rendered beneath the figure." },
  variation: {
    type: "enum",
    enum: ["full-bleed", "side"],
    description: "Layout variation; omit for a centered, below-captioned figure.",
  },
};

export const imgProps: PropSchema = {
  src: { type: "string", description: "Image URL." },
  alt: { type: "string", description: "Accessible alt text." },
};

// Phone-chat coordinating tag-set (sample). `chat` provides `self` via React
// context; `bubble` reads it to decide sent (right) vs received (left). None of
// these are `required` — each tag degrades gracefully (a `bubble` outside a
// `chat` falls back to the received treatment), which the worked example shows.
export const chatProps: PropSchema = {
  self: {
    type: "string",
    description: "Speaker id treated as the author's own messages (aligned right, no label).",
  },
  title: {
    type: "string",
    description: "Conversation title shown in the chat header.",
  },
};

export const bubbleProps: PropSchema = {
  from: {
    type: "string",
    description: "Sender id; matched against the chat's `self` to pick sent vs received styling.",
  },
  tone: {
    type: "enum",
    enum: ["auto", "primary", "info", "success", "warning", "error", "neutral"],
    default: "auto",
    description:
      "DaisyUI bubble color (`chat-bubble-*`). `auto` keeps the sent/received default (sent = primary).",
  },
};

// ── DaisyUI display components (Wave 1) ──────────────────────────────────────
// Nested content (especially images) is authored as child tags, never props;
// props below carry scalar config only. Color enums stay on DaisyUI's semantic
// roles (no secondary/accent), per the literary palette.
export const cardProps: PropSchema = {
  title: {
    type: "string",
    description: "Optional heading rendered as `.card-title` above the nested body.",
  },
  variant: {
    type: "enum",
    enum: ["default", "border", "side"],
    default: "default",
    description: "Card layout: plain, bordered (`card-border`), or horizontal (`card-side`).",
  },
  size: {
    type: "enum",
    enum: ["xs", "sm", "md", "lg", "xl"],
    default: "md",
    description: "DaisyUI card size (`card-*`).",
  },
};

export const tooltipProps: PropSchema = {
  tip: { type: "string", description: "Tooltip text revealed on hover/focus." },
  placement: {
    type: "enum",
    enum: ["top", "bottom", "left", "right"],
    default: "top",
    description: "DaisyUI tooltip placement (`tooltip-*`).",
  },
  variant: {
    type: "enum",
    enum: ["primary", "info", "success", "warning", "error", "neutral"],
    description: "DaisyUI tooltip color (`tooltip-*`); omit for the neutral default.",
  },
};

export const radialProgressProps: PropSchema = {
  value: {
    type: "string",
    description: "A numeric literal or a `{var}` reference to an observed Ink variable.",
  },
  max: {
    type: "number",
    default: 100,
    description: "Upper bound of the ring; the fill is `value / max`.",
  },
  variant: {
    type: "enum",
    enum: ["primary", "info", "success", "warning", "error", "neutral"],
    default: "primary",
    description: "DaisyUI ring color (`text-*`). Defaults to the brand primary.",
  },
  size: {
    type: "string",
    description: "CSS length for the ring diameter (`--size`), e.g. `5rem`. Omit for the default.",
  },
};

export const statsProps: PropSchema = {
  direction: {
    type: "enum",
    enum: ["horizontal", "vertical"],
    default: "horizontal",
    description: "DaisyUI stats flow (`stats-*`).",
  },
};

export const statProps: PropSchema = {
  title: { type: "string", description: "Label above the figure (`.stat-title`)." },
  value: { type: "string", description: "The headline figure (`.stat-value`)." },
  desc: { type: "string", description: "Supporting note below the figure (`.stat-desc`)." },
};

export const windowMockupProps: PropSchema = {
  title: { type: "string", description: "Optional caption shown in the window chrome." },
};

// ── DaisyUI sequence components (Wave 2) ─────────────────────────────────────
// `breadcrumbs` is a flat plain-text list (comma-delimited `items`); the rest
// are matched parent+child tag-sets whose items carry per-item config or rich
// content (so they keep child tags). Color enums stay on semantic roles.
export const breadcrumbsProps: PropSchema = {
  items: {
    type: "string",
    description: "Comma-delimited labels, e.g. `Prologue, The Forest, The Tower`.",
  },
};

export const stepsProps: PropSchema = {
  direction: {
    type: "enum",
    enum: ["horizontal", "vertical"],
    default: "horizontal",
    description: "DaisyUI steps flow (`steps-*`).",
  },
};

export const stepProps: PropSchema = {
  variant: {
    type: "enum",
    enum: ["primary", "info", "success", "warning", "error", "neutral"],
    description: "DaisyUI step color (`step-*`); omit for the neutral default.",
  },
};

export const timelineProps: PropSchema = {
  direction: {
    type: "enum",
    enum: ["vertical", "horizontal"],
    default: "vertical",
    description: "DaisyUI timeline flow (`timeline-*`).",
  },
};

export const eventProps: PropSchema = {
  time: { type: "string", description: "Time/label rendered on the `timeline-start` side." },
  icon: {
    type: "string",
    description: "Optional glyph for the `timeline-middle` marker; omit for a default dot.",
  },
};

export const carouselProps: PropSchema = {
  snap: {
    type: "enum",
    enum: ["start", "center", "end"],
    default: "start",
    description: "DaisyUI carousel snap alignment (`carousel-*`).",
  },
};

// ── DaisyUI motion components (Wave 3) ───────────────────────────────────────
// `text-rotate` and `hover-gallery` take no authored attributes (their items are
// newline-separated content / nested `[img]` children). `countdown` is dual-mode.
export const countdownProps: PropSchema = {
  value: {
    type: "string",
    description: "Static mode: a numeric literal or `{var}` reference (0–999).",
  },
  max: {
    type: "number",
    description: "Optional upper clamp for the resolved static `value`.",
  },
  digits: {
    type: "number",
    description: "Minimum digit width (`--digits`), e.g. `2` for a zero-padded look.",
  },
  variant: {
    type: "enum",
    enum: ["primary", "info", "success", "warning", "error", "neutral"],
    description: "DaisyUI number color (`text-*`); omit for the default ink.",
  },
  tick: {
    type: "boolean",
    default: false,
    description: "When true, count down once from `from` to 0 on mount (client island).",
  },
  from: {
    type: "number",
    description: "Ticking mode: the starting value to count down from (0–999).",
  },
};

// ── Game-fiction tags (0.7.0) ────────────────────────────────────────────────
// `icon` is a curated glyph primitive; `dice` displays an Ink-rolled value (it
// never rolls client-side — randomness is decided in Ink and observed). The
// `icon.name` enum is the React-free mirror of the curated map in
// `markup/Icon.tsx` (a test guards the two against drift).
export const iconProps: PropSchema = {
  name: {
    type: "enum",
    enum: [
      "heart",
      "sword",
      "swords",
      "key",
      "coin",
      "gem",
      "potion",
      "shield",
      "skull",
      "scroll",
      "flame",
      "bolt",
      "map",
      "crown",
      "book",
      "lock",
      "eye",
      "star",
      "compass",
      "footprints",
      "check",
      "close",
      "plus",
      "minus",
      "arrow-right",
      "arrow-left",
    ],
    description: "Curated glyph name (lucide-backed).",
  },
  size: {
    type: "enum",
    enum: ["xs", "sm", "md", "lg"],
    default: "sm",
    description: "Glyph size.",
  },
  variant: {
    type: "enum",
    enum: ["primary", "info", "success", "warning", "error", "neutral"],
    description: "DaisyUI color (`text-*`); omit to inherit the prose ink (`currentColor`).",
  },
};

// `[dice]` — the read-only dice-box visualizer of a value DECIDED IN INK. It
// reads `value` (a literal or observed `{var}`; comma-list for multiple dice)
// and tumbles the dice to those faces. It does NOT generate randomness or write
// a variable — Ink owns the roll (`RANDOM`/the `random.ink` stdlib), which keeps
// branch-driving randomness replay-safe (the seeded re-walk recomputes it).
export const diceProps: PropSchema = {
  notation: {
    type: "string",
    default: "d6",
    description: "Die geometry/faces, e.g. `d20`, `2d6` (the die count comes from the number of `value`s).",
  },
  value: {
    type: "string",
    description:
      "Face value(s) to show — a literal or observed `{var}` (e.g. `{check}`); a comma-list for multiple dice (`{a},{b}`). Out-of-range values are clamped.",
  },
  size: {
    type: "enum",
    enum: ["sm", "md", "lg"],
    default: "md",
    description: "Tray + dice size.",
  },
  color: {
    type: "enum",
    enum: ["bone", "ink", "sage", "amber", "coral", "sky"],
    default: "bone",
    description: "Dice color variant (theme palette).",
  },
  texture: {
    type: "enum",
    enum: [
      "none",
      "paper",
      "marble",
      "speckles",
      "stone",
      "wood",
      "metal",
      "glitter",
      "stars",
      "astral",
      "water",
      "ice",
      "fire",
      "cloudy",
      "dragon",
      "leopard",
      "skulls",
    ],
    default: "none",
    description: "Surface texture overriding the colorset's flat finish.",
  },
  pips: {
    type: "enum",
    enum: ["auto", "light", "dark"],
    default: "auto",
    description:
      "Numeral color: `auto` uses the color variant's default; set `light`/`dark` for legibility when a busy or darkening texture swallows the default.",
  },
  sound: {
    type: "boolean",
    default: false,
    description: "Play the dice-box hit/surface sounds on reveal. Off by default (restrained).",
  },
  reveal: {
    type: "enum",
    enum: ["auto", "click"],
    default: "auto",
    description: "`auto` tumbles on mount; `click` waits for a reader gesture to play the reveal.",
  },
  shadow: {
    type: "boolean",
    default: false,
    description: "Enable soft shadows beneath the dice.",
  },
};

// `[board]` (0.11.0) — a choice board: the piece moves to one of N cells. In the live
// reader the cells come from the branch choices (selection routes through
// `onSelectChoice`); `labels`/`value` here drive the sandbox/demo.
export const boardProps: PropSchema = {
  layout: {
    type: "enum",
    enum: ["ring", "half", "track", "grid"],
    default: "ring",
    description: "Cell layout: `ring` (circle), `half` (semicircle), `track` (straight row), or `grid` (3-across grid).",
  },
  labels: {
    type: "string",
    description:
      "Comma-separated cell labels (sandbox/demo). The live reader uses the branch choices instead.",
  },
  value: {
    type: "string",
    description:
      "Target cell index the piece moves to (sandbox/demo) — a literal or observed `{var}`.",
  },
  size: {
    type: "enum",
    enum: ["sm", "md", "lg"],
    default: "md",
    description: "Board size.",
  },
  piece: {
    type: "enum",
    enum: ["cone", "skittle", "pin"],
    default: "skittle",
    description: "Piece body shape: cone, skittle (rounded pawn), or pin (ball-on-base).",
  },
  color: {
    type: "enum",
    enum: ["bone", "ink", "sage", "amber", "coral", "sky"],
    default: "bone",
    description: "Cell label color variant (theme palette).",
  },
  texture: {
    type: "enum",
    enum: [
      "none",
      "paper",
      "marble",
      "speckles",
      "stone",
      "wood",
      "metal",
      "glitter",
      "stars",
      "astral",
      "water",
      "ice",
      "fire",
      "cloudy",
      "dragon",
      "leopard",
      "skulls",
    ],
    default: "none",
    description: "Surface texture for the board piece (same set as [dice]).",
  },
  sound: {
    type: "boolean",
    default: true,
    description: "Play the piece landing sound.",
  },
  shadow: {
    type: "boolean",
    default: false,
    description: "Enable soft shadows beneath the board.",
  },
};

// `[spintop]` (0.11.0) — an N-sided spinning top (teetotum) on the chogui-three engine,
// driven by a cannon-es solver. The 3D tumble is decorative. Dual-mode like `[coin]`:
// `value` visualizes an Ink-decided face (branch-safe); `var` (no `value`) self-rolls a
// face client-side and writes it to an observed variable (FLAVOR only). Faces show the
// `actions` text (or numbers when unlabelled).
export const spintopProps: PropSchema = {
  actions: {
    type: "string",
    description:
      "Comma-separated SHORT face labels (4 or 6 faces, 1–2 chars each, e.g. `T1, P2, TT, TP`). Longer text is truncated to 2 chars; faces are numbered when unlabelled.",
  },
  sides: {
    type: "number",
    description: "Number of sides — 4 or 6 (even only); defaults to the number of actions.",
  },
  value: {
    type: "string",
    description:
      "Visualizer mode: the Ink-decided face index (0-based) — a literal or observed `{var}`. Generates no randomness; branch-safe.",
  },
  var: {
    type: "string",
    description:
      "Self-roll target: an observed Ink variable to write a client-picked face index to. Flavor only — must not gate a branch (set `flavor`).",
  },
  size: {
    type: "enum",
    enum: ["sm", "md", "lg"],
    default: "md",
    description: "Top size.",
  },
  color: {
    type: "enum",
    enum: ["bone", "ink", "sage", "amber", "coral", "sky"],
    default: "bone",
    description: "Body color the whole top is tinted with (theme palette).",
  },
  texture: {
    type: "enum",
    enum: [
      "none",
      "paper",
      "marble",
      "speckles",
      "stone",
      "wood",
      "metal",
      "glitter",
      "stars",
      "astral",
      "water",
      "ice",
      "fire",
      "cloudy",
      "dragon",
      "leopard",
      "skulls",
    ],
    default: "none",
    description: "Surface texture for every face/surface (same set as `[dice]`).",
  },
  sound: {
    type: "boolean",
    default: true,
    description: "Play wood roll/hit sounds as the top settles.",
  },
  flavor: {
    type: "boolean",
    default: false,
    description:
      "Acknowledge self-roll is flavor-only (non-branching). Set `true` to silence the self-roll warning.",
  },
  shadow: {
    type: "boolean",
    default: false,
    description: "Enable soft shadows beneath the top.",
  },
};

// ── Layout primitive (0.6.0) ─────────────────────────────────────────────────
// `group` is a reusable flex container (full flex control). It is also how a
// `[carousel]` slide holds more than one element — the carousel auto-wraps each
// top-level child as a slide, and a `[group]` is one such child (one slide).
export const groupProps: PropSchema = {
  direction: {
    type: "enum",
    enum: ["vertical", "horizontal"],
    default: "vertical",
    description: "Flex axis: `vertical` (`flex-col`) or `horizontal` (`flex-row`).",
  },
  gap: {
    type: "enum",
    enum: ["none", "sm", "md", "lg"],
    default: "md",
    description: "Spacing between children (`gap-*`).",
  },
  align: {
    type: "enum",
    enum: ["start", "center", "end", "stretch", "baseline"],
    description: "Cross-axis alignment (`items-*`); omit for the flex default.",
  },
  justify: {
    type: "enum",
    enum: ["start", "center", "end", "between", "around", "evenly"],
    description: "Main-axis distribution (`justify-*`); omit for the flex default.",
  },
};

/**
 * Inline tags this package registers: the 10 core built-ins + the `kbd` sample.
 * Order mirrors `coreInlineTags` in `./builtins` then community samples.
 */
export const INLINE_TAG_MANIFEST: readonly InlineTagManifestEntry[] = [
  // Core inline pack (mirrors `coreInlineTags` in ./builtins).
  { name: "divider", kind: "void", addedIn: "0.1.0" },
  { name: "highlight", kind: "paired", addedIn: "0.1.0" },
  { name: "info", kind: "paired", addedIn: "0.1.0", props: infoProps },
  { name: "banner", kind: "paired", addedIn: "0.1.0", props: bannerProps },
  { name: "spoiler", kind: "paired", addedIn: "0.1.0" },
  { name: "block", kind: "paired", addedIn: "0.1.0", props: blockProps },
  { name: "link", kind: "paired", addedIn: "0.1.0", props: linkProps },
  { name: "progress", kind: "void", addedIn: "0.1.0", props: progressProps },
  { name: "picture", kind: "void", addedIn: "0.1.0", props: pictureProps },
  { name: "img", kind: "void", addedIn: "0.1.0", props: imgProps },
  // Sample community inline pack (proves the contributor PR path).
  { name: "kbd", kind: "paired", addedIn: "0.1.0", props: kbdProps },
  // Phone-chat coordinating tag-set (sample): the reference pattern for tags
  // that cooperate across slots via React context (see ./packs/phone-chat).
  { name: "chat", kind: "paired", addedIn: "0.2.0", props: chatProps },
  { name: "bubble", kind: "paired", addedIn: "0.2.0", props: bubbleProps },
  // DaisyUI display components (Wave 1).
  { name: "card", kind: "paired", addedIn: "0.3.0", props: cardProps },
  { name: "tooltip", kind: "paired", addedIn: "0.3.0", props: tooltipProps },
  { name: "radial-progress", kind: "void", addedIn: "0.3.0", props: radialProgressProps },
  { name: "stats", kind: "paired", addedIn: "0.3.0", props: statsProps },
  { name: "stat", kind: "void", addedIn: "0.3.0", props: statProps },
  { name: "window-mockup", kind: "paired", addedIn: "0.3.0", props: windowMockupProps },
  // DaisyUI sequence components (Wave 2).
  { name: "breadcrumbs", kind: "void", addedIn: "0.4.0", props: breadcrumbsProps },
  { name: "steps", kind: "paired", addedIn: "0.4.0", props: stepsProps },
  { name: "step", kind: "paired", addedIn: "0.4.0", props: stepProps },
  { name: "timeline", kind: "paired", addedIn: "0.4.0", props: timelineProps },
  { name: "event", kind: "paired", addedIn: "0.4.0", props: eventProps },
  { name: "carousel", kind: "paired", addedIn: "0.4.0", props: carouselProps },
  // DaisyUI motion components (Wave 3).
  { name: "text-rotate", kind: "paired", addedIn: "0.5.0" },
  { name: "hover-gallery", kind: "paired", addedIn: "0.5.0" },
  { name: "countdown", kind: "void", addedIn: "0.5.0", props: countdownProps },
  // Layout primitive (replaces the carousel-only `slide`).
  { name: "group", kind: "paired", addedIn: "0.6.0", props: groupProps },
  // Game-fiction tags.
  { name: "icon", kind: "void", addedIn: "0.7.0", props: iconProps },
  { name: "dice", kind: "void", addedIn: "0.10.0", props: diceProps },
  { name: "board", kind: "void", addedIn: "0.11.0", props: boardProps },
  { name: "spintop", kind: "void", addedIn: "0.11.0", props: spintopProps },
] as const;

/** Sample community runtime tags this package registers (`registerSampleRuntimePacks`). */
export const RUNTIME_TAG_MANIFEST: readonly RuntimeTagManifestEntry[] = [
  { name: "fx", directive: "className", addedIn: "0.1.0" },
] as const;

/**
 * Inline tag names, derived from the manifest. Kept as a flat list for the
 * validator's enabled-set and other name-only consumers.
 */
export const INLINE_TAG_NAMES: readonly string[] = INLINE_TAG_MANIFEST.map(
  (entry) => entry.name,
);

/** Sample community runtime tag names, derived from the manifest. */
export const RUNTIME_SAMPLE_TAG_NAMES: readonly string[] = RUNTIME_TAG_MANIFEST.map(
  (entry) => entry.name,
);

/**
 * Inline tag name → prop schema, derived from the manifest for the tags that
 * declare one. The craft validator reads this (injected, React-free) to check
 * authored attributes; consumers that already hold a live definition read
 * `definition.props` instead (same object).
 */
export const INLINE_TAG_PROPS: Readonly<Record<string, PropSchema>> = Object.fromEntries(
  INLINE_TAG_MANIFEST.filter((entry) => entry.props !== undefined).map((entry) => [
    entry.name,
    entry.props as PropSchema,
  ]),
);
