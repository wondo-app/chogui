// Sample community tag pack (runtime): `# fx: <name>` tags a beat for styling.
//
// This is the runtime twin of the inline `[kbd]` sample (`./kbd.tsx`): it proves
// the contributor path for a *runtime* tag. A community pack reads an authored
// output tag and sets a value in the bridge-directive vocabulary — here the
// `className` directive — which the reader honors on the beat's rendered
// element. The pack ships its *own* CSS (`./fx.css`, compiled at build time via
// the `?inline` import below and registered in `../runtime.ts`); an un-bundled
// pack injects nothing, so an un-enabled `# fx` name is inert, exactly like an
// un-themed `# THEME`. A contributor opens a PR against the curated
// `wondo-app/story-tags` repo and an operator enables it by registering the
// processor (here, in `../runtime.ts`) and adding the name to the validator's
// enabled set.
//
// Like the inline `[kbd]` sample, this pack imports only the package contract —
// here the runtime half, the `SceneSurface` type (the bridge-directive
// vocabulary `paused` / `autoAdvanceMs` / `className` over a structural scene
// shape) — never the reader's `AtramentScene`. The community-facing contract is
// that vocabulary, not the full scene shape.

import type { SceneSurface } from "../scene-processors";

// The pack's co-located CSS as a plain string constant (same convention as the
// `daisy-*` packs' `TIMELINE_STYLES` / `HOVER_GALLERY_STYLES`): static, never
// interpolated, and Tailwind-free so the library bundles it with no host
// toolchain. `@apply italic` resolves to `font-style: italic`; theme values stay
// as `var(--color-*)`, resolved at runtime by the consuming app's theme.
// `../runtime.ts` registers it; the reader injects it once.
const fxStyles = `.choui-fx-aside{font-style:italic;border-left:2px solid color-mix(in oklab, var(--color-primary) 45%, transparent);padding-left:1.25rem;opacity:0.85}`;

export { fxStyles };

// Turn an authored `# fx` value into a namespaced, safe class token. The class
// is rendered as a React `className` attribute value (auto-escaped — no
// injection), and we additionally restrict it to `choui-fx-[a-z0-9-]+` so a
// processor can never emit an arbitrary or unsafe class. Empty/whitespace/
// non-string values → undefined (no class), mirroring presence-only `# pause`.
function fxClassName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `choui-fx-${slug}` : undefined;
}

export function fxSceneProcessor(scene: SceneSurface): void {
  // Scene-level tag first; check both casings like `pauseSceneProcessor`.
  let className = fxClassName(scene.tags?.fx ?? scene.tags?.FX);

  // Fall back to the first paragraph-level `# fx` tag.
  if (className === undefined && Array.isArray(scene.content)) {
    for (const paragraph of scene.content) {
      const pTags = (paragraph as { tags?: Record<string, unknown> }).tags;
      const cn = fxClassName(pTags?.fx ?? pTags?.FX);
      if (cn !== undefined) {
        className = cn;
        break;
      }
    }
  }

  if (className !== undefined) scene.className = className;
}
