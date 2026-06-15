// Scene-processor registry — the runtime half of the story-tag contract.
//
// Mirrors the inline-tag registry (./registry) for runtime behaviors. A scene
// processor runs after Atrament builds each scene and may set the stable
// *bridge-directive* fields the reader's halt boundary honors:
//
//   - `paused: boolean`        — halt the walk; the reader shows Continue
//   - `autoAdvanceMs?: number` — when paused, auto-advance after N ms
//   - `className?: string`     — CSS class tokens applied to the rendered beat
//
// These fields ARE the contract for parameterized runtime tags. A community
// processor that stays within them (e.g. re-parameterizing `pause` as
// `# pause: 5s`, or `# fx: <name>` → `className`) is fully expressible through
// this registry. A net-new directive kind — a new scene field the reader must
// act on — still needs a Wondo bridge release to add it to the vocabulary; it
// is not arbitrary runtime behavior for free.
//
// The processor argument is a minimal `SceneSurface` — the directive vocabulary
// over a structural read shape (`tags`, `content[].tags`) — NOT the reader's
// full `AtramentScene`. This keeps the runtime contract Wondo-internal-free, the
// runtime twin of ./contract's React-types-only inline contract. The live
// `AtramentScene` is structurally assignable to `SceneSurface`, so the narrator
// runs these processors over the real scene with no cast (see atrament/init.ts).
//
// Processors are registered as *factories* so they can read per-session
// context (e.g. the preview flag) at instantiation time. `getSceneProcessors`
// returns the instantiated processors in registration order; `init.ts`
// defines them on the Atrament game in that order. Registration order is the
// documented contract: preview-mode → pause → community-appended. `init.ts`
// carries no hard-coded processor knowledge — it is a pure registry consumer.

/**
 * Minimal structural scene shape a processor reads from and writes directives
 * to. The reader's `AtramentScene` is structurally assignable to this, so the
 * narrator passes the real scene without a cast; packs depend only on this type,
 * never on `AtramentScene`.
 */
export interface SceneSurface {
  /** Scene-level output tags (`# pause`, `# fx`, …), keyed by tag name. */
  tags?: Record<string, unknown>;
  /** Paragraph-level scenes, each carrying its own output tags. */
  content?: Array<{ tags?: Record<string, unknown> }>;
  /** Bridge-directive: halt the walk; the reader shows a Continue affordance. */
  paused?: boolean;
  /** Bridge-directive: when paused, auto-advance past the halt after N ms. */
  autoAdvanceMs?: number;
  /** Bridge-directive: CSS class tokens applied to the rendered beat element. */
  className?: string;
  /** Bridge-directive: preview-mode session flag for the reader's paywall logic. */
  previewMode?: boolean;
}

export interface SceneProcessorContext {
  /** Preview-mode session flag (paywall/entitlement suppression). */
  preview: boolean;
}

export type SceneProcessor = (scene: SceneSurface) => void;
export type SceneProcessorFactory = (ctx: SceneProcessorContext) => SceneProcessor;

const factories: SceneProcessorFactory[] = [];

export function registerSceneProcessor(factory: SceneProcessorFactory): void {
  factories.push(factory);
}

export function registerSceneProcessors(list: SceneProcessorFactory[]): void {
  for (const factory of list) factories.push(factory);
}

export function getSceneProcessors(ctx: SceneProcessorContext): SceneProcessor[] {
  return factories.map((factory) => factory(ctx));
}
