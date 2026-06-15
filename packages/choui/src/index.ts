// Public barrel for `choui`.
//
// Unlike the app's bootstrap, this barrel has NO side effects — importing it
// registers nothing. The consuming app composes the packs explicitly (its
// bootstrap calls `registerInlineTags(coreInlineTags)` etc. in the order it
// wants), which is what keeps registration order an app decision rather than a
// module-evaluation accident. Community packs depend only on `./contract`
// (inline) or `./scene-processors` (`SceneSurface`, runtime); see those modules.
//
// The tag-name manifest is exported from the dedicated `./manifest` subpath (a
// pure-string module) so the compiler/validator can read the vocabulary without
// pulling React in.

// Components first — the universal layer (any React game). The full set of
// standalone components is also available React-only via the `./ui` subpath.
export * from "./ui";

// The markup renderer (the optional bracket-markup layer) and its factory, also
// available via the `./markup` subpath for engines that emit authored markup.
export {
  createStoryMarkup,
  DEFAULT_MARKUP_PREFIX,
  StoryMarkup,
  type CreateStoryMarkupOptions,
  type StoryMarkupProps,
} from "./markup-renderer";

// Inline-tag contract (React-types-only).
export type {
  InlineTagDefinition,
  InlineTagKind,
  InlineTagRenderContext,
  InlineTagRuntime,
} from "./contract";

// Engine-integration contract — the four host operations the interactive tags
// need (read / set / select / observe). See `./markup` and the adapter guide.
export type { StoryStateAdapter, StoryVariableValue } from "./adapter";

// Inline-tag registry.
export {
  getInlineTag,
  getInlineTagNames,
  hasInlineTag,
  registerInlineTag,
  registerInlineTags,
} from "./registry";

// Pack-style registry (CSS shipped by a pack, injected once by the reader).
export { getRegisteredTagStyles, registerTagStyles } from "./styles";

// Runtime scene-processor registry + the minimal `SceneSurface` contract.
export type {
  SceneProcessor,
  SceneProcessorContext,
  SceneProcessorFactory,
  SceneSurface,
} from "./scene-processors";
export {
  getSceneProcessors,
  registerSceneProcessor,
  registerSceneProcessors,
} from "./scene-processors";

// Packs shipped by this package.
export { coreInlineTags } from "./builtins";
export { kbdPack } from "./packs/kbd";
export { phoneChatPack } from "./packs/phone-chat";
export { daisyDisplayPack } from "./packs/daisy-display";
export { daisySequencePack } from "./packs/daisy-sequence";
export { daisyMotionPack } from "./packs/daisy-motion";
export { gamePack } from "./packs/game";
export { registerSampleRuntimePacks } from "./runtime";

// Component manifest (pure data, also available React-free via the `./manifest`
// subpath). Re-exported here so React-side consumers — the Ladle stories and
// docs catalog — can read the inventory from the single barrel.
export type {
  InlineTagManifestEntry,
  RuntimeTagDirective,
  RuntimeTagManifestEntry,
} from "./manifest";
export {
  INLINE_TAG_MANIFEST,
  INLINE_TAG_NAMES,
  INLINE_TAG_PROPS,
  RUNTIME_SAMPLE_TAG_NAMES,
  RUNTIME_TAG_MANIFEST,
} from "./manifest";

// Declarative prop schema + coercion (pure data, also available React-free via
// the `./props` subpath). The Ladle controls and docs prop tables derive from
// these types; `coerceProps` is the render-boundary coercion the reader runs.
export type {
  CoercedValue,
  CoerceResult,
  PropDescriptor,
  PropSchema,
  PropType,
  PropWarning,
  PropWarningCode,
} from "./props";
export { coerceProps } from "./props";

// Pure notation helpers for the `dice` visualizer and future meta-tags (parse,
// predetermined notation from a roll or from explicit values, and the self-roll
// source used by the Ladle tuning story). The components themselves (`DiceRoller`,
// `Img`, `Picture`, `Icon`/`ICON_NAMES`, …) come from the `./ui` re-export above.
export type { RollResult, RollSpec } from "./logic/random";
export {
  parseNotation,
  predeterminedNotation,
  predeterminedNotationFor,
  rollNotation,
} from "./logic/random";
