// Sample runtime-pack registration (package-bound).
//
// This module is part of the future `chogui` package: it knows
// only about the package's own sample community runtime pack(s) — currently the
// `fx` pack (`# fx: <name>` → `className`), the runtime twin of the inline
// `[kbd]` sample. It does NOT import the app's session processors
// (preview-mode / pause); those are app concerns the app bootstrap owns.
//
// Registration is an explicit, idempotent call rather than an import side
// effect so the *app bootstrap* controls ordering: it registers its session
// processors (preview-mode → pause) first, then calls this to append the
// package samples last (the documented preview-mode → pause → community order).
// A side-effecting import here would register `fx` before the app processors,
// breaking that order.

import { fxSceneProcessor, fxStyles } from "./packs/fx";
import { registerSceneProcessor } from "./scene-processors";
import { registerTagStyles } from "./styles";

let registered = false;

/**
 * Append the package's sample community runtime pack(s) to the scene-processor
 * registry. Idempotent — safe to call from more than one entry point. The pack
 * also carries its own CSS (`fxStyles`, a plain string constant in `./packs/fx`),
 * registered here so the reader injects it once (the runtime twin of an inline
 * pack's `styles` field).
 */
export function registerSampleRuntimePacks(): void {
  if (registered) return;
  registered = true;
  registerSceneProcessor(() => fxSceneProcessor);
  registerTagStyles("fx", fxStyles);
}
