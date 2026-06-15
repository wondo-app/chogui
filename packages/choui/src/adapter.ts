// StoryStateAdapter — the engine-integration contract.
//
// The interactive tags (`[link]`, `[board]`, `[progress value="{var}"]`, …) need
// four things from a host story engine: read a variable, set a variable, select a
// choice, and observe variable changes. This interface names those four
// operations so any web/DOM engine that emits authored text verbatim and exposes
// a JS variable store can drive the library — the tags depend on this surface,
// never on a specific engine.
//
// It is the same surface `InlineTagRenderContext.runtime` (`InlineTagRuntime`)
// already consumes; an adapter is just the host-side provider of those fields:
//
//   observedVars   ← a snapshot the host builds by `readVariable`-ing the
//                     observed names; re-supplied after every `observe` tick
//   onSetVariable  ← setVariable
//   onSelectChoice ← selectChoice
//   choices        ← the host's pending-choice list (engine-specific; not part
//                     of this adapter, which covers only the variable/choice ops)
//
// Reference implementation: Wondo's `atrament-bridge.ts` (Ink) — `getVariables`
// / `setVariable` / `choose` plus the `onDidContinue` emitter for `observe`. See
// `docs/story-state-adapter.md` for the guide to implementing one for another
// engine, including the host-owned rehydration responsibility.

/** A scalar story-variable value the tags read and write. */
export type StoryVariableValue = number | string | boolean;

export interface StoryStateAdapter {
	/**
	 * Read the current value of a scalar story variable, or `undefined` if it is
	 * not set / not observed. The host typically builds the render context's
	 * `observedVars` snapshot by reading the observed names through this.
	 */
	readVariable(name: string): StoryVariableValue | undefined;

	/**
	 * Set a scalar story variable in response to an interaction — the write twin
	 * of {@link readVariable}. The host routes this into its engine's variable
	 * store; persisting the value across save/reload is the host's responsibility
	 * (see the rehydration note in the guide). Maps to `onSetVariable`.
	 */
	setVariable(name: string, value: StoryVariableValue): void;

	/**
	 * Select a pending branch choice by id, advancing the narration. Maps to
	 * `onSelectChoice`; the id is the value carried on the host's pending-choice
	 * entries.
	 */
	selectChoice(id: number): void;

	/**
	 * Subscribe to variable changes. The host calls `callback` whenever observed
	 * state may have changed (e.g. after the story advances), so a consumer can
	 * re-read variables and re-render. Returns an unsubscribe function.
	 */
	observe(callback: () => void): () => void;
}
