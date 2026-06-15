# Implementing a `StoryStateAdapter`

The interactive tags don't know about any story engine. They read and write
**scalar variables** and **select choices** through four operations. Provide them
and the library drives your engine.

```ts
import type { StoryStateAdapter } from "chogui";

interface StoryStateAdapter {
  readVariable(name: string): number | string | boolean | undefined;
  setVariable(name: string, value: number | string | boolean): void;
  selectChoice(id: number): void;
  observe(callback: () => void): () => void; // subscribe; returns unsubscribe
}
```

## Host requirements

Any engine can be adapted if it meets three conditions:

1. **A web/DOM render target.** The components are React; the markup renderer uses
   the DOM parser, so it runs client-side (never SSR'd).
2. **Authored text is emitted verbatim.** The tags appear in the prose your engine
   produces, untouched, so the renderer can find and replace them. (Engines that
   pass unknown tags straight through — like Ink — satisfy this for free.)
3. **A JS variable store.** Scalars the tags read (`readVariable`) and write
   (`setVariable`) live in an in-memory store you can get/set synchronously.

## Wiring it to the renderer

The adapter is the host-side provider of the renderer's runtime context
(`InlineTagRuntime`). Map them directly:

| Adapter operation | Render-context field |
| --- | --- |
| build a snapshot via `readVariable` over the observed names | `observedVars` |
| `setVariable` | `onSetVariable` |
| `selectChoice` | `onSelectChoice` |
| `observe` → re-read variables → re-render | (drives re-supplying `observedVars`) |

On every `observe` tick, re-read the observed variables, rebuild the
`observedVars` snapshot, and re-render so tags reflect the new state.

## Rehydration is the host's job

The library holds no state across reload. When a tag writes a variable via
`setVariable`, persisting it is **your** responsibility: your save format captures
the scalar variables, and on reload you re-supply them as `observedVars` so the
tag renders its persisted value. The library neither saves nor restores — it only
reads what you provide and writes through the adapter.

## Reference implementation: Wondo's Ink bridge

Wondo's `src/lib/narrator/atrament-bridge.ts` implements the adapter over inkjs:

| Operation | inkjs |
| --- | --- |
| `readVariable` | `getVariables()` (the `# observe:`d set) |
| `setVariable` | writes `variablesState` |
| `selectChoice` | `choose(id)` |
| `observe` | the `onDidContinue` event emitter |

Rehydration rides on Atrament's replay save, which snapshots the variable state;
on reload the bridge re-supplies those values as `observedVars`.

> Only the Ink reference adapter ships. Adapters for other engines (Yarn Spinner,
> Twine/SugarCube, a bespoke web engine) are implementable against this same
> interface but are not provided.
